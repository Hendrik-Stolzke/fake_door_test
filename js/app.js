/* =====================================================================
   APP.JS – rendert Türen aus config.js, steuert Checkout-Modal & E-Mail-Formular
   ===================================================================== */

(function () {
  "use strict";

  let currentDoor = null;
  let checkoutOpenedAt = null;
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
  // Türen rendern
  // -------------------------------------------------------------
  function renderDoors() {
    const grid = document.getElementById("doorsGrid");
    if (!grid) return;

    if (!window.DOORS || DOORS.length === 0) {
      grid.innerHTML = '<div class="empty-state">Noch keine Produkte eingetragen. Öffne js/config.js und füge welche im DOORS-Array hinzu.</div>';
      return;
    }

    grid.innerHTML = DOORS.map((door, i) => `
      <article class="door-card" data-door-index="${i}" tabindex="0" role="button" aria-label="${escapeAttr(door.title)} ansehen">
        <div class="door-media">
          ${door.badge ? `<span class="door-badge">${escapeHtml(door.badge)}</span>` : ""}
          ${mediaHtml(door)}
        </div>
        <div class="door-body">
          <h3>${escapeHtml(door.title)}</h3>
          <p>${escapeHtml(door.description)}</p>
          <div class="door-footer">
            <span class="door-price">${escapeHtml(door.price)}</span>
            <button type="button" class="btn btn-primary" data-door-index="${i}">Ansehen</button>
          </div>
        </div>
      </article>
    `).join("");

    // Klicks
    grid.querySelectorAll("[data-door-index]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const idx = Number(el.getAttribute("data-door-index"));
        openCheckout(idx);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCheckout(Number(el.getAttribute("data-door-index")));
        }
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
            const idx = Number(entry.target.getAttribute("data-door-index"));
            const door = DOORS[idx];
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
  // Checkout-Modal
  // -------------------------------------------------------------
  function openCheckout(index) {
    currentDoor = DOORS[index];
    if (!currentDoor) return;

    FDT.track("door_click", { doorId: currentDoor.id, doorTitle: currentDoor.title });

    document.querySelectorAll("[data-modal-title]").forEach((el) => (el.textContent = currentDoor.title));
    document.querySelectorAll("[data-modal-price]").forEach((el) => (el.textContent = currentDoor.price));
    document.querySelectorAll("[data-modal-thumb]").forEach((el) => (el.innerHTML = mediaHtml(currentDoor)));
    const buyBtn = document.getElementById("buyButton");
    if (buyBtn) buyBtn.textContent = "Jetzt kaufen für " + currentDoor.price;

    showStep("stepPay");
    const overlay = document.getElementById("checkoutOverlay");
    overlay.classList.add("open");
    checkoutOpenedAt = Date.now();
    FDT.track("checkout_open", { doorId: currentDoor.id, doorTitle: currentDoor.title });

    resetEmailForm();
    document.getElementById("payForm-cardnumber")?.focus();
  }

  function closeCheckout(reason) {
    const overlay = document.getElementById("checkoutOverlay");
    if (!overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    if (currentDoor && checkoutOpenedAt) {
      const seconds = Math.round((Date.now() - checkoutOpenedAt) / 1000);
      FDT.track("checkout_close", { doorId: currentDoor.id, doorTitle: currentDoor.title, value: seconds, reason: reason || "close_button" });
    }
    checkoutOpenedAt = null;
    currentDoor = null;
  }

  function showStep(stepId) {
    document.querySelectorAll(".step").forEach((el) => el.classList.remove("active"));
    document.getElementById(stepId)?.classList.add("active");
  }

  function handleBuyClick() {
    if (!currentDoor) return;
    const buyBtn = document.getElementById("buyButton");
    const originalText = buyBtn.textContent;
    buyBtn.disabled = true;
    buyBtn.innerHTML = '<span class="spinner"></span> Wird verarbeitet …';

    FDT.track("payment_attempt", { doorId: currentDoor.id, doorTitle: currentDoor.title });

    // Kurze, realistische "Verarbeitung" -- rein visuell, es wird nichts
    // abgebucht und es werden keine eingegebenen Kartendaten irgendwohin
    // gesendet oder gespeichert.
    setTimeout(() => {
      buyBtn.disabled = false;
      buyBtn.textContent = originalText;

      document.getElementById("emailPromptTitle").textContent = SITE_CONFIG.emailPromptTitle;
      document.getElementById("emailPromptText").textContent = SITE_CONFIG.emailPromptText;
      document.getElementById("emailInput").placeholder = SITE_CONFIG.emailPlaceholder;
      document.getElementById("emailSubmitBtn").textContent = SITE_CONFIG.emailButtonText;

      showStep("stepEmail");
      FDT.track("paywall_shown", { doorId: currentDoor.id, doorTitle: currentDoor.title });
    }, 900);
  }

  function resetEmailForm() {
    const form = document.getElementById("emailForm");
    if (form) form.reset();
    const msg = document.getElementById("emailFormMsg");
    if (msg) { msg.className = "form-msg"; msg.textContent = ""; }
    showStep("stepPay");
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    const input = document.getElementById("emailInput");
    const consentCheck = document.getElementById("emailConsentCheck");
    const msg = document.getElementById("emailFormMsg");
    const email = input.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      msg.textContent = "Bitte gib eine gültige E-Mail-Adresse ein.";
      msg.className = "form-msg show error";
      return;
    }
    if (!consentCheck.checked) {
      msg.textContent = "Bitte stimme der Speicherung deiner E-Mail-Adresse zu.";
      msg.className = "form-msg show error";
      return;
    }

    const btn = document.getElementById("emailSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    FDT.track("email_submit", {
      doorId: currentDoor ? currentDoor.id : "",
      doorTitle: currentDoor ? currentDoor.title : "",
      email: email,
    });

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = SITE_CONFIG.emailButtonText;
      document.getElementById("emailThanksTitle_text").textContent = SITE_CONFIG.emailThanksTitle;
      document.getElementById("emailThanksText_text").textContent = SITE_CONFIG.emailThanksText;
      showStep("stepThanks");
    }, 500);
  }

  // -------------------------------------------------------------
  // Init
  // -------------------------------------------------------------
  function init() {
    applyBrandColors();
    applyBaseTexts();
    renderDoors();
    renderTeam();

    document.getElementById("checkoutOverlay")?.addEventListener("click", (e) => {
      if (e.target.id === "checkoutOverlay") closeCheckout("backdrop");
    });
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeCheckout("close_button"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCheckout("escape_key");
    });
    document.getElementById("buyButton")?.addEventListener("click", handleBuyClick);
    document.getElementById("emailForm")?.addEventListener("submit", handleEmailSubmit);
    document.getElementById("backToPayBtn")?.addEventListener("click", () => showStep("stepPay"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
