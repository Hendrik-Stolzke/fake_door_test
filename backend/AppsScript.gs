/* =====================================================================
   APPS-SCRIPT-BACKEND – schreibe Events in ein Google Sheet
   (kostenlos, kein eigener Server nötig)

   EINRICHTUNG (siehe auch README.md, Abschnitt "Tracking einrichten"):
   1. Neues Google Sheet anlegen (sheets.new).
   2. Menü "Erweiterungen" -> "Apps Script".
   3. Den kompletten Inhalt dieser Datei in den Editor kopieren
      (bestehenden Beispielcode ersetzen) und speichern.
   4. Oben rechts "Bereitstellen" -> "Neue Bereitstellung".
   5. Typ auswählen: "Web-App".
      - Ausführen als: "Ich" (deine E-Mail)
      - Zugriff: "Jeder" (Anyone)
   6. "Bereitstellen" klicken, Berechtigungen bestätigen.
   7. Die angezeigte Web-App-URL kopieren und in js/config.js bei
      "trackingWebAppUrl" einfügen.
   8. Fertig! Alle Klicks landen jetzt automatisch als neue Zeile im
      Tabellenblatt "Events". auswertung.html liest über diese URL
      (mit ?action=stats) eine Zusammenfassung aus.

   ⚠️ WICHTIG, falls du diesen Code SPÄTER nochmal änderst: Eine
   Web-App-Bereitstellung ist ein eingefrorener Schnappschuss. Nur
   Speichern (Strg/Cmd+S) reicht NICHT -- du musst danach erneut
   "Bereitstellen" -> "Bereitstellungen verwalten" -> Stift-Symbol bei
   deiner Web-App -> bei "Version" "Neue Version" wählen -> "Bereitstellen"
   klicken, sonst läuft weiterhin der alte Code (die URL bleibt gleich).
   Genau das ist die häufigste Fehlerursache, wenn "Script-Funktion
   nicht gefunden" erscheint.
   ===================================================================== */

const SHEET_NAME = "Events";
const HEADER = ["Zeitstempel", "Event", "TuerID", "TuerName", "SessionID", "Wert", "EMail", "Seite", "Browser", "Referrer"];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    appendEvent(data);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  const callback = e && e.parameter && e.parameter.callback;

  if (action === "stats") {
    return jsonOutput(buildStats(), callback);
  }
  return jsonOutput({ ok: true, message: "Fake-Door-Tracking-API laeuft. Nutze ?action=stats fuer die Auswertung." }, callback);
}

function appendEvent(data) {
  const sheet = getSheet();
  sheet.appendRow([
    new Date(),
    data.event || "",
    data.doorId || "",
    data.doorTitle || "",
    data.sessionId || "",
    data.value !== undefined ? data.value : "",
    data.email || "",
    data.page || "",
    data.userAgent || "",
    data.referrer || "",
  ]);
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* Fasst alle Events pro Tuer + Eventtyp zusammen, inkl. Gesamt-
   Verweildauer, fuer die Anzeige in auswertung.html */
function buildStats() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // Header weg

  const perDoor = {};       // { doorId: { title, counts: { event: n } } }
  let totalDurationSeconds = 0;
  let durationSamples = 0;
  let emails = 0;

  rows.forEach(function (r) {
    const event = r[1], doorId = r[2] || "_ohne_tuer", doorTitle = r[3];
    const value = r[5];

    if (!perDoor[doorId]) perDoor[doorId] = { title: doorTitle || doorId, counts: {} };
    perDoor[doorId].counts[event] = (perDoor[doorId].counts[event] || 0) + 1;
    if (doorTitle) perDoor[doorId].title = doorTitle;

    if (event === "page_duration" && typeof value === "number") {
      totalDurationSeconds += value;
      durationSamples += 1;
    }
    if (event === "email_submit") emails += 1;
  });

  return {
    ok: true,
    totalEvents: rows.length,
    totalEmails: emails,
    avgDurationSeconds: durationSamples ? Math.round(totalDurationSeconds / durationSamples) : 0,
    doors: perDoor,
    generatedAt: new Date().toISOString(),
  };
}

/* Google Apps Script setzt bei ContentService-Antworten KEINEN
   "Access-Control-Allow-Origin"-Header -- ruft man ?action=stats per
   fetch() von einer anderen Domain auf, blockiert der Browser das per
   CORS. Deshalb unterstützen wir zusätzlich JSONP: Ist ein "callback"-
   Parameter gesetzt, liefern wir statt reinem JSON ausführbares
   JavaScript ("callbackName(<json>)"), das auswertung.html per
   <script>-Tag einbindet -- das umgeht CORS vollständig. */
function jsonOutput(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback && /^[a-zA-Z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
