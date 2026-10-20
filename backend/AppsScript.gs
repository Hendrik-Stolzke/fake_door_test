/** @OnlyCurrentDoc */
/* =====================================================================
   APPS-SCRIPT-BACKEND – schreibe Events in ein Google Sheet
   (kostenlos, kein eigener Server nötig)

   EINRICHTUNG (siehe auch README.md, Abschnitt "Tracking einrichten"):
   1. Neues Google Sheet anlegen (sheets.new).
   2. IM SHEET: Menü "Erweiterungen" -> "Apps Script". (Nur so ist das Skript
      mit dem Sheet verbunden. NICHT über script.google.com neu anlegen!)
   3. Den kompletten Inhalt dieser Datei in den Editor kopieren
      (bestehenden Beispielcode ersetzen) und speichern.
   4. Oben rechts "Bereitstellen" -> "Neue Bereitstellung".
   5. Typ auswählen: "Web-App".
      - Ausführen als: "Ich" (deine E-Mail)
      - Wer hat Zugriff: "Jeder" (Anyone; je nach Sprache auch "Alle")
   6. "Bereitstellen" klicken, Berechtigungen bestätigen.
   7. Die angezeigte Web-App-URL (endet auf /exec) kopieren und in
      js/config.js bei "trackingWebAppUrl" einfügen.
   8. Selbsttest: <URL>?action=stats im Browser öffnen -> es muss
      {"ok":true,...,"version":"..."} erscheinen.

   ⚠️ WICHTIG, falls du diesen Code SPÄTER nochmal änderst: Eine
   Web-App-Bereitstellung ist ein eingefrorener Schnappschuss. Nur
   Speichern (Strg/Cmd+S) reicht NICHT -- du musst danach
   "Bereitstellen" -> "Bereitstellungen verwalten" -> Stift-Symbol ->
   bei "Version" "Neue Version" wählen -> "Bereitstellen" klicken
   (NICHT "Neue Bereitstellung": die erzeugt eine neue URL und alle
   Besucher schicken ihre Daten weiter an die alte).

   OPTIONAL
   - Zugriffsschutz der Auswertung: Zahnrad "Projekteinstellungen" ->
     "Skripteigenschaften" -> Eigenschaft STATS_KEY mit einem langen
     Zufallswert anlegen. Dann öffnest du die Auswertung mit
     auswertung.html?key=DEIN_WERT. Ohne STATS_KEY ist ?action=stats
     für jeden mit der URL lesbar (enthält nur Zahlen, keine E-Mails).
   - Löschfristen: Uhr-Symbol "Trigger" -> "Trigger hinzufügen" ->
     Funktion purgeOld, Ereignisquelle "Zeitgesteuert", "Tagestimer".
     purgeOld löscht Zeilen älter als RETENTION_EVENT_DAYS bzw.
     RETENTION_EMAIL_DAYS (unten). Diese Werte MÜSSEN zu den Texten
     retentionEvents/retentionEmails in js/config.js passen.
   ===================================================================== */

const VERSION = "2026-10";          // wird auf auswertung.html angezeigt ("Backend veraltet?")
const SHEET_NAME = "Events";
const HEADER = ["Zeitstempel", "Event", "TuerID", "TuerName", "SessionID", "Wert", "EMail", "Seite", "Browser", "Referrer", "Einwilligung"];

const RETENTION_EVENT_DAYS = 180;   // "6 Monate nach Erhebung"
const RETENTION_EMAIL_DAYS = 365;   // "12 Monate nach Erhebung"
const MAX_ROWS = 100000;            // Zeilendeckel (11 Spalten -> 1,1 Mio. Zellen; Sheet-Limit 10 Mio.)
const MAX_BATCH = 50;               // Events pro Anfrage
const MAX_BODY = 60000;             // Zeichen pro Anfrage
const MAX_PER_SESSION = 120;        // Events je Besucher-ID und 10 Minuten
const MAX_PER_HOUR = 20000;         // Events insgesamt pro Stunde (Kampagnen-Spitzen einkalkuliert)

