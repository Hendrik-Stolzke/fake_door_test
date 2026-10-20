/* =====================================================================
   TRACKING-KERN
   Zeichnet Events auf (Seitenaufruf, Klicks, Popup geöffnet/abgebrochen,
   E-Mail, Verweildauer -- pro Seite/Produkt getrennt) und schickt sie:
     1) an dein kostenloses Google Sheet (wenn trackingWebAppUrl gesetzt ist)
     2) zusätzlich lokal in den Browser-Speicher (localStorage),
        als Fallback/Debug -- sichtbar auf auswertung.html

   RECHTLICH WICHTIG:
   - Nutzungsmessung (Seitenaufrufe, Klicks, Verweildauer, Besucher-ID) läuft
     NUR nach Zustimmung im Banner (§ 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
   - Die E-Mail-Adresse ist davon getrennt: Sie wird nur gespeichert, wenn die
     Person sie aktiv eingibt UND die eigene Einwilligungs-Checkbox im Popup
     anhakt. Sie wird auch ohne Tracking-Zustimmung gespeichert -- und zwar
     IMMER ohne Besucher-ID, Browser-Kennung und Referrer (Datenminimierung),
     auch wenn die Person dem Tracking zugestimmt hat.

   ZUSTELLUNG
   - Messdaten werden gebündelt (ein Request pro Seitenbesuch, beim Verlassen
     bzw. Verstecken der Seite). Verlorene Messdaten sind verschmerzbar.
   - Die E-Mail wird sofort gesendet, mit Zeitlimit und Wiederholungen
     (gleiche Event-ID -> das Backend legt keine Dublette an). Nur wenn der
     Versand technisch gelingt, zeigt die Seite "Danke". Grenze: Die Antwort
     von Google ist wegen "no-cors" nicht lesbar -- ein Fehler INNERHALB von
     Google (z.B. Kontingent) bleibt unsichtbar. Darum README-Selbsttest!
   ===================================================================== */

