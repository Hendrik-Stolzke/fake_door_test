/* =====================================================================
   STATS.JS – lädt Auswertungsdaten (vom Google Sheet oder lokal aus
   diesem Browser) und rendert KPI-Kacheln, Funnel und Tabelle auf
   auswertung.html.
   ===================================================================== */

(function () {
  "use strict";

  // Entspricht dem Weg einer Tür: Startseite -> Klick -> eigene
  // Produktseite -> Popup "Verfügbarkeit prüfen" -> E-Mail hinterlassen.
  const FUNNEL_STAGES = [
    { key: "door_impression", label: "Ansicht (Startseite)" },
    { key: "door_click", label: "Klick zum Produkt" },
    { key: "page_view", label: "Produktseite aufgerufen" },
    { key: "reserve_click", label: "Popup geöffnet" },
    { key: "email_submit", label: "E-Mail hinterlassen" },
  ];

  function aggregateLocalEvents(events) {
    const doors = {};
    let totalDuration = 0, durationSamples = 0, emails = 0;
    events.forEach((e) => {
      const doorId = e.doorId || "_ohne_tuer";
      if (!doors[doorId]) doors[doorId] = { title: e.doorTitle || doorId, counts: {}, _durTotal: 0, _durSamples: 0 };
      doors[doorId].counts[e.event] = (doors[doorId].counts[e.event] || 0) + 1;
      if (e.doorTitle) doors[doorId].title = e.doorTitle;
      if (e.event === "page_duration" && typeof e.value === "number") {
        totalDuration += e.value;
        durationSamples += 1;
        doors[doorId]._durTotal += e.value;
        doors[doorId]._durSamples += 1;
      }
      if (e.event === "email_submit") emails += 1;
    });
    Object.keys(doors).forEach((id) => {
      const d = doors[id];
      d.avgDurationSeconds = d._durSamples ? Math.round(d._durTotal / d._durSamples) : 0;
      delete d._durTotal;
      delete d._durSamples;
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
    // Nur echte Türen zählen -- sonst würde z.B. der generische "page_view"
    // der Startseite selbst (Bucket "_ohne_tuer") den Produkt-Funnel verfälschen.
    let total = 0;
    realDoorIds(doors).forEach((id) => { total += (doors[id].counts[stageKey] || 0); });
    return total;
  }

  function thumbHtml(r) {
    if (r.image) return `<img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}">`;
    return escapeHtml(r.emoji || "🔒");
  }

  /* =====================================================================
     PRODUKTVERGLEICH -- verbindet die Tracking-Zahlen (Klicks, Verweildauer,
     ...) mit den Produktangaben aus js/config.js (Preis, Bild) und
     berechnet je Produkt eine "Gesamt-Conversion": von allen, die die
     Produktseite überhaupt gesehen haben (page_view -- der zuverlässigste
     Nenner, auch bei direkt geteilten Links ohne Umweg über die Startseite),
     wie viele haben am Ende "Vormerken" abgeschlossen (email_submit)?
     Darüber lässt sich einfach erklären, was gut läuft und was nicht --
     auch im Verhältnis zum Preis, der direkt mit angezeigt wird.
     ===================================================================== */
  function makeComparisonRow(id, d, cfg) {
    const c = (d && d.counts) || {};
    const impressions = c.door_impression || 0;
    const clicks = c.door_click || 0;
    const pageViews = c.page_view || 0;
    const reserves = c.reserve_click || 0; // = Popup geöffnet ("Verfügbarkeit prüfen")
    const abandons = c.email_modal_abandon || 0; // Popup geschlossen, ohne E-Mail einzutragen
    const emails = c.email_submit || 0;
    // Reichweite = wie viele haben die Produktseite überhaupt gesehen.
    // Fallback auf Klicks/Impressionen, falls page_view (noch) fehlt.
    const reach = pageViews || clicks || impressions;
    return {
      id,
      title: (cfg && cfg.title) || (d && d.title) || id,
      price: cfg ? cfg.price : "",
      emoji: cfg ? cfg.emoji : "",
      image: cfg ? cfg.image : "",
      impressions, clicks, pageViews, reserves, abandons, emails,
      avgDurationSeconds: (d && d.avgDurationSeconds) || 0,
      reach,
      conversion: reach ? emails / reach : null,
    };
  }

  function buildComparison(doors) {
    // WICHTIG: Ausgangspunkt ist die Produktliste aus js/config.js, nicht
    // nur die bereits vorhandenen Ereignisse -- sonst würde ein Produkt
    // OHNE jeden Aufruf (das ist selbst ein starkes Signal: keiner
    // interessiert sich dafür!) im Vergleich komplett fehlen, statt als
    // "noch keine Daten" aufzutauchen.
    const configuredDoors = window.DOORS || [];
    const seen = new Set();
    const rows = configuredDoors.map((cfg) => {
      seen.add(cfg.id);
      return makeComparisonRow(cfg.id, doors[cfg.id], cfg);
    });

    // Alte Ereignisse zu Produkten, die es in config.js nicht mehr gibt,
    // trotzdem anzeigen statt sie stillschweigend zu verwerfen.
    realDoorIds(doors).forEach((id) => {
      if (seen.has(id)) return;
      rows.push(makeComparisonRow(id, doors[id], null));
    });

    const withData = rows.filter((r) => r.reach > 0);
    const avgConversion = withData.length
      ? withData.reduce((sum, r) => sum + r.conversion, 0) / withData.length
      : null;
    rows.forEach((r) => { r.avgConversion = avgConversion; r.comparable = withData.length >= 2; });

    // Produkte mit Daten zuerst (beste Conversion oben), Produkte ganz ohne
    // Aufrufe ans Ende -- die lassen sich noch nicht bewerten.
    rows.sort((a, b) => {
      if (a.reach === 0 && b.reach === 0) return 0;
      if (a.reach === 0) return 1;
      if (b.reach === 0) return -1;
      return b.conversion - a.conversion;
    });
    return rows;
  }

  function renderKpis(data, rows) {
    document.getElementById("kpiEvents").textContent = data.totalEvents.toLocaleString("de-DE");
    document.getElementById("kpiEmails").textContent = data.totalEmails.toLocaleString("de-DE");
    document.getElementById("kpiDuration").textContent = formatDuration(data.avgDurationSeconds);
    // Anzahl der konfigurierten Produkte (js/config.js) -- nicht nur die,
    // für die schon Daten vorliegen.
    document.getElementById("kpiDoors").textContent = (window.DOORS || []).length.toLocaleString("de-DE");

    const best = rows.find((r) => r.reach > 0);
    const bestEl = document.getElementById("kpiBest");
    const bestSubEl = document.getElementById("kpiBestSub");
    if (best) {
      bestEl.textContent = best.title;
      bestSubEl.textContent = Math.round(best.conversion * 100) + "% Gesamt-Conversion";
    } else {
      bestEl.textContent = "–";
      bestSubEl.textContent = "Noch keine Daten";
    }
  }

  function renderComparison(rows) {
    const wrap = document.getElementById("compareGrid");
    if (rows.length === 0) {
      wrap.innerHTML = '<div class="empty-state">Noch keine Produkte in js/config.js eingetragen.</div>';
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    let rank = 0;

    wrap.innerHTML = rows.map((r) => {
      const medal = r.reach > 0 && rank < 3 ? medals[rank] : "";
      if (r.reach > 0) rank++;

      let status = "";
      if (r.reach === 0) {
        status = '<span class="compare-status neutral">Noch keine Daten</span>';
      } else if (r.comparable) {
        if (r.conversion > r.avgConversion * 1.05) {
          status = '<span class="compare-status good">✓ Überdurchschnittlich</span>';
        } else if (r.conversion < r.avgConversion * 0.95) {
          status = '<span class="compare-status warning">⚠ Unterdurchschnittlich</span>';
        } else {
          status = '<span class="compare-status neutral">≈ Durchschnitt</span>';
        }
      }

      const stages = [
        { label: "Ansicht", value: r.impressions },
        { label: "Klick", value: r.clicks },
        { label: "Seite", value: r.pageViews },
        { label: "Popup", value: r.reserves },
        { label: "E-Mail", value: r.emails },
      ];
      const maxStage = Math.max(1, ...stages.map((s) => s.value));
      const abandonRate = r.reserves ? Math.round((r.abandons / r.reserves) * 100) : null;

      return `
        <div class="compare-card">
          ${medal ? `<div class="compare-rank">${medal}</div>` : ""}
          <div class="compare-header">
            <div class="compare-thumb">${thumbHtml(r)}</div>
            <div class="compare-heading">
              <h3>${escapeHtml(r.title)}</h3>
              ${r.price ? `<div class="compare-price">${escapeHtml(r.price)}</div>` : ""}
            </div>
          </div>
          ${status}
          ${r.reach > 0 ? `
            <div class="compare-score">
              <span class="compare-score-value">${Math.round(r.conversion * 100)}%</span>
              <span class="compare-score-label">Gesamt-Conversion (Seitenaufruf → E-Mail)</span>
            </div>
            <div class="mini-funnel">
              ${stages.map((s) => `
                <div class="mini-funnel-row">
                  <div class="mf-label">${escapeHtml(s.label)}</div>
                  <div class="mini-funnel-track"><div class="mini-funnel-fill" style="width:${Math.max((s.value / maxStage) * 100, s.value > 0 ? 4 : 0)}%"></div></div>
                  <div class="mf-value">${s.value}</div>
                </div>
              `).join("")}
            </div>
            <div class="compare-footer">
              Ø Verweildauer auf der Produktseite: <strong>${formatDuration(r.avgDurationSeconds)}</strong>
              ${r.reserves > 0 ? `<br>Im Popup abgebrochen: <strong>${r.abandons} von ${r.reserves}</strong>${abandonRate !== null ? ` (${abandonRate}%)` : ""}` : ""}
            </div>
          ` : `
            <p class="compare-empty">Noch niemand hat diese Produktseite aufgerufen.</p>
          `}
        </div>
      `;
    }).join("");
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

  function renderTable(rows) {
    const tbody = document.querySelector("#doorTable tbody");
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-state">Noch keine Daten.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.title)}</td>
        <td>${r.price ? escapeHtml(r.price) : "–"}</td>
        <td>${r.impressions}</td>
        <td>${r.clicks}</td>
        <td>${r.pageViews}</td>
        <td>${r.reserves}</td>
        <td>${r.abandons}</td>
        <td>${r.emails}</td>
        <td>${r.reach ? Math.round(r.conversion * 100) + "%" : "–"}</td>
        <td>${formatDuration(r.avgDurationSeconds)}</td>
      </tr>
    `).join("");
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
    const rows = buildComparison(data.doors || {});
    renderKpis(data, rows);
    renderFunnel(data);
    renderComparison(rows);
    renderTable(rows);
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