// Nur diese Events werden angenommen -- alles andere ist Müll oder Angriff.
const EVENTS = ["door_impression", "door_click", "page_view", "reserve_click", "email_modal_abandon", "email_submit", "page_duration"];
const RE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const RE_DOOR = /^([a-z0-9][a-z0-9_-]{0,39})?$/i;       // beginnt mit Buchstabe/Ziffer: schließt "__proto__" aus
const RE_PAGE = /^([a-z0-9][a-z0-9_.\/?=-]{0,99})?$/i;
const RE_SESSION = /^([A-Za-z0-9_-]{1,64})?$/;
const RE_CONSENT = /^(email-v\d{1,3})?$/;                // Version des Einwilligungstextes (Nachweis)
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Der Endpunkt ist öffentlich: JEDER kann Daten hinschicken. Deshalb alles
   als Text begrenzen und Formel-Einschleusung verhindern. Führende
   Formel-/Leerraum-Zeichen werden ENTFERNT (ein Apostroph-Präfix würde im
   CSV/Excel-Export wieder verschwinden). */
function clean(v) {
  return String(v === undefined || v === null ? "" : v)
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ")
    .replace(/^[\s=+\-@\u200b-\u200f\u2060\ufeff\uff1d\uff0b\uff0d\uff20]+/, "")
    .slice(0, 500);
}

/* Prüft EIN Event; gibt die Tabellenzeile (ohne Zeitstempel) zurück oder null. */
function toRow(d) {
  if (!d || typeof d !== "object" || Array.isArray(d) || EVENTS.indexOf(d.event) === -1) return null;
  const s = function (v) { return v === undefined || v === null ? "" : String(v); };
  const doorId = s(d.doorId), page = s(d.page), sid = s(d.sessionId), consent = s(d.consent), id = s(d.id);
  if (!RE_DOOR.test(doorId) || !RE_PAGE.test(page) || !RE_SESSION.test(sid) || !RE_CONSENT.test(consent)) return null;
  if (id && !RE_ID.test(id)) return null;
  let value = "";
  if (d.value !== undefined && d.value !== null && d.value !== "") {
    if (typeof d.value !== "number" || !isFinite(d.value) || d.value < 0 || d.value > 86400) return null;
    value = d.value;
  }
  let email = "";
  if (d.event === "email_submit") {
    email = d.email;
    if (typeof email !== "string" || email.length > 254 || !RE_EMAIL.test(email) || clean(email) !== email) return null;
    if (!consent) return null; // ohne Einwilligungsversion keine E-Mail speichern
  }
  return { id: id, sid: sid, event: d.event, row: [clean(d.event), doorId, clean(d.doorTitle), sid, value, email, page, clean(d.userAgent), clean(d.referrer), consent] };
}

