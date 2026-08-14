/* =====================================================================
   PRODUCT.JS – für produkt.html: liest ?id=... aus der URL, zeigt Bild,
   Text und Preis der passenden Tür aus DOORS, und steuert den
   "Vormerken"-Ablauf (Button -> E-Mail-Formular -> Danke). Kein Modal,
   kein Fake-Zahlungsformular -- alles läuft direkt auf der Seite ab.
   ===================================================================== */

(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function mediaHtml(door) {
    if (door.image) {
      return `<img src="${escapeHtml(door.image)}" alt="${escapeHtml(door.title)}" loading="lazy">`;
    }
    return escapeHtml(door.emoji || "🔒");
  }

  function getDoorFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "";
    const door = (window.DOORS || []).find((d) => d.id === id);
    return { id, door };
  }

  function showStep(stepId) {
    document.querySelectorAll(".step").forEach((el) => el.classList.remove("active"));
    document.getElementById(stepId)?.classList.add("active");
  }

  function renderNotFound() {
    document.getElementById("productLoaded").style.display = "none";
    document.getElementById("productNotFound").style.display = "block";
  }

  function renderProduct(door) {
    document.getElementById("productMedia").innerHTML = mediaHtml(door);
    if (door.badge) {
      document.getElementById("productBadge").textContent = door.badge;
      document.getElementById("productBadge").style.display = "inline-block";
    }
    document.getElementById("productTitle").textContent = door.title;
    document.getElementById("productDescription").textContent = door.description;
    document.getElementById("productPrice").textContent = door.price;
    document.title = document.title.replace("{{productTitle}}", door.title);

    document.getElementById("reserveButton").textContent = SITE_CONFIG.reserveButtonText;
    document.getElementById("reserveFormTitleText").textContent = SITE_CONFIG.reserveFormTitle;
    document.getElementById("reserveFormText").textContent = SITE_CONFIG.reserveFormText;
    document.getElementById("emailInput").placeholder = SITE_CONFIG.emailPlaceholder;
    document.getElementById("reserveSubmitBtn").textContent = SITE_CONFIG.reserveSubmitText;
    document.getElementById("reserveThanksTitleText").textContent = SITE_CONFIG.reserveThanksTitle;
    document.getElementById("reserveThanksTextText").textContent = SITE_CONFIG.reserveThanksText;
  }

  function handleReserveClick(door) {
    FDT.track("reserve_click");
    showStep("stepEmail");
    document.getElementById("emailInput")?.focus();
  }

  function handleEmailSubmit(e, door) {
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

    const btn = document.getElementById("reserveSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    FDT.track("email_submit", { email: email });

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = SITE_CONFIG.reserveSubmitText;
      showStep("stepThanks");
    }, 400);
  }

  function init() {
    const { id, door } = getDoorFromUrl();

    if (!door) {
      renderNotFound();
      return;
    }

    // WICHTIG: Kontext (welches Produkt) MUSS gesetzt sein, bevor
    // tracking.js seinen automatischen "page_view" auslöst -- so werden
    // Klicks UND Verweildauer auf dieser Seite eindeutig diesem Produkt
    // zugeordnet und nicht mit anderen Produktseiten vermischt. Deshalb
    // läuft init() SOFORT synchron (kein DOMContentLoaded-Abwarten) --
    // das Skript steht im HTML absichtlich nach dem Produkt-Markup, das
    // ist zu diesem Zeitpunkt bereits geparst. tracking.js registriert
    // seinen "page_view" dagegen erst ALS DOMContentLoaded-Listener,
    // der garantiert später feuert als dieser synchrone Code hier.
    FDT.setContext({ doorId: door.id, doorTitle: door.title, page: "produkt.html?id=" + door.id });

    renderProduct(door);
    document.getElementById("productLoaded").style.display = "block";

    document.getElementById("reserveButton").addEventListener("click", () => handleReserveClick(door));
    document.getElementById("emailForm").addEventListener("submit", (e) => handleEmailSubmit(e, door));
    document.getElementById("backToReserveBtn")?.addEventListener("click", () => showStep("stepReserve"));
  }

  init();
})();
