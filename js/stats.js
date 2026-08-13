/* =====================================================================
   STATS.JS – lädt Auswertungsdaten (vom Google Sheet oder lokal aus
   diesem Browser) und rendert KPI-Kacheln, Funnel und Tabelle auf
   auswertung.html.
   ===================================================================== */

(function () {
  "use strict";

  const FUNNEL_STAGES = [
    { key: "door_impression", label: "Ansicht" },
    { key: "door_click", label: "Klick" },
    { key: "checkout_open", label: "Checkout geöffnet" },
    { key: "payment_attempt", label: "Kaufversuch" },
    { key: "email_submit", label: "E-Mail hinterlassen" },
  ];

  function aggregateLocalEvents(events) {
    const doors = {};
    let totalDuration = 0, durationSamples = 0, emails = 0;
    events.forEach((e) => {
      const doorId = e.doorId || "_ohne_tuer";
      if (!doors[doorId]) doors[doorId] = { title: e.doorTitle || doorId, counts: {} };
      doors[doorId].counts[e.event] = (doors[doorId].counts[e.event] || 0) + 1;
      if (e.doorTitle) doors[doorId].title = e.doorTitle;
      if (e.event === "page_duration" && typeof e.value === "number") {
        totalDuration += e.value;
        durationSamples += 1;
      }
      if (e.event === "email_submit") emails += 1;
    });
    return {
      ok: true,
      totalEvents: events.length,
      totalEmails: emails,
      avgDurationSeconds: durationSamples ? Math.round(totalDuration / durationSamples) : 0,
      doors,
      source: "local",
    };
  }

  function formatDuration(sec) {
    if (!sec) return "0s";
    if (sec < 60) return sec + "s";
    return Math.floor(sec / 60) + "m " + (sec % 60) + "s";
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  const NO_DOOR_KEY = "_ohne_tuer";

  function realDoorIds(doors) {
    return Object.keys(doors).filter((id) => id !== NO_DOOR_KEY);
  }

  function sumStage(doors, stageKey) {
    let total = 0;
    Object.keys(doors).forEach((id) => { total += (doors[id].counts[stageKey] || 0); });
    return total;
  }

  function renderKpis(data) {
    document.getElementById("kpiEvents").textContent = data.totalEvents.toLocaleString("de-DE");
    document.getElementById("kpiEmails").textContent = data.totalEmails.toLocaleString("de-DE");
    document.getElementById("kpiDuration").textContent = formatDuration(data.avgDurationSeconds);
    document.getElementById("kpiDoors").textContent = realDoorIds(data.doors || {}).length.toLocaleString("de-DE");
  }

  function renderFunnel(data) {
    const wrap = document.getElementById("funnelChart");
    const values = FUNNEL_STAGES.map((s) => sumStage(data.doors, s.key));
    const max = Math.max(1, ...values);
    const minOpacity = 0.32;

    wrap.innerHTML = FUNNEL_STAGES.map((stage, i) => {
      const value = values[i];
      const pct = max ? (value / max) * 100 : 0;
      const opacity = minOpacity + (1 - minOpacity) * (i / (FUNNEL_STAGES.length - 1));
      const convOfPrev = i === 0 ? null : (values[i - 1] ? Math.round((value / values[i - 1]) * 100) : 0);
      return `
        <div class="funnel-row">
          <div class="funnel-label">${escapeHtml(stage.label)}${convOfPrev !== null ? `<span class="funnel-conv">${convOfPrev}% vom vorherigen Schritt</span>` : ""}</div>
          <div class="funnel-track">
            <div class="funnel-fill" style="width:${Math.max(pct, value > 0 ? 3 : 0)}%; background-color: var(--brand); opacity:${opacity.toFixed(2)};" title="${escapeHtml(stage.label)}: ${value}"></div>
          </div>
          <div class="funnel-value">${value.toLocaleString("de-DE")}</div>
        </div>
      `;
    }).join("");
  }

  function renderDoorBars(data) {
    const wrap = document.getElementById("doorBars");
    const doors = data.doors || {};
    const rows = realDoorIds(doors).map((id) => ({
      id, title: doors[id].title || id, clicks: doors[id].counts.door_click || 0,
    })).sort((a, b) => b.clicks - a.clicks);

    if (rows.length === 0) {
      wrap.innerHTML = '<div class="empty-state">Noch keine Klicks erfasst.</div>';
      return;
    }
    const max = Math.max(1, ...rows.map((r) => r.clicks));
    wrap.innerHTML = rows.map((r) => `
      <div class="funnel-row">
        <div class="funnel-label">${escapeHtml(r.title)}</div>
        <div class="funnel-track">
          <div class="funnel-fill" style="width:${Math.max((r.clicks / max) * 100, r.clicks > 0 ? 3 : 0)}%; background-color: var(--brand);" title="${escapeHtml(r.title)}: ${r.clicks} Klicks"></div>
        </div>
        <div class="funnel-value">${r.clicks.toLocaleString("de-DE")}</div>
      </div>
    `).join("");
  }

  function renderTable(data) {
    const tbody = document.querySelector("#doorTable tbody");
    const doors = data.doors || {};
    const ids = realDoorIds(doors);
    if (ids.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Noch keine Daten.</td></tr>';
      return;
    }
    tbody.innerHTML = ids.map((id) => {
      const d = doors[id];
      const c = d.counts;
      const impressions = c.door_impression || 0;
      const clicks = c.door_click || 0;
      const checkout = c.checkout_open || 0;
      const payment = c.payment_attempt || 0;
      const emails = c.email_submit || 0;
      const rate = clicks ? Math.round((emails / clicks) * 100) : 0;
      return `
        <tr>
          <td>${escapeHtml(d.title || id)}</td>
          <td>${impressions}</td>
          <td>${clicks}</td>
          <td>${checkout}</td>
          <td>${payment}</td>
          <td>${emails}</td>
          <td>${rate}%</td>
        </tr>
      `;
    }).join("");
  }

  function downloadCsv() {
    const events = FDT.readLocalEvents();
    if (events.length === 0) { alert("Keine lokalen Ereignisse in diesem Browser gefunden."); return; }
    const cols = ["ts", "event", "doorId", "doorTitle", "sessionId", "value", "email", "page", "referrer", "userAgent"];
    const lines = [cols.join(",")];
    events.forEach((e) => {
      lines.push(cols.map((c) => '"' + String(e[c] == null ? "" : e[c]).replace(/"/g, '""') + '"').join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fake-door-events-lokal.csv";
    a.click();
  }

  function render(data) {
    renderKpis(data);
    renderFunnel(data);
    renderDoorBars(data);
    renderTable(data);
  }

  function showSourceNote(text, isWarning) {
    const el = document.getElementById("sourceNote");
    el.textContent = text;
    el.style.color = isWarning ? "var(--warning)" : "var(--muted)";
  }

  /* Google Apps Script setzt bei doGet-Antworten keinen
     "Access-Control-Allow-Origin"-Header. Ein normaler fetch() von
     dieser Seite (einer anderen Domain) wird deshalb vom Browser per
     CORS blockiert -- das passiert unabhängig davon, ob das Script
     selbst fehlerfrei läuft. JSONP (Antwort als ausführbares
     <script>, statt per fetch gelesen) umgeht dieses Problem
     vollständig, weil <script>-Tags nicht der CORS-Regel unterliegen. */
  function jsonpRequest(url, timeoutMs) {
    return new Promise((resolve, reject) => {
      const cbName = "fdt_cb_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e6);
      const script = document.createElement("script");
      let settled = false;

      function finish(ok, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener("error", onGlobalError, true);
        delete window[cbName];
        script.remove();
        ok ? resolve(value) : reject(value);
      }

      function onGlobalError() {
        // Eine echte JSON(P)-Antwort ruft nie einen globalen Skriptfehler
        // hervor -- das deutet auf eine HTML-Fehlerseite von Apps Script hin.
        finish(false, new Error(
          "Die Web-App-URL lieferte keine gültige Antwort (vermutlich eine Google-Fehlerseite " +
          "statt echter Daten). Häufigste Ursache: Der Code in Apps Script wurde geändert, aber " +
          "es wurde keine NEUE VERSION bereitgestellt (Bereitstellen → Bereitstellungen verwalten " +
          "→ Stift-Symbol → Version: \"Neue Version\" → Bereitstellen). Details in der README.md, " +
          "Abschnitt \"Fehlerbehebung\"."
        ));
      }

      const timer = setTimeout(() => finish(false, new Error(
        "Zeitüberschreitung -- keine Antwort von der Web-App-URL erhalten. Prüfe, ob die URL korrekt " +
        "ist und beim Bereitstellen unter \"Zugriff\" wirklich \"Alle\" (Anyone) ausgewählt wurde."
      )), timeoutMs || 10000);

      window[cbName] = function (data) { finish(true, data); };
      script.onerror = function () { finish(false, new Error("Web-App-URL nicht erreichbar (Netzwerkfehler oder falsche URL).")); };
      window.addEventListener("error", onGlobalError, true);

      script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cbName;
      document.head.appendChild(script);
    });
  }

  function init() {
    document.getElementById("exportCsvBtn").addEventListener("click", downloadCsv);
    const url = window.SITE_CONFIG && window.SITE_CONFIG.trackingWebAppUrl;

    if (!url) {
      showSourceNote("⚠️ Kein Google Sheet verbunden (trackingWebAppUrl ist leer). Es werden nur lokale Testdaten aus DIESEM Browser gezeigt – für den echten Test bitte das Tracking-Backend einrichten (siehe README.md).", true);
      render(aggregateLocalEvents(FDT.readLocalEvents()));
      return;
    }

    showSourceNote("Lade Daten aus dem Google Sheet …", false);
    jsonpRequest(url + (url.includes("?") ? "&" : "?") + "action=stats")
      .then((data) => {
        if (!data || data.ok === false) throw new Error((data && data.error) || "Unbekannter Fehler");
        showSourceNote("Datenquelle: Google Sheet · zuletzt aktualisiert " + new Date().toLocaleTimeString("de-DE"), false);
        render(data);
      })
      .catch((err) => {
        console.warn("[Auswertung] Sheet-Abruf fehlgeschlagen:", err);
        showSourceNote("⚠️ " + err.message + " Zeige unten stattdessen lokale Testdaten aus DIESEM Browser.", true);
        render(aggregateLocalEvents(FDT.readLocalEvents()));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
