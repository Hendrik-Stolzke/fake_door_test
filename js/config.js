/* =====================================================================
   KONFIGURATION – DIESE DATEI STEUERT DIE GANZE SEITE
   Du brauchst KEINE Programmierkenntnisse, um hier etwas zu ändern.
   Halte dich einfach an das Muster (Anführungszeichen, Kommas) und
   speichere die Datei. Das war's – Layout, Tracking usw. passen sich
   automatisch an.

   Alles hinter // ist ein Kommentar und wird ignoriert.

   ERSTEINRICHTUNG -- SO GEHST DU VOR:
   1. Alles, was in [eckigen Klammern] steht oder das Wort ERSETZEN enthält,
      ist ein BEISPIEL/PLATZHALTER. Ersetze den ganzen Text samt Klammern
      durch deinen eigenen.
   1b. Speichere diese Datei als UTF-8 (Editor: "Speichern unter" -> Codierung
      UTF-8), sonst werden Umlaute kaputt dargestellt.
   2. Trage unbedingt echte Angaben unter "Rechtliches" ein (Impressum!).
   3. Solange noch Platzhalter da sind, zeigt die Seite oben einen roten
      Balken "NICHT LIVE SCHALTEN" mit der Liste, was noch fehlt.
   4. Danach Tracking einrichten (README Abschnitt 4) und die URL eintragen.
   ===================================================================== */