function doPost(e) {
  let lock = null;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_BODY) return jsonOutput({ ok: false });
    const parsed = JSON.parse(raw);
    const list = (Array.isArray(parsed) ? parsed : [parsed]).slice(0, MAX_BATCH);
    const items = list.map(toRow).filter(Boolean);
    if (items.length === 0) return jsonOutput({ ok: false });

    lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const cache = CacheService.getScriptCache();

    // Idempotenz: Event-IDs, die schon verarbeitet wurden (Retry, Reload), überspringen.
    const seen = cache.getAll(items.filter(function (i) { return i.id; }).map(function (i) { return "e_" + i.id; }));
    const inBatch = Object.create(null);
    let fresh = items.filter(function (i) {
      if (!i.id) return true;
      if (seen["e_" + i.id] || inBatch[i.id]) return false;
      inBatch[i.id] = true;
      return true;
    });

    // Rate-Limit: je Besucher-ID und insgesamt pro Stunde. E-Mails sind davon ausgenommen
    // (sonst könnte ein Angreifer mit fremder ID Anmeldungen blockieren), zählen aber global.
    const hourKey = "rl_h_" + Math.floor(Date.now() / 3600000);
    const hourCount = Number(cache.get(hourKey) || 0);
    const sKeys = fresh.filter(function (i) { return i.sid && i.event !== "email_submit"; }).map(function (i) { return "rl_" + i.sid; });
    const sCounts = cache.getAll(sKeys);
    const used = Object.create(null);
    fresh = fresh.filter(function (i, n) {
      if (hourCount + n >= MAX_PER_HOUR) return false;
      if (!i.sid || i.event === "email_submit") return true;
      const k = "rl_" + i.sid;
      used[k] = (used[k] || Number(sCounts[k] || 0)) + 1;
      return used[k] <= MAX_PER_SESSION;
    });
    if (fresh.length === 0) return jsonOutput({ ok: true, written: 0, version: VERSION });

    const sheet = getSheet();
    if (sheet.getLastRow() + fresh.length > MAX_ROWS) return jsonOutput({ ok: false });
    const now = new Date();
    const rows = fresh.map(function (i) { return [now].concat(i.row); });
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);

    const put = Object.create(null);
    fresh.forEach(function (i) { if (i.id) put["e_" + i.id] = "1"; });
    cache.putAll(put, 21600);
    const putS = Object.create(null);
    Object.keys(used).forEach(function (k) { putS[k] = String(used[k]); });
    cache.putAll(putS, 600);
    cache.put(hourKey, String(hourCount + fresh.length), 3600);
    return jsonOutput({ ok: true, written: rows.length, version: VERSION });
  } catch (err) {
    console.error(err); // Details nur im Ausführungsprotokoll, nicht an den Aufrufer
    return jsonOutput({ ok: false });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e2) { /* ignore */ } }
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === "stats") {
      const key = PropertiesService.getScriptProperties().getProperty("STATS_KEY");
      if (key && p.key !== key) return jsonOutput({ ok: false, error: "key", version: VERSION }, p.callback);
      return jsonOutput(cachedStats(), p.callback);
    }
    return jsonOutput({ ok: true, version: VERSION, message: "Fake-Door-Tracking-API laeuft. Nutze ?action=stats fuer die Auswertung." }, p.callback);
  } catch (err) {
    console.error(err);
    return jsonOutput({ ok: false, error: "fehler", version: VERSION }, p.callback);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Skript ist nicht mit einem Sheet verbunden: im Sheet ueber Erweiterungen -> Apps Script oeffnen");
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  } else if (sheet.getRange(1, HEADER.length).getValue() === "") {
    // älteres Sheet ohne Spalte "Einwilligung": Kopfzeile ergänzen
    if (sheet.getMaxColumns() < HEADER.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADER.length - sheet.getMaxColumns());
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
  }
  return sheet;
}

/* Statistik wird 2 Minuten zwischengespeichert: Das Dashboard liest sonst bei
   jedem Aufruf das GANZE Sheet (Quota, Tempo). */
function cachedStats() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("stats_v1");
  if (hit) return hit;
  const json = JSON.stringify(buildStats());
  try { cache.put("stats_v1", json, 120); } catch (err) { /* >100 KB: nicht cachen */ }
  return json;
}

/* Fasst alle Events pro Tuer + Eventtyp zusammen, inkl. Verweildauer --
   sowohl gesamt als auch JE PRODUKT (avgDurationSeconds pro Tuer in
   "doors"). counts zählt VERSCHIEDENE Besucher-IDs (bzw. verschiedene
   E-Mail-Adressen bei email_submit), nicht rohe Zeilen -- sonst zählt eine
   Person mit 10 Klicks als 10 Interessierte. ZUSÄTZLICH in "pages":
   Verweildauer JE SEITE (Produktseiten stecken in "doors"). */
