/* =====================================================================
   PRODUCT.JS – für produkt.html: liest ?id=... aus der URL, zeigt Bild,
   Text und Preis der passenden Tür aus DOORS. Der Button "Verfügbarkeit
   prüfen" öffnet ein Popup mit dem E-Mail-Formular. Getrackt wird nicht
   nur der Abschluss (email_submit), sondern auch, wenn jemand das Popup
   wieder schließt, OHNE eine E-Mail zu hinterlassen (email_modal_abandon,
   inkl. Sekunden bis zum Abbruch) -- so lässt sich sehen, wie viele
   Leute im Popup abspringen statt durchzugehen.
   ===================================================================== */

(function () {
  "use strict";

  let modalOpenedAt = null;
  let submitted = false;

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
    document.getElementById("modalProductTitle").textContent = door.title;
    document.getElementById("modalProductPrice").textContent = door.price;
    document.getElementById("modalThumb").innerHTML = mediaHtml(door);
    document.getElementById("reserveFormTitleText").textContent = SITE_CONFIG.reserveFormTitle;
    document.getElementById("reserveFormText").textContent = SITE_CONFIG.reserveFormText;
    document.getElementById("emailInput").placeholder = SITE_CONFIG.emailPlaceholder;
    document.getElementById("reserveSubmitBtn").textContent = SITE_CONFIG.reserveSubmitText;
    document.getElementById("cancelReserveBtn").textContent = SITE_CONFIG.reserveCancelText;
    document.getElementById("reserveThanksTitleText").textContent = SITE_CONFIG.reserveThanksTitle;
    document.getElementById("reserveThanksTextText").textContent = SITE_CONFIG.reserveThanksText;
  }

  // ---------------------------------------------------------------
  // Popup öffnen/schließen
  // ---------------------------------------------------------------
  function openModal() {
    FDT.track("reserve_click");

    showStep("stepEmail");
    document.getElementById("emailForm").reset();
    const msg = document.getElementById("emailFormMsg");
    if (msg) { msg.className = "form-msg"; msg.textContent = ""; }

    document.getElementById("availabilityOverlay").classList.add("open");
    modalOpenedAt = Date.now();
    submitted = false;
    document.getElementById("emailInput")?.focus();
  }

  function closeModal(reason) {
    const overlay = document.getElementById("availabilityOverlay");
    if (!overlay.classList.contains("open")) return;
    overlay.classList.remove("open");

    // Nur als Abbruch zählen, wenn NICHT gerade erfolgreich abgeschlossen
    // wurde -- sonst würde das Schließen nach "Danke" fälschlich als
    // Absprung gewertet.
    if (!submitted && modalOpenedAt) {
      const seconds = Math.round((Date.now() - modalOpenedAt) / 1000);
      FDT.track("email_modal_abandon", { value: seconds, reason: reason || "close_button" });
    }
    modalOpenedAt = null;
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

    const btn = document.getElementById("reserveSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const seconds = modalOpenedAt ? Math.round((Date.now() - modalOpenedAt) / 1000) : 0;
    FDT.track("email_submit", { email: email, value: seconds });
    submitted = true;

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

    document.getElementById("reserveButton").addEventListener("click", openModal);
    document.getElementById("emailForm").addEventListener("submit", handleEmailSubmit);

    document.getElementById("availabilityOverlay").addEventListener("click", (e) => {
      if (e.target.id === "availabilityOverlay") closeModal("backdrop");
    });
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal("close_button"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal("escape_key");
    });
    // Falls die Seite verlassen wird, während das Popup noch offen ist
    // (z.B. Tab geschlossen), trotzdem als Abbruch zählen.
    window.addEventListener("pagehide", () => closeModal("page_unload"));
  }

  init();
})();
