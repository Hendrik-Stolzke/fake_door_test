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
  let sending = false;
  let closeReason = null;
  let submitId = null;      // Event-ID: bleibt bei Wiederholung derselben Adresse gleich -> keine Dublette
  let submitEmail = null;

  const { escapeHtml, mediaHtml } = window.FDT_UTIL;
  const dlg = () => document.getElementById("availabilityOverlay");

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
    document.title = "Nicht gefunden – " + SITE_CONFIG.siteTitle;
    document.getElementById("productLoaded").style.display = "none";
    document.getElementById("productNotFound").style.display = "block";
  }

  function renderProduct(door) {
    document.getElementById("productMedia").innerHTML = mediaHtml(door, true); // Hauptbild sofort laden (LCP)
    if (door.badge) {
      document.getElementById("productBadge").textContent = door.badge;
      document.getElementById("productBadge").style.display = "inline-block";
    }
    document.getElementById("productTitle").textContent = door.title;
    document.getElementById("productDescription").textContent = door.description;
    document.getElementById("productPrice").innerHTML =
      `<small class="price-label">${escapeHtml(SITE_CONFIG.priceLabel)}</small>${escapeHtml(door.price)}`;
    document.title = document.title.replace("{{productTitle}}", door.title);

    document.getElementById("productUnavailable").textContent = SITE_CONFIG.unavailableLabel;
    document.getElementById("reserveButton").textContent = SITE_CONFIG.reserveButtonText;
    document.getElementById("modalProductTitle").textContent = door.title;
    document.getElementById("modalProductPrice").textContent = SITE_CONFIG.priceLabel + ": " + door.price;
    document.querySelectorAll("[data-company-name]").forEach((el) => (el.textContent = SITE_CONFIG.companyName));
    document.querySelectorAll("[data-company-email]").forEach((el) => (el.textContent = SITE_CONFIG.companyEmail));
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
  // Popup öffnen/schließen (<dialog>: Fokusfalle, ESC und inerter Hintergrund inklusive)
  // ---------------------------------------------------------------
  function openModal() {
    FDT.track("reserve_click");

    showStep("stepEmail");
    document.getElementById("emailForm").reset();
    clearMsg();
    submitId = null;
    submitEmail = null;

    closeReason = null;
    dlg().showModal();
    modalOpenedAt = Date.now();
    submitted = false;
    document.getElementById("emailInput").focus();
  }

  // Wird bei JEDEM Schließen aufgerufen (Button, ESC, Klick daneben, Seite verlassen).
  function onClosed(reason) {
    // Nur als Abbruch zählen, wenn NICHT gerade erfolgreich abgeschlossen
    // wurde -- sonst würde das Schließen nach "Danke" fälschlich als Absprung gewertet.
    if (!submitted && modalOpenedAt) {
      const seconds = Math.round((Date.now() - modalOpenedAt) / 1000);
      FDT.track("email_modal_abandon", { value: seconds, reason: reason || closeReason || "close_button" });
    }
    modalOpenedAt = null;
    closeReason = null;
    const btn = document.getElementById("reserveButton");
    if (btn) btn.focus(); // Fokus zurück zum Auslöser
  }

  function clearMsg() {
    const msg = document.getElementById("emailFormMsg");
    msg.className = "form-msg";
    msg.textContent = "";
    document.getElementById("emailInput").removeAttribute("aria-invalid");
  }

  function showError(text, field) {
    const msg = document.getElementById("emailFormMsg");
    msg.textContent = text;
    msg.className = "form-msg show error";
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    if (sending) return; // Doppelabsendung (Doppelklick, Enter + Klick) verhindern
    const input = document.getElementById("emailInput");
    const consentCheck = document.getElementById("emailConsentCheck");
    const email = input.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    clearMsg();

    if (!emailPattern.test(email)) {
      showError("Bitte gib eine gültige E-Mail-Adresse ein.", input);
      return;
    }
    if (!consentCheck.checked) {
      showError("Bitte stimme der Speicherung deiner E-Mail-Adresse zu.", consentCheck);
      return;
    }

    sending = true;
    const btn = document.getElementById("reserveSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    if (email !== submitEmail) { submitEmail = email; submitId = FDT.uid(); }

    const seconds = modalOpenedAt ? Math.round((Date.now() - modalOpenedAt) / 1000) : 0;
    // force: die E-Mail hat ihre eigene Einwilligung (Checkbox) und wird auch ohne Tracking-Zustimmung gespeichert.
    // "Danke" gibt es NUR, wenn der Versand geklappt hat.
    FDT.track("email_submit", { id: submitId, email: email, value: seconds, consent: "email-v2" }, { force: true })
      .then(() => {
        submitted = true;
        showStep("stepThanks");
        document.getElementById("reserveThanksTitleText").focus();
      })
      .catch((err) => {
        console.warn("[Vormerken] Versand fehlgeschlagen:", err && err.message);
        showError("Das hat gerade nicht geklappt. Bitte prüfe deine Verbindung und versuche es gleich noch einmal.", null);
      })
      .finally(() => {
        sending = false;
        btn.disabled = false;
        btn.textContent = SITE_CONFIG.reserveSubmitText;
      });
  }

  function init() {
    const { id, door } = getDoorFromUrl();

    if (!window.SITE_CONFIG) return; // Fehlermeldung zeigt app.js
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
    FDT.setContext({ doorId: door.id, doorTitle: door.title });

    renderProduct(door);
    document.getElementById("productLoaded").style.display = "block";

    document.getElementById("reserveButton").addEventListener("click", openModal);
    document.getElementById("emailForm").addEventListener("submit", handleEmailSubmit);

    const d = dlg();
    d.addEventListener("cancel", () => { closeReason = "escape_key"; });
    d.addEventListener("close", () => onClosed());
    d.addEventListener("click", (e) => {
      if (e.target === d) { closeReason = "backdrop"; d.close(); } // Klick auf den abgedunkelten Hintergrund
    });
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => d.close());
    });
    // Falls die Seite verlassen wird, während das Popup noch offen ist
    // (z.B. Tab geschlossen), trotzdem als Abbruch zählen. flush(): tracking.js hat sein
    // pagehide schon abgearbeitet, das Ereignis muss deshalb noch selbst raus.
    window.addEventListener("pagehide", () => {
      if (d.open) { onClosed("page_unload"); FDT.flush(); }
    });
  }

  init();
})();