(function (window) {
  "use strict";

  const CONSENT_KEY = "fdt_consent";          // "granted" | "denied"
  const SESSION_KEY = "fdt_session_id";
  const LOCAL_EVENTS_KEY = "fdt_events";
  const IGNORE_KEY = "fdt_ignore";            // gesetzt durch ?ignore (eigene Besuche nicht zählen)
  const MAX_LOCAL_EVENTS = 1000;
  const BATCH_MAX = 30;
  const TIMEOUT_MS = 8000;
  const RETRIES = 2;

  // Seitenname ohne ".html" und ohne Ordner: "team", "index", "produkt" -- gleich auf
  // Netlify/Cloudflare (Pretty URLs), GitHub Pages (/repo/team.html) und lokal.
  const currentPage = (window.location.pathname.split("/").pop().replace(/\.html?$/i, "") || "index").toLowerCase();

  // auswertung ist das interne Dashboard -- eigene Besuche dort sollen die Auswertung nicht verfälschen.
  const EXCLUDED_PAGES = ["auswertung"];
  const trackingDisabled = EXCLUDED_PAGES.indexOf(currentPage) !== -1;

  // ?ignore merkt sich im Browser "meine eigenen Besuche nicht messen", ?ignore=0 hebt es auf.
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("ignore")) {
      if (q.get("ignore") === "0") localStorage.removeItem(IGNORE_KEY); else localStorage.setItem(IGNORE_KEY, "1");
    }
  } catch (e) { /* ignore */ }
  function ignored() {
    try { return localStorage.getItem(IGNORE_KEY) === "1"; } catch (e) { return false; }
  }

  // Seiten-Kontext (z.B. welches Produkt zeigt produkt.html gerade an) --
  // wird in JEDES Event dieser Seite gemischt.
  let pageContext = {};
  function setContext(extra) {
    Object.assign(pageContext, extra || {});
  }

  function uid() {
    const a = new Uint8Array(12);
    (window.crypto && window.crypto.getRandomValues ? window.crypto : { getRandomValues: function (x) { for (let i = 0; i < x.length; i++) x[i] = Math.random() * 256; } }).getRandomValues(a);
    return Array.from(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  // ---------------------------------------------------------------
  // Consent
  // ---------------------------------------------------------------
  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ignore */ }
  }
  function hasConsent() {
    return getConsent() === "granted";
  }

  // Besucher-ID (zufällig, pseudonym) -- wird NUR nach Zustimmung angelegt.
  // Ohne Browser-Speicher: eine ID nur für diesen Seitenaufruf (nicht geteilt).
  let memoryId = null;
  function getSessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = "s_" + uid();
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return memoryId || (memoryId = "m_" + uid());
    }
  }

  // Beim Ablehnen/Widerruf: alles löschen, was wir lokal gespeichert haben.
  function clearLocalData() {
    queue = [];
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LOCAL_EVENTS_KEY);
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------
  // Lokales Event-Log (Fallback + Debug, siehe auswertung.html)
  // ---------------------------------------------------------------
  function logLocal(payload) {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      const events = raw ? JSON.parse(raw) : [];
      const copy = Object.assign({}, payload);
      delete copy.email; // E-Mail-Adressen bleiben nicht im Browser-Speicher
      events.push(copy);
      while (events.length > MAX_LOCAL_EVENTS) events.shift();
      localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
    } catch (e) { /* Speicher voll o.ä. -- einfach ignorieren */ }
  }

  function readLocalEvents() {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // ---------------------------------------------------------------
  // Google Sheet (per Apps-Script-Web-App) -- kostenlos, kein Server nötig
  // text/plain vermeidet einen CORS-Preflight (Apps Script kann den nicht beantworten)
  // ---------------------------------------------------------------
  function backendUrl() {
    return window.SITE_CONFIG && window.SITE_CONFIG.trackingWebAppUrl;
  }

  // Messdaten: gebündelt, "fire and forget" (überlebt das Schließen der Seite).
  let queue = [];
  function flush() {
    const url = backendUrl();
    const batch = queue;
    queue = [];
    if (!url || batch.length === 0) return;
    try {
      const body = JSON.stringify(batch);
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain;charset=UTF-8" })))) {
        fetch(url, { method: "POST", mode: "no-cors", body: body, keepalive: true }).catch(function () { /* verschmerzbar */ });
      }
    } catch (e) {
      console.warn("[Tracking] Sheet-Übertragung fehlgeschlagen:", e);
    }
  }

  // E-Mail: ehrliche Zustellung. Promise wird erst erfüllt, wenn der Versand technisch
  // geklappt hat (kein Netzfehler, kein Timeout); sonst nach den Wiederholungen abgelehnt.
  function deliver(payload) {
    const url = backendUrl();
    if (!url) return Promise.reject(new Error("no-backend"));
    const body = JSON.stringify(payload);
    let attempt = 0;
    function once() {
      const ctl = new AbortController();
      const timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
      return fetch(url, { method: "POST", mode: "no-cors", body: body, keepalive: true, signal: ctl.signal })
        .finally(function () { clearTimeout(timer); });
    }
    function run() {
      return once().catch(function (err) {
        if (++attempt > RETRIES) throw err;
        const wait = 1000 * Math.pow(3, attempt - 1) * (0.7 + Math.random() * 0.6); // 1 s, 3 s, je +-30 % Jitter
        return new Promise(function (r) { setTimeout(r, wait); }).then(run);
      });
    }
    return run().then(function () { return true; });
  }

  // ---------------------------------------------------------------
  // Öffentliche Track-Funktion
  //   opts.force = true: NUR für die aktiv abgeschickte E-Mail (eigene
  //   Einwilligung im Popup) -- läuft auch ohne Tracking-Zustimmung, aber
  //   immer ohne Besucher-ID/Browser/Referrer. Gibt dann ein Promise zurück.
  //   data.id: eigene Event-ID (für Wiederholungen durch die Nutzerin).
  // ---------------------------------------------------------------
  function track(eventName, data, opts) {
    if (trackingDisabled) return opts && opts.force ? Promise.reject(new Error("disabled")) : undefined;
    const consent = hasConsent();
    const force = !!(opts && opts.force);
    if (!consent && !force) return;
    if (!force && ignored()) return;

    const sensitive = eventName === "email_submit";
    const extra = consent && !sensitive
      ? { sessionId: getSessionId(), referrer: document.referrer || "", userAgent: navigator.userAgent }
      : {};
    const payload = Object.assign({ id: uid(), event: eventName, ts: new Date().toISOString(), page: currentPage }, extra, pageContext, data || {});

    if (consent) logLocal(payload);
    if (force) return deliver(payload);
    queue.push(payload);
    if (queue.length >= BATCH_MAX) flush();
  }

  // ---------------------------------------------------------------
  // Verweildauer: EINMAL pro Seitenaufruf, nur sichtbare Zeit.
  // shortcut: wer den Tab wechselt und zurückkommt, wird nur bis zum ersten
  // Verlassen gemessen; für den Vergleich der Produkte reicht das.
  // ---------------------------------------------------------------
  let visibleMs = 0;
  let shownAt = document.visibilityState === "hidden" ? null : Date.now();
  let durationSent = false;
  function leave() {
    if (shownAt) { visibleMs += Date.now() - shownAt; shownAt = null; }
    if (!durationSent && hasConsent() && !trackingDisabled) {
      durationSent = true;
      track("page_duration", { value: Math.round(visibleMs / 1000) });
    }
    flush();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") leave(); else if (!shownAt) shownAt = Date.now();
  });
  window.addEventListener("pagehide", leave);

  // ---------------------------------------------------------------
  // Consent-Banner (wird hier erzeugt, damit der Text nur an EINER Stelle steht)
  // ---------------------------------------------------------------
  function buildBanner() {
    const b = document.createElement("div");
    b.className = "consent-banner open";
    b.id = "consentBanner";
    b.setAttribute("role", "region");
    b.setAttribute("aria-labelledby", "consentTitle");
    b.innerHTML =
      '<p><strong id="consentTitle">Deine Einwilligung zur Nutzungsmessung</strong><br>' +
      'Wir möchten messen, welche Produktideen auf Interesse stoßen (Klicks, Verweildauer, zufällige Besucher-ID). ' +
      'Die Daten gehen an ein Google Sheet (Google, USA). Freiwillig und jederzeit widerrufbar; ohne Einwilligung nutzt du die Seite unverändert.</p>' +
      '<details><summary>Mehr Details</summary><p>Mit deiner Einwilligung speichern wir eine zufällige Besucher-ID in deinem Browser und übertragen aufgerufene Seiten, Klicks, ' +
      'Verweildauer, Browsertyp und Referrer an ein von uns betriebenes Google Sheet (Google, USA &ndash; dabei wird technisch bedingt auch deine IP-Adresse verarbeitet). ' +
      'Widerruf jederzeit über den Link &bdquo;Einwilligung ändern&ldquo; am Seitenende. Details in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p></details>' +
      '<div class="actions"><button type="button" class="btn btn-primary" id="consentAccept">Zustimmen</button>' +
      '<button type="button" class="btn btn-primary" id="consentDecline">Ablehnen</button></div>';
    return b;
  }

  function initConsentBanner() {
    // Link "Einwilligung ändern" im Footer: Entscheidung zurücksetzen (Widerruf
    // muss so einfach sein wie die Zustimmung, Art. 7 Abs. 3 DSGVO).
    document.querySelectorAll("[data-consent-settings]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); resetConsent(); });
    });

    if (trackingDisabled) return;
    const existing = getConsent();
    if (existing === "granted") {
      track("page_view");
      notifyConsentGranted();
      return;
    }
    if (existing !== null) return;

    const banner = buildBanner();
    document.body.insertBefore(banner, document.body.firstChild);
    banner.querySelector("button").focus();
    banner.querySelector("#consentAccept").addEventListener("click", function () {
      setConsent("granted");
      banner.remove();
      track("page_view");
      notifyConsentGranted();
    });
    banner.querySelector("#consentDecline").addEventListener("click", function () {
      setConsent("denied");
      clearLocalData();
      banner.remove();
    });
  }

  // Andere Skripte (z.B. app.js) können darauf warten, dass Tracking aktiv ist.
  function notifyConsentGranted() {
    window.dispatchEvent(new CustomEvent("fdt:consent-granted"));
  }

  function resetConsent() {
    try { localStorage.removeItem(CONSENT_KEY); } catch (e) { /* ignore */ }
    clearLocalData();
    window.location.reload();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConsentBanner);
  } else {
    initConsentBanner();
  }

  window.FDT = {
    track: track,
    flush: flush,
    uid: uid,
    setContext: setContext,
    hasConsent: hasConsent,
    getSessionId: getSessionId,
    readLocalEvents: readLocalEvents,
    resetConsent: resetConsent,
  };
})(window);
