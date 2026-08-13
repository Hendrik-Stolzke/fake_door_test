/* =====================================================================
   KONFIGURATION – DIESE DATEI STEUERT DIE GANZE SEITE
   Du brauchst KEINE Programmierkenntnisse, um hier etwas zu ändern.
   Halte dich einfach an das Muster (Anführungszeichen, Kommas) und
   speichere die Datei. Das war's – Layout, Tracking usw. passen sich
   automatisch an.

   Alles hinter // ist ein Kommentar und wird ignoriert.
   ===================================================================== */

const SITE_CONFIG = {
  // ---- Grundtexte ------------------------------------------------
  siteTitle: "Meine Produktidee",           // erscheint oben links & im Browser-Tab
  logoEmoji: "🚪",                          // ein Emoji als Logo, z.B. "🚀" "✨" "🧪"
  heroBadge: "Early-Access-Test",
  heroHeadline: "Wir bauen etwas Neues – hilf uns zu verstehen, was du wirklich brauchst.",
  heroSubtext: "Klicke auf ein Angebot, das dich interessiert, und probiere den Bestellprozess aus.",

  // ---- Farben (Hex-Code, mit # davor) -----------------------------
  brandColor: "#2a78d6",
  brandColorDark: "#184f95",
  accentColor: "#eb6834",

  // ---- TRACKING: Google Sheet (kostenlos) -------------------------
  // Trage hier die Web-App-URL deines Google Apps Scripts ein.
  // Anleitung dazu steht in der README.md, Abschnitt "Tracking einrichten".
  // Solange dieses Feld leer ("") ist, werden Klicks nur lokal in
  // deinem eigenen Browser gespeichert (gut zum Testen, aber NICHT
  // für den echten Live-Test mit echten Besucher:innen geeignet!).
  trackingWebAppUrl: "https://script.google.com/macros/s/AKfycbzQAXJ0FHWhJq0U3qWBdGrlcW52n3I5wroaGBj4YBDF7VUmMCeuqNFxKYBs_W1eLk0F/exec",

  // ---- TRACKING: Google Analytics 4 (optional, kostenlos) ---------
  // Trage hier deine Messwert-ID ein, z.B. "G-ABC1234XYZ".
  // Leer lassen ("") = kein Google Analytics, das eingebaute
  // Tracking über das Google Sheet funktioniert trotzdem.
  gaMeasurementId: "",

  // ---- E-Mail-Einsammlung -----------------------------------------
  emailPromptTitle: "Fast geschafft!",
  emailPromptText: "Dieses Produkt ist noch in Arbeit und aktuell nicht käuflich – es wurde nichts abgebucht. Trag deine E-Mail ein und wir benachrichtigen dich, sobald es startet.",
  emailPlaceholder: "du@beispiel.de",
  emailButtonText: "Benachrichtige mich",
  emailThanksTitle: "Danke dir! 🎉",
  emailThanksText: "Wir melden uns, sobald es losgeht.",

  // ---- Rechtliches (bitte ausfüllen vor dem Live-Schalten!) --------
  companyName: "Vorname Nachname",
  companyStreet: "Musterstraße 1",
  companyCity: "12345 Musterstadt",
  companyCountry: "Deutschland",
  companyEmail: "kontakt@beispiel.de",
  companyPhone: "",                          // optional
  responsiblePerson: "Vorname Nachname",     // Verantwortlich gem. § 18 Abs. 2 MStV
};

/* =====================================================================
   DIE TÜREN ("Fake Doors")
   Jeder Block { ... } ist EIN Produkt/EINE Idee, die getestet wird.
   Du kannst beliebig viele hinzufügen oder löschen – kopiere dafür
   einfach einen kompletten Block inklusive der geschweiften Klammern
   { } und der Endkomma, und ändere die Werte.

   Felder:
   - id:          eindeutiger Name ohne Leerzeichen/Umlaute (für die Auswertung)
   - title:       Produktname
   - description: kurzer Text (1 Satz reicht)
   - price:       Preis als Text, z.B. "19,99 €" oder "ab 9 € / Monat"
   - emoji:       wird gezeigt, wenn kein Bild angegeben ist
   - image:       (optional) Bild-URL, z.B. "https://..." oder "bilder/produkt-a.jpg"
   - badge:       (optional) kleines Label wie "Neu" oder "Beliebt" – leer lassen mit ""
   ===================================================================== */

const DOORS = [
  {
    id: "produkt-a",
    title: "Produkt A",
    description: "Kurz erklärt: Was macht dieses Produkt und für wen ist es gedacht?",
    price: "19,99 €",
    emoji: "🚀",
    image: "",
    badge: "Beliebt",
  },
  {
    id: "produkt-b",
    title: "Produkt B",
    description: "Kurz erklärt: Was macht dieses Produkt und für wen ist es gedacht?",
    price: "9,99 € / Monat",
    emoji: "✨",
    image: "",
    badge: "",
  },
  {
    id: "produkt-c",
    title: "Produkt C",
    description: "Kurz erklärt: Was macht dieses Produkt und für wen ist es gedacht?",
    price: "49,00 €",
    emoji: "📦",
    image: "",
    badge: "Neu",
  },
];

/* =====================================================================
   DAS TEAM
   Genau wie bei DOORS: Block kopieren, um weitere Personen hinzuzufügen,
   Block löschen, um jemanden zu entfernen.

   Felder: name, role (Rolle), bio (1 Satz), emoji, image (optional)
   ===================================================================== */

const TEAM = [
  {
    name: "Vorname Nachname",
    role: "Gründer:in",
    bio: "Ein Satz über dich und warum du dieses Produkt baust.",
    emoji: "🧑‍💻",
    image: "",
  },
  {
    name: "Vorname Nachname",
    role: "Produkt & Design",
    bio: "Ein Satz über diese Person.",
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
