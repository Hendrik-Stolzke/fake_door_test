/* =====================================================================
   TRACKING-KERN
   Zeichnet alle Events auf (Seitenaufruf, Klicks, Kaufversuch, E-Mail,
   Verweildauer) und schickt sie:
     1) an dein kostenloses Google Sheet (wenn trackingWebAppUrl gesetzt ist)
     2) an Google Analytics 4 (wenn gaMeasurementId gesetzt ist)
     3) IMMER zusätzlich lokal in den Browser-Speicher (localStorage),
        als Fallback/Debug – sichtbar auf auswertung.html
   Läuft erst los, nachdem Besucher:innen dem Consent-Banner zugestimmt
   haben (siehe unten "hasConsent").
   ===================================================================== */

(function (window) {
  "use strict";

  const CONSENT_KEY = "fdt_consent";          // "granted" | "denied"
  const SESSION_KEY = "fdt_session_id";
  const LOCAL_EVENTS_KEY = "fdt_events";
  const MAX_LOCAL_EVENTS = 1000;

  const pageStartTime = Date.now();
  let gaLoaded = false;

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

  // ---------------------------------------------------------------
  // Session-ID (rein technisch, keine Klarnamen -- nur zum Zählen
  // wiederkehrender Aufrufe / Zusammenführen von Events EINER Sitzung)
  // ---------------------------------------------------------------
  function getSessionId() {
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return "no-storage";
    }
  }

  // ---------------------------------------------------------------
  // Lokales Event-Log (Fallback + Debug, siehe auswertung.html)
  // ---------------------------------------------------------------
  function logLocal(payload) {
    try {
      const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
      const events = raw ? JSON.parse(raw) : [];
      events.push(payload);
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
  // ---------------------------------------------------------------
  function sendToSheet(payload) {
    const url = window.SITE_CONFIG && window.SITE_CONFIG.trackingWebAppUrl;
    if (!url) return;
    try {
      const body = JSON.stringify(payload);
      // text/plain vermeidet einen CORS-Preflight (Apps Script kann den nicht beantworten)
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: "POST", mode: "no-cors", body, keepalive: true });
      }
    } catch (e) {
      console.warn("[Tracking] Sheet-Übertragung fehlgeschlagen:", e);
    }
  }

  // ---------------------------------------------------------------
  // Google Analytics 4 (optional)
  // ---------------------------------------------------------------
  function ensureGa() {
    const id = window.SITE_CONFIG && window.SITE_CONFIG.gaMeasurementId;
    if (!id || gaLoaded) return;
    gaLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  }

  // ---------------------------------------------------------------
  // Öffentliche Track-Funktion
  // ---------------------------------------------------------------
  function track(eventName, data) {
    data = data || {};
    if (!hasConsent()) return;

    const payload = Object.assign(
      {
        event: eventName,
        sessionId: getSessionId(),
        ts: new Date().toISOString(),
        page: window.location.pathname.replace(/^\//, "") || "index.html",
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
      },
      data
    );

    logLocal(payload);
    sendToSheet(payload);

    if (window.gtag) {
      const gaData = Object.assign({}, data);
      delete gaData.email; // keine E-Mails an GA senden
      window.gtag("event", eventName, gaData);
    }
  }

  // ---------------------------------------------------------------
  // Verweildauer: beim Verlassen/Verstecken der Seite Dauer senden
  // ---------------------------------------------------------------
  let durationSent = false;
  function sendDuration() {
    if (durationSent) return;
    durationSent = true;
    const seconds = Math.round((Date.now() - pageStartTime) / 1000);
    track("page_duration", { value: seconds });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      sendDuration();
      durationSent = false; // falls Nutzer:in zurückkommt und später wieder wegnavigiert
    }
  });
  window.addEventListener("pagehide", sendDuration);

  // ---------------------------------------------------------------
  // Consent-Banner verdrahten
  // ---------------------------------------------------------------
  function initConsentBanner() {
    const banner = document.getElementById("consentBanner");
    if (!banner) {
      // Keine Banner-Elemente auf dieser Seite (z.B. Impressum) -- trotzdem
      // ggf. bereits erteilten Consent nutzen, um GA zu laden.
      if (hasConsent()) { ensureGa(); notifyConsentGranted(); }
      return;
    }
    const existing = getConsent();
    if (existing === "granted") {
      ensureGa();
      track("page_view");
      notifyConsentGranted();
    } else if (existing === null) {
      banner.classList.add("open");
    }

    const acceptBtn = document.getElementById("consentAccept");
    const declineBtn = document.getElementById("consentDecline");
    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        setConsent("granted");
        banner.classList.remove("open");
        ensureGa();
        track("page_view");
        notifyConsentGranted();
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener("click", function () {
        setConsent("denied");
        banner.classList.remove("open");
      });
    }
  }

  // Andere Skripte (z.B. app.js für Sichtbarkeits-Tracking von Türen) können
  // darauf warten, dass Tracking wirklich aktiv ist -- so geht kein Event
  // verloren, das VOR der Consent-Entscheidung ausgelöst worden wäre.
  function notifyConsentGranted() {
    window.dispatchEvent(new CustomEvent("fdt:consent-granted"));
  }

  function resetConsent() {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch (e) { /* ignore */ }
    window.location.reload();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConsentBanner);
  } else {
    initConsentBanner();
  }

  window.FDT = {
    track: track,
    hasConsent: hasConsent,
    getSessionId: getSessionId,
    readLocalEvents: readLocalEvents,
    resetConsent: resetConsent,
  };
})(window);