function buildStats() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // Header weg

  // Object.create(null): Schlüssel wie "__proto__" oder "constructor" sind harmlos.
  const perDoor = Object.create(null);  // { doorId: { title, counts: { event: n }, avgDurationSeconds } }
  const perPage = Object.create(null);  // { "team": { avgDurationSeconds, pageViews } }
  const seenKeys = Object.create(null); // doorId|event|schlüssel -> true (Dedup)
  const sessions = Object.create(null);
  const emails = Object.create(null);
  let totalDurationSeconds = 0, durationSamples = 0, last = 0;

  rows.forEach(function (r, n) {
    const event = String(r[1]), doorId = r[2] || "_ohne_tuer", doorTitle = r[3], page = String(r[7] || "");
    const value = r[5], sid = String(r[4] || "");
    if (r[0] instanceof Date && r[0].getTime() > last) last = r[0].getTime();
    if (sid) sessions[sid] = true;

    if (!perDoor[doorId]) perDoor[doorId] = { title: doorTitle || doorId, counts: Object.create(null), _durTotal: 0, _durSamples: 0 };
    const d = perDoor[doorId];
    if (doorTitle) d.title = doorTitle;

    let who = sid || "r" + n; // ohne Besucher-ID zählt jede Zeile einzeln
    if (event === "email_submit") { who = "m:" + String(r[6]).toLowerCase(); emails[who] = true; }
    const dk = doorId + "|" + event + "|" + who;
    if (!seenKeys[dk]) { seenKeys[dk] = true; d.counts[event] = (d.counts[event] || 0) + 1; }

    if (event === "page_view" && doorId === "_ohne_tuer") {
      const pKey = page || "unbekannt";
      if (!perPage[pKey]) perPage[pKey] = { pageViews: 0, _durTotal: 0, _durSamples: 0 };
      perPage[pKey].pageViews += 1;
    }

    if (event === "page_duration" && typeof value === "number") {
      totalDurationSeconds += value;
      durationSamples += 1;
      d._durTotal += value;
      d._durSamples += 1;
      if (doorId === "_ohne_tuer") {
        const pKey = page || "unbekannt";
        if (!perPage[pKey]) perPage[pKey] = { pageViews: 0, _durTotal: 0, _durSamples: 0 };
        perPage[pKey]._durTotal += value;
        perPage[pKey]._durSamples += 1;
      }
    }
  });

  Object.keys(perDoor).forEach(function (id) {
    const d = perDoor[id];
    d.avgDurationSeconds = d._durSamples ? Math.round(d._durTotal / d._durSamples) : 0;
    delete d._durTotal;
    delete d._durSamples;
  });
  Object.keys(perPage).forEach(function (key) {
    const p = perPage[key];
    p.avgDurationSeconds = p._durSamples ? Math.round(p._durTotal / p._durSamples) : 0;
    delete p._durTotal;
    delete p._durSamples;
  });

  return {
    ok: true,
    version: VERSION,
    totalEvents: rows.length,
    totalEmails: Object.keys(emails).length,   // verschiedene Adressen
    totalSessions: Object.keys(sessions).length,
    avgDurationSeconds: durationSamples ? Math.round(totalDurationSeconds / durationSamples) : 0,
    doors: perDoor,
    pages: perPage,
    lastEventAt: last ? new Date(last).toISOString() : null,
    generatedAt: new Date().toISOString(),
  };
}

/* Löscht Zeilen nach Ablauf der Fristen (siehe RETENTION_*). Per Zeit-Trigger
   täglich ausführen lassen (Anleitung oben) oder von Hand starten. */
function purgeOld() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const now = Date.now(), day = 86400000;
  const old = sheet.getRange(2, 1, last - 1, 2).getValues().map(function (r) {
    const max = (r[1] === "email_submit" ? RETENTION_EMAIL_DAYS : RETENTION_EVENT_DAYS) * day;
    return r[0] instanceof Date && now - r[0].getTime() > max;
  });
  let deleted = 0;
  for (let i = old.length - 1; i >= 0; i--) { // von unten, zusammenhängende Blöcke auf einmal
    if (!old[i]) continue;
    let j = i;
    while (j > 0 && old[j - 1]) j--;
    sheet.deleteRows(j + 2, i - j + 1);
    deleted += i - j + 1;
    i = j;
  }
  CacheService.getScriptCache().remove("stats_v1");
  return deleted;
}

/* Antwort als JSON -- oder, mit "callback"-Parameter, als JSONP für
   auswertung.html (Apps Script setzt bei ContentService-Antworten keinen
   CORS-Header; ein <script>-Tag umgeht das). Der Callback-Name ist auf
   fdt_cb_<Zeichen> begrenzt, damit niemand beliebigen Code ausführen lässt. */
function jsonOutput(obj, callback) {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  if (callback && /^fdt_cb_[A-Za-z0-9_]{1,40}$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
