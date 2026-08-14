/* =====================================================================
   APP.JS – rendert Türen (als Links auf produkt.html) und Team aus
   config.js. Der eigentliche "Vormerken"-Ablauf lebt in js/product.js
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

  function mediaHtml(item) {
    if (item.image) {
      return `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title || item.name)}" loading="lazy">`;
    }
    return escapeHtml(item.emoji || "🔒");
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

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

    grid.innerHTML = DOORS.map((door) => `
      <a class="door-card" href="produkt.html?id=${encodeURIComponent(door.id)}" data-door-id="${escapeAttr(door.id)}">
        <div class="door-media">
          ${door.badge ? `<span class="door-badge">${escapeHtml(door.badge)}</span>` : ""}
          ${mediaHtml(door)}
        </div>
        <div class="door-body">
          <h3>${escapeHtml(door.title)}</h3>
          <p>${escapeHtml(door.description)}</p>
          <div class="door-footer">
            <span class="door-price">${escapeHtml(door.price)}</span>
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
        if (door) FDT.track("door_click", { doorId: door.id, doorTitle: door.title });
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
              FDT.track("door_impression", { doorId: door.id, doorTitle: door.title });
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
  // Init
  // -------------------------------------------------------------
  function init() {
    applyBrandColors();
    applyBaseTexts();
    renderGoldenCircle();
    renderDoors();
    renderTeam();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
