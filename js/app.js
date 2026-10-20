/* =====================================================================
   APP.JS – rendert Türen (als Links auf produkt.html) und Team aus
   config.js. Der Button "Verfügbarkeit prüfen" und das Popup leben in js/product.js
   auf der jeweiligen Produktseite.
   ===================================================================== */

(function () {
  "use strict";

  const impressionsSeen = new Set();

  function applyBrandColors() {
    if (!window.SITE_CONFIG) return;
    const root = document.documentElement.style;
    if (SITE_CONFIG.brandColor) root.setProperty("--brand", SITE_CONFIG.brandColor);
    if (SITE_CONFIG.brandColorDark) root.setProperty("--brand-dark", SITE_CONFIG.brandColorDark);
    if (SITE_CONFIG.accentColor) {
      root.setProperty("--accent", SITE_CONFIG.accentColor);
    }
  }

  function applyBaseTexts() {
    document.querySelectorAll("[data-site-title]").forEach((el) => (el.textContent = SITE_CONFIG.siteTitle));
    document.querySelectorAll("[data-logo-emoji]").forEach((el) => (el.textContent = SITE_CONFIG.logoEmoji));
    document.title = document.title.replace("{{siteTitle}}", SITE_CONFIG.siteTitle);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  const escapeAttr = escapeHtml;

  // Bilder nur als Pfad im Ordner bilder/ (nie Web-Adressen): Fremde Bild-Server
  // würden die IP-Adresse schon VOR der Einwilligung erhalten.
  function safeImage(src) {
    src = String(src || "").trim();
    if (!src) return "";
    if (/^([a-z][a-z0-9+.-]*:|\/\/|\\)/i.test(src)) {
      console.warn("[config] image: nur Dateien aus bilder/ erlaubt, keine Web-Adressen:", src);
      return "";
    }
    return src;
  }

  // Bild oder (ohne Bild / bei kaputtem Bild) das Emoji als Platzhalter.
  function mediaHtml(item, eager) {
    const src = safeImage(item.image);
    if (src) {
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(item.title || item.name)}" data-emoji="${escapeAttr(item.emoji || "🔒")}"${eager ? "" : ' loading="lazy"'}>`;
    }
    return escapeHtml(item.emoji || "🔒");
  }
  // Bild fehlt/falsch geschrieben (Groß-/Kleinschreibung, doppelte Endung .jpg.jpg)? -> Emoji statt Alt-Text.
  // (Capture-Listener statt onerror-Attribut: funktioniert auch mit strenger CSP.)
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t && t.tagName === "IMG" && t.dataset && t.dataset.emoji !== undefined) t.replaceWith(document.createTextNode(t.dataset.emoji));
  }, true);
  window.FDT_UTIL = { escapeHtml: escapeHtml, mediaHtml: mediaHtml };

  // -------------------------------------------------------------
  // WARUM / WIE / WAS -- Golden-Circle-Texte auf der Startseite
  // -------------------------------------------------------------
  function renderGoldenCircle() {
    const whyBadge = document.getElementById("whyBadge");
    if (whyBadge) whyBadge.textContent = SITE_CONFIG.whyBadge;
    const whyHeadline = document.getElementById("whyHeadline");
    if (whyHeadline) whyHeadline.textContent = SITE_CONFIG.whyHeadline;
    const whyText = document.getElementById("whyText");
    if (whyText) whyText.textContent = SITE_CONFIG.whyText;

    const howTitle = document.getElementById("howTitle");
    if (howTitle) howTitle.textContent = SITE_CONFIG.howTitle;
    const howGrid = document.getElementById("howGrid");
    if (howGrid && Array.isArray(SITE_CONFIG.howPoints)) {
      howGrid.innerHTML = SITE_CONFIG.howPoints.map((p) => `
        <div class="how-card">
          <div class="how-icon">${escapeHtml(p.emoji || "•")}</div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.text)}</p>
        </div>
      `).join("");
    }

    const whatTitle = document.getElementById("whatTitle");
    if (whatTitle) whatTitle.textContent = SITE_CONFIG.whatTitle;
    const whatText = document.getElementById("whatText");
    if (whatText) whatText.textContent = SITE_CONFIG.whatText;
  }

  // -------------------------------------------------------------
  // Türen rendern -- jede Karte ist ein Link auf ihre eigene Seite
  // -------------------------------------------------------------
  function renderDoors() {
    const grid = document.getElementById("doorsGrid");
    if (!grid) return;

    if (!window.DOORS || DOORS.length === 0) {
      grid.innerHTML = '<div class="empty-state">Noch keine Produkte eingetragen. Öffne js/config.js und füge welche im DOORS-Array hinzu.</div>';
      return;
    }

    // Reihenfolge pro Seitenaufruf zufällig (Fisher-Yates), damit der Platz auf der
    // Seite das Ergebnis nicht verfälscht; die Position wird als "value" mitgeloggt.
    const order = DOORS.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    grid.innerHTML = order.map((door, idx) => `
      <a class="door-card" href="produkt.html?id=${encodeURIComponent(door.id)}" data-door-id="${escapeAttr(door.id)}" data-pos="${idx + 1}">
        <div class="door-media">
          ${door.badge ? `<span class="door-badge">${escapeHtml(door.badge)}</span>` : ""}
          ${mediaHtml(door)}
        </div>
        <div class="door-body">
          <h3>${escapeHtml(door.title)}</h3>
          <p>${escapeHtml(door.description)}</p>
          <p class="unavailable">${escapeHtml(SITE_CONFIG.unavailableLabel)}</p>
          <div class="door-footer">
            <span class="door-price"><small class="price-label">${escapeHtml(SITE_CONFIG.priceLabel)}</small>${escapeHtml(door.price)}</span>
            <span class="btn btn-primary">Zum Produkt</span>
          </div>
        </div>
      </a>
    `).join("");

    // Klick auf eine Tür tracken, BEVOR die normale Navigation zur
    // Produktseite stattfindet (sendBeacon übersteht den Seitenwechsel).
    grid.querySelectorAll("[data-door-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-door-id");
        const door = DOORS.find((d) => d.id === id);
        if (door) FDT.track("door_click", { doorId: door.id, doorTitle: door.title, value: Number(el.getAttribute("data-pos")) });
      });
    });

    // Impressionen tracken, sobald eine Tür sichtbar wird. Die Beobachtung
    // startet erst NACH der Consent-Entscheidung -- sonst würde der erste
    // (oft einzige) Trigger für oberhalb der Falz sichtbare Türen bereits
    // vor der Zustimmung feuern und stillschweigend verloren gehen, weil
    // IntersectionObserver bei unverändertem Sichtbarkeitsstatus nicht
    // erneut auslöst.
    function startImpressionObserver() {
      if (!("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-door-id");
            const door = DOORS.find((d) => d.id === id);
            if (door && !impressionsSeen.has(door.id)) {
              impressionsSeen.add(door.id);
              FDT.track("door_impression", { doorId: door.id, doorTitle: door.title, value: Number(entry.target.getAttribute("data-pos")) });
            }
          }
        });
      }, { threshold: 0.4 });
      grid.querySelectorAll(".door-card").forEach((card) => io.observe(card));
    }
    if (FDT.hasConsent()) {
      startImpressionObserver();
    } else {
      window.addEventListener("fdt:consent-granted", startImpressionObserver, { once: true });
    }
  }

  // -------------------------------------------------------------
  // Team rendern
  // -------------------------------------------------------------
  function renderTeam() {
    const grid = document.getElementById("teamGrid");
    if (!grid) return;
    if (!window.TEAM || TEAM.length === 0) {
      grid.innerHTML = '<div class="empty-state">Noch kein Team eingetragen. Öffne js/config.js und füge Personen im TEAM-Array hinzu.</div>';
      return;
    }
    grid.innerHTML = TEAM.map((person) => `
      <div class="team-card">
        <div class="team-avatar">${mediaHtml(Object.assign({}, person, { title: person.name }))}</div>
        <h3>${escapeHtml(person.name)}</h3>
        <div class="role">${escapeHtml(person.role)}</div>
        <p class="bio">${escapeHtml(person.bio)}</p>
      </div>
    `).join("");
  }

  // -------------------------------------------------------------
  // Transparenz: Hinweis, dass es sich um einen Test handelt (UWG --
  // Besucher:innen dürfen nicht glauben, die Produkte seien bestellbar)
  // -------------------------------------------------------------
  function renderTestNotice() {
    const el = document.getElementById("testNotice");
    if (el) el.innerHTML = "<strong>" + escapeHtml(SITE_CONFIG.testNoticeTitle) + "</strong> " + escapeHtml(SITE_CONFIG.testNoticeText);
  }

  // -------------------------------------------------------------
  // Impressum/Datenschutz: Angaben aus js/config.js einsetzen
  // -------------------------------------------------------------
  function renderLegal() {
    const c = SITE_CONFIG, h = escapeHtml;
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    const addr = [c.companyName, c.companyStreet, c.companyCity, c.companyCountry];
    set("impAddress", (el) => (el.innerHTML = addr.map(h).join("<br>")));
    set("impContact", (el) => (el.innerHTML = "E-Mail: " + h(c.companyEmail) + (c.companyPhone ? "<br>Telefon: " + h(c.companyPhone) : "")));
    set("impVat", (el) => { if (c.companyVatId) el.textContent = "Umsatzsteuer-ID: " + c.companyVatId; });
    set("impResponsible", (el) => (el.textContent = c.responsiblePerson));
    set("dsAddress", (el) => (el.textContent = addr.join(", ")));
    set("dsContact", (el) => (el.textContent = "E-Mail: " + c.companyEmail + (c.companyPhone ? ", Telefon: " + c.companyPhone : "")));
    set("stand", (el) => (el.textContent = c.legalUpdated));
    set("dsHost", (el) => (el.textContent = c.hostingProvider));
    set("dsRetEvents", (el) => (el.textContent = c.retentionEvents));
    set("dsRetEmails", (el) => (el.textContent = c.retentionEmails));
    set("dsTransfer", (el) => (el.textContent = c.transferNote));
    set("resetConsentBtn", (el) => el.addEventListener("click", () => FDT.resetConsent()));
  }

  // -------------------------------------------------------------
  // Sicherheitsnetz: roter Balken, solange rechtlich nötige Angaben fehlen
  // oder noch Platzhalter sind -- so geht die Seite nicht versehentlich mit
  // "Musterstraße 1" live (Impressum/Datenschutz wären dann falsch).
  // -------------------------------------------------------------
  const PLACEHOLDER = /\[[^\]]*\]|ersetzen|vorname nachname|muster(str|stadt|mann)|beispiel\.|example\.|\b123 ?456|punkt \d: titel|produktname [a-c]|ein satz/i;
  const URL_OK = /^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[\w-]+\/exec$/;
  const HOSTS = [["github.io", /github/i], ["pages.dev", /cloudflare/i], ["netlify.app", /netlify/i], ["vercel.app", /vercel/i]];

  function showWarning(text) {
    const div = document.createElement("div");
    div.className = "config-warning";
    div.setAttribute("role", "alert");
    div.textContent = text;
    document.body.insertBefore(div, document.body.firstChild);
  }

  function checkLegalConfig() {
    const c = window.SITE_CONFIG;
    const bad = [];
    ["companyName", "companyStreet", "companyCity", "companyEmail", "responsiblePerson", "companyPhone", "hostingProvider", "legalUpdated", "transferNote"].forEach((k) => {
      if (!c[k] || PLACEHOLDER.test(c[k])) bad.push(k === "companyPhone" ? "companyPhone (zweiter Kommunikationsweg)" : k);
    });
    if (!c.trackingWebAppUrl) bad.push("trackingWebAppUrl (ohne sie kommt nichts im Google Sheet an)");
    else if (!URL_OK.test(c.trackingWebAppUrl)) bad.push("trackingWebAppUrl (muss https://script.google.com/macros/s/…/exec sein)");
    HOSTS.forEach((h) => {
      if (location.hostname.endsWith(h[0]) && !h[1].test(c.hostingProvider || "")) bad.push("hostingProvider (passt nicht zu " + location.hostname + ")");
    });
    if (c.encCheck !== "äöü€") bad.push("encCheck (js/config.js bitte als UTF-8 speichern, sonst sind Umlaute kaputt)");
    // Alles, was noch nach Platzhalter aussieht ([eckige Klammern], ERSETZEN, Musterwerte)
    const open = [];
    (function walk(v, path, key) {
      if (typeof v === "string") { if (key !== "emailPlaceholder" && PLACEHOLDER.test(v)) open.push(path.replace(/^\./, "")); }
      else if (v && typeof v === "object") Object.keys(v).forEach((k) => walk(v[k], path + "." + k, k));
    })({ SITE_CONFIG: c, DOORS: window.DOORS, TEAM: window.TEAM }, "", "");
    if (open.length) bad.push(open.length + " Platzhalter-Texte, z. B. " + open.slice(0, 3).join(", "));
    if (bad.length) showWarning("⚠️ NICHT LIVE SCHALTEN – in js/config.js fehlt noch: " + bad.join(", "));
  }

  // -------------------------------------------------------------
  // Init
  // -------------------------------------------------------------
  function init() {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    if (!window.SITE_CONFIG) {
      showWarning("⚠️ js/config.js konnte nicht gelesen werden – meist ein Tippfehler: fehlendes Komma, fehlendes oder doppeltes Anführungszeichen, " +
        "Word-Anführungszeichen („ “) oder die Datei fehlt. Mach die letzte Änderung rückgängig; die Zeilennummer steht in der Browser-Konsole (F12).");
      return;
    }
    checkLegalConfig();
    applyBrandColors();
    applyBaseTexts();
    renderTestNotice();
    renderGoldenCircle();
    renderDoors();
    renderTeam();
    renderLegal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