const SITE_CONFIG = {
  // ---- Grundtexte ------------------------------------------------
  siteTitle: "[ERSETZEN: Mein Projektname]",       // ← ERSETZEN: erscheint oben links & im Browser-Tab
  logoEmoji: "🧪",                          // ein Emoji als Logo, z.B. "🚀" "✨" "☕"

  // ---- Startseite nach Simon Sineks "Golden Circle" ----------------
  // Erst WARUM (die Überzeugung/Mission), dann WIE (euer Ansatz),
  // erst zuletzt WAS (die konkreten Produkte/Türen unten).

  // WARUM -- der große Aufhänger ganz oben auf der Seite
  whyBadge: "Warum",                       // kleines Label über der Überschrift
  whyHeadline: "[ERSETZEN: Wir glauben, dass … -- deine Überzeugung in einem Satz]",   // ← ERSETZEN (Beispiel: "Wir glauben, dass jeder Mensch Zeit für sich verdient.")
  whyText: "[ERSETZEN: Unsere Vision: … -- 1-2 Sätze, welche Veränderung du bewirken willst. Keine unbelegten Superlative wie \"der Beste\"!]",   // ← ERSETZEN

  // WIE -- euer Ansatz, in 3 kurzen Punkten
  howTitle: "Wie wir das anders machen",
  howPoints: [
    { emoji: "🎯", title: "[ERSETZEN: Punkt 1: Titel]", text: "[ERSETZEN: Ein Satz, wie du es anders machst. Nur Wahres oder als \"Geplant:\" Gekennzeichnetes!]" },   // ← ERSETZEN
    { emoji: "🤝", title: "[ERSETZEN: Punkt 2: Titel]", text: "[ERSETZEN: Ein Satz dazu]" },
    { emoji: "⚡", title: "[ERSETZEN: Punkt 3: Titel]", text: "[ERSETZEN: Ein Satz dazu]" },
  ],

  // WAS -- Überschrift direkt über den Produktkarten (den "Türen" unten)
  whatTitle: "Unsere Produktideen",
  whatText: "Das sind unsere Produktideen – sie befinden sich in der Testphase und sind noch nicht erhältlich:",

  // ---- Farben (Hex-Code, mit # davor) -----------------------------
  brandColor: "#1f6bc4",
  brandColorDark: "#184f95",
  accentColor: "#eb6834",

  // ---- TRACKING: Google Sheet (kostenlos) -------------------------
  // Trage hier die Web-App-URL deines Google Apps Scripts ein.
  // Anleitung dazu steht in der README.md, Abschnitt "Tracking einrichten".
  // Solange dieses Feld leer ("") ist, werden Klicks nur lokal in
  // deinem eigenen Browser gespeichert (gut zum Testen, aber NICHT
  // für den echten Live-Test mit echten Besucher:innen geeignet!).
  trackingWebAppUrl: "",   // ← ERSETZEN: deine Web-App-URL, endet auf /exec, z.B. "https://script.google.com/macros/s/AKfy.../exec"
                           // Ohne gültige URL zeigt das Vormerk-Formular eine Fehlermeldung statt "Danke" (nichts geht verloren, ohne dass es auffällt).

  // ---- TRANSPARENZ (Pflicht, nicht löschen!) ----------------------
  // Besucher:innen dürfen nicht glauben, die Produkte seien bestellbar
  // (Irreführungsverbot, § 5 UWG). Dieser Hinweis steht oben auf der
  // Startseite und auf jeder Produktseite, der Preis trägt das Label.
  testNoticeTitle: "Testphase:",
  testNoticeText: "Die hier gezeigten Produkte gibt es noch nicht. Sie können weder bestellt noch bezahlt werden. Preise sind unverbindliche Preisideen.",
  priceLabel: "Geplanter Preis (unverbindlich)",
  unavailableLabel: "Noch nicht erhältlich – nur Vormerkung möglich",

  // ---- "Verfügbarkeit prüfen"-Button auf der Produktseite ----------
  // Öffnet ein Popup mit dem E-Mail-Formular (statt direkt auf der Seite).
  reserveButtonText: "Verfügbarkeit prüfen",
  reserveCancelText: "Abbrechen",
  reserveFormTitle: "Fast geschafft!",
  reserveFormText: "Dieses Produkt gibt es noch nicht. Wir prüfen derzeit, ob wir es umsetzen. Trag deine E-Mail ein, dann melden wir uns einmalig bei dir, falls wir es realisieren.",
  emailPlaceholder: "du@beispiel.de",
  reserveSubmitText: "Vormerken bestätigen",
  reserveThanksTitle: "Danke dir! 🎉",
  reserveThanksText: "Falls wir das Produkt umsetzen, melden wir uns einmalig bei dir.",

  // ---- Rechtliches (bitte ausfüllen vor dem Live-Schalten!) --------
  companyName: "[ERSETZEN: Vorname Nachname]",          // ← ERSETZEN: dein Name (ohne Firma: nur als Privatperson, keine Rechtsform erfinden!)
  companyStreet: "Musterstraße 1",
  companyCity: "12345 Musterstadt",
  companyCountry: "Deutschland",
  companyEmail: "kontakt@beispiel.de",
  companyPhone: "",                          // ← PFLICHT in der Praxis (zweiter Kontaktweg), Format: "+49 ..."
  responsiblePerson: "[ERSETZEN: Vorname Nachname]",     // Verantwortlich gem. § 18 Abs. 2 MStV
  companyVatId: "",                          // optional: Umsatzsteuer-ID, falls vorhanden
  // WICHTIG: Impressum braucht neben der E-Mail einen zweiten, schnellen
  // Kontaktweg -- in der Praxis eine Telefonnummer (companyPhone oben!).

  // ---- Datenschutz (wird in datenschutz.html eingesetzt) ------------
  hostingProvider: "Cloudflare, Inc. (USA)", // dein Hoster -- bei Netlify / GitHub Pages ändern ("Netlify, Inc. (USA)" / "GitHub Inc. (USA)")!
  // Fristen als feste Zeiträume ab Erhebung. Das Backend (backend/AppsScript.gs, Funktion purgeOld)
  // löscht danach automatisch -- RETENTION_EVENT_DAYS/RETENTION_EMAIL_DAYS dort müssen dazu passen (180 / 365 Tage).
  retentionEvents: "6 Monate nach der Erhebung",
  retentionEmails: "12 Monate nach der Erhebung oder bis zu deinem Widerruf, falls dieser früher erfolgt",
  legalUpdated: "[ERSETZEN: TT.MM.JJJJ]",    // ← ERSETZEN: Datum der letzten Änderung von Datenschutz/Impressum, z.B. "01.03.2027"
  // Auftragsverarbeitung (AVV) und Übermittlung in die USA -- nur eintragen, was WAHR und belegbar ist
  // (Google-DPA gilt nur mit Workspace-/Education-Konto; Zertifizierungen auf dataprivacyframework.gov prüfen). Erscheint in datenschutz.html.
  transferNote: "[ERSETZEN: z. B. Mit Google besteht ein Auftragsverarbeitungsvertrag (Google Cloud Data Processing Addendum). Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert. -- nur eintragen, wenn es stimmt]",
  encCheck: "äöü€",                          // Prüfwert für die Dateicodierung -- NICHT ändern oder löschen
};

/* =====================================================================
   DIE TÜREN ("Fake Doors")
   Jeder Block { ... } ist EIN Produkt/EINE Idee, die getestet wird und eine
   eigene Seite bekommt (produkt.html?id=...) mit Bild, Text und dem Button
   "Verfügbarkeit prüfen" (öffnet ein Popup mit E-Mail-Formular).
   Du kannst beliebig viele hinzufügen oder löschen – kopiere dafür
   einfach einen kompletten Block inklusive der geschweiften Klammern
   { } und der Endkomma, und ändere die Werte.

   Felder:
   - id:          eindeutiger Name ohne Leerzeichen/Umlaute (für die Auswertung)
   - title:       Produktname
   - description: kurzer Text (1 Satz reicht)
   - price:       Preis als Text, z.B. "19,99 €" oder "ab 9 € / Monat"
   - emoji:       wird gezeigt, wenn kein Bild angegeben ist
   - image:       (optional) Dateipfad im Ordner bilder/, z.B. "bilder/produkt-a.jpg"
                  -- Web-Adressen (https://...) sind NICHT erlaubt (sie würden die
                  IP-Adresse der Besucher vor der Einwilligung weitergeben). Siehe
                  bilder/README.md. Leer lassen ("") = Emoji als Platzhalter
   - badge:       (optional) kleines Label wie "Neu" – nur Wahres! Leer lassen mit ""
   ===================================================================== */

const DOORS = [

  {
    id: "produkt-a",                       // eindeutiger Kurzname: keine Leerzeichen/Umlaute, taucht in der URL auf
    title: "[ERSETZEN: Produktname A]",              // ← ERSETZEN: Name des Produkts
    description: "[ERSETZEN: Ein Satz: Was ist das Produkt, welchen Nutzen hat es? Keine falschen Angaben!]",
    price: "[ERSETZEN: 9,99 €]",                     // ← ERSETZEN: geplanter Preis (wird als "unverbindlich" gekennzeichnet)
    emoji: "🚀",                           // Platzhalter, solange image leer ist
    image: "",                             // optional, z.B. "bilder/produkt-a.jpg" (Datei in den Ordner bilder/ legen)
    badge: "",                             // optional: "Neu" ... (nichts Unbelegtes wie "Beliebt")
  },
  {
    id: "produkt-b",
    title: "[ERSETZEN: Produktname B]",
    description: "[ERSETZEN: Ein Satz zu Produkt B]",
    price: "[ERSETZEN: 19,99 €]",
    emoji: "✨",
    image: "",
    badge: "",
  },
  {
    id: "produkt-c",
    title: "[ERSETZEN: Produktname C]",
    description: "[ERSETZEN: Ein Satz zu Produkt C]",
    price: "[ERSETZEN: 49,00 €]",
    emoji: "🎁",
    image: "",
    badge: "",
  },
];

/* =====================================================================
   DAS TEAM
   Genau wie bei DOORS: Block kopieren, um weitere Personen hinzuzufügen,
   Block löschen, um jemanden zu entfernen.

   Felder: name, role (Rolle), bio (1 Satz), emoji, image (optional -- auch
   hier kommen eigene Fotos in den Ordner "bilder/", siehe bilder/README.md)
   ===================================================================== */

const TEAM = [
  {
    name: "[ERSETZEN: Vorname Nachname]",            // ← ERSETZEN: nur echte Personen, die zugestimmt haben
    role: "[ERSETZEN: Rolle, z. B. Gründung]",
    bio: "[ERSETZEN: Ein Satz über diese Person]",
    emoji: "🧑‍💻",
    image: "",                             // optional, z.B. "bilder/team-lena.jpg" (quadratisch, ohne GPS-Daten, nur mit Einverständnis der Person!)
  },
  {
    name: "[ERSETZEN: Vorname Nachname 2]",          // Person löschen, wenn du allein bist (kompletten Block entfernen)
    role: "[ERSETZEN: Rolle]",
    bio: "[ERSETZEN: Ein Satz über diese Person]",
    emoji: "🎨",
    image: "",
  },
];

// Diese drei Zeilen bitte nicht löschen -- sie sorgen dafür, dass alle
// anderen Skripte (app.js, tracking.js, stats.js) auf die Werte oben
// zugreifen können.
window.SITE_CONFIG = SITE_CONFIG;
window.DOORS = DOORS;
window.TEAM = TEAM;
