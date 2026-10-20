# Fake-Door-Test – Baukasten

Eine fertige, kostenlose Website, um mehrere Produktideen gleichzeitig zu testen --
aufgebaut nach Simon Sineks **Golden Circle** ("Start With Why"): Die Startseite
erklärt zuerst **Warum** es das Projekt gibt, dann **Wie** ihr das anders macht,
und erst danach **Was** ihr konkret anbietet (die "Türen"). Jede Tür bekommt eine
**eigene Produktseite** mit Bild, Text und einem **"Verfügbarkeit prüfen"-Button**
-- kein Fake-Zahlungsformular. Der Klick öffnet ein **Popup** mit dem
E-Mail-Formular ("benachrichtige mich beim Launch"). Jeder Klick, jeder
Seitenaufruf, jede Verweildauer UND jedes abgebrochene Popup (jemand öffnet es,
trägt aber keine E-Mail ein) wird automatisch getrackt -- **pro Produkt
getrennt**, damit sich Produkte klar voneinander unterscheiden lassen.

Keine Programmierkenntnisse nötig, um Inhalte zu ändern – nur eine Datei
(`js/config.js`) und den Ordner `bilder/` bearbeiten. Alles ist kostenlos betreibbar.

> ⚠️ **Ohne Gewähr, Stand 10/2026. Keine Rechtsberatung.** Die rechtlichen Hinweise
> in dieser Vorlage sind eine Orientierung, kein Ersatz für eine Prüfung deines
> Einzelfalls. **Verantwortlich ist, wer die Seite betreibt** und das Google Sheet
> kontrolliert -- nicht der Ersteller der Vorlage.

---

## 1. Was ist enthalten?

```
index.html          Startseite: Warum -> Wie -> Was (die Türen)
produkt.html         Eigene Seite JEDER Tür (produkt.html?id=...), mit "Verfügbarkeit prüfen"-Popup
team.html            Team-Seite
impressum.html       Impressum (Pflichtangaben)
datenschutz.html     Datenschutzerklärung
auswertung.html      Live-Dashboard mit den Tracking-Ergebnissen
css/style.css        Design (Farben, Layout)
js/config.js         ★ DIE DATEI, DIE DU BEARBEITEST ★ – Türen, Team, Texte, Tracking-Links
js/tracking.js        Tracking-Logik (Consent, Events, Verweildauer -- pro Seite/Produkt)
js/app.js             Rendert Startseite (Warum/Wie/Was) und Team
js/product.js          Rendert produkt.html und steuert das Popup (öffnen/abbrechen/abschließen)
js/stats.js            Rendert das Dashboard auf auswertung.html
backend/AppsScript.gs  Code für dein kostenloses Google-Sheet-Backend
_headers             Sicherheits-Header (CSP u. a.) für Cloudflare Pages / Netlify
bilder/              deine Bilder (in der Vorlage absichtlich leer, siehe bilder/README.md)
```

Du kannst diesen Ordner (nach dem Ausfüllen von `js/config.js`) auf einen
Gratis-Webhosting-Dienst hochladen (siehe Abschnitt 6) – es ist reines
HTML/CSS/JavaScript, kein Server, keine Installation, keine Kosten.
`auswertung.html` (dein Dashboard) ist **nirgends verlinkt** und per `noindex` von
Suchmaschinen ausgenommen -- ruf sie direkt mit `https://deine-seite/auswertung.html` auf.

---

## 2. Türen (Produkte) anpassen – für Nicht-Programmierer:innen

Öffne `js/config.js` mit einem einfachen Texteditor (z. B. Editor unter Windows,
TextEdit im "Nur Text"-Modus auf dem Mac, oder besser: [VS Code](https://code.visualstudio.com/), kostenlos).

Finde den Block `const DOORS = [ ... ]`. Jedes Produkt ist ein Abschnitt zwischen
geschweiften Klammern und bekommt automatisch seine eigene Seite unter
`produkt.html?id=<id>`:

```js
{
  id: "produkt-a",              // eindeutiger Name, ohne Leerzeichen/Umlaute -- taucht in der URL auf
  title: "Produkt A",           // Name, der angezeigt wird
  description: "Kurzer Text.",  // 1 Satz Beschreibung
  price: "19,99 €",             // Preis als Text
  emoji: "🚀",                  // Icon, falls kein Bild
  image: "",                    // optional: Datei im Ordner bilder/, z. B. "bilder/produkt-a.jpg"
  badge: "",                    // optional: kleines Label wie "Neu" (nichts Unbelegtes!), sonst ""
},
```

- **Tür hinzufügen:** einen kompletten Block kopieren, einfügen, Werte ändern.
- **Tür entfernen:** den kompletten Block (inkl. `{ }` und Komma) löschen.
- **Reihenfolge ändern:** Blöcke einfach verschieben.
- **Eigenes Produktbild statt Emoji:** Bilddatei in den Ordner `bilder/` legen
  (Anleitung dort in `bilder/README.md`) und bei `image` den Pfad eintragen,
  z. B. `image: "bilder/produkt-a.jpg"`. **Nur Dateien aus `bilder/`** -- Web-Adressen
  (`https://...`) werden bewusst ignoriert (die IP-Adresse der Besucher ginge sonst vor der
  Einwilligung an einen Fremdserver). Fehlt das Bild, zeigt die Seite das Emoji.

Die Anzahl der Türen ist beliebig – die Seite passt das Layout automatisch an,
inklusive einer eigenen Unterseite pro Tür. Speichern, Seite im Browser neu
laden – fertig.

Das Team auf `team.html` funktioniert genauso über das `TEAM`-Array in derselben Datei.

### Startseite: Warum -> Wie -> Was (Golden Circle)

Ebenfalls in `js/config.js`, im Block `SITE_CONFIG`, findest du drei Abschnitte
nach Simon Sineks "Start With Why"-Prinzip:

- **`whyBadge` / `whyHeadline` / `whyText`** -- der große Aufhänger ganz oben:
  WARUM gibt es euch, wofür steht ihr? (Nicht: was verkauft ihr.)
- **`howTitle` / `howPoints`** -- 3 kurze Punkte, WIE ihr das anders macht als
  andere (jeder Punkt hat `emoji`, `title`, `text` -- genau wie bei den Türen
  kannst du Punkte hinzufügen/entfernen, indem du Blöcke kopierst/löschst).
- **`whatTitle` / `whatText`** -- die Überschrift direkt über den Produktkarten:
  WAS ihr konkret anbietet (das sind die Türen weiter unten in `DOORS`).

### Texte für den "Verfügbarkeit prüfen"-Button & das Popup

Ebenfalls in `SITE_CONFIG`: `reserveButtonText` (der Button neben Bild & Text,
Standard "Verfügbarkeit prüfen"), `reserveFormTitle`/`reserveFormText`
(Überschrift/Text im Popup, das sich nach dem Klick öffnet), `reserveSubmitText`
(Absenden-Button im Popup), `reserveCancelText` (Abbrechen-Button im Popup),
`reserveThanksTitle`/`reserveThanksText` (Dankes-Nachricht danach).

### Farben

`brandColor`, `brandColorDark`, `accentColor` in `SITE_CONFIG` (Hex-Codes) --
wirken sich sofort auf die ganze Seite aus, inklusive Produktseiten.

---

## 3. Rechtliches ausfüllen (vor dem Live-Schalten!)

Trage im `SITE_CONFIG`-Block deine **echten** Angaben ein: `companyName`,
`companyStreet`, `companyCity`, `companyEmail`, `companyPhone`,
`responsiblePerson` (optional `companyVatId`) sowie `hostingProvider`,
`retentionEvents`, `retentionEmails` und `legalUpdated`. Sie erscheinen
automatisch in `impressum.html` und `datenschutz.html`.

**Sicherheitsnetz:** Solange Pflichtangaben fehlen, die Tracking-URL leer oder keine echte Web-App-URL ist,
`hostingProvider` nicht zur Adresse passt (z. B. "Cloudflare" auf `*.github.io`), Umlaute wegen falscher
Dateicodierung kaputt sind oder noch Platzhalter (`[ERSETZEN: …]`, `[eckige Klammern]`, "Vorname Nachname",
"Musterstr.", "example.", "123 456") stehen, zeigt jede Seite oben einen **roten Balken
"NICHT LIVE SCHALTEN"** mit der Liste der offenen Felder. Erst wenn er verschwunden ist, ist die Seite
live-tauglich. Hat `js/config.js` einen Tippfehler (fehlendes Komma, Word-Anführungszeichen „ “), meldet
der Balken das ebenfalls -- die Zeilennummer steht dann in der Browser-Konsole (F12).
**Speichere `js/config.js` immer als UTF-8** (sonst werden Umlaute zu "�").
**Impressum und Datenschutzerklärung brauchen JavaScript** (sie werden aus `js/config.js` befüllt). Ohne
JavaScript erscheint nur ein Hinweis; wer Abmahn-Crawlern ohne JavaScript begegnen will, trägt Name,
Anschrift und E-Mail zusätzlich fest in einen `<noscript>`-Block in `impressum.html` ein.

### Was diese Vorlage schon für dich erledigt

- **Impressum nach § 5 DDG** (das TMG gibt es seit Mai 2024 nicht mehr): Name,
  ladungsfähige Anschrift (kein Postfach), E-Mail **und** ein zweiter schneller
  Kontaktweg (Telefonnummer), optional USt-ID.
- **Einwilligungs-Banner** (§ 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO): "Zustimmen" und
  "Ablehnen" sind gleich gestaltet; vor der Entscheidung wird nichts gespeichert und
  nichts an Google gesendet. Widerruf jederzeit über "Einwilligung ändern" im
  Seitenende -- das löscht auch Besucher-ID und lokale Daten.
- **E-Mail-Adresse mit eigener Einwilligung** (Checkbox mit Verantwortlichem, Zweck,
  Widerrufsrecht). Sie wird auch gespeichert, wenn jemand das Tracking ablehnt --
  dann aber ohne Besucher-ID, Browser und Referrer.
- **Datenschutzerklärung** mit allen Pflichtinhalten (Verantwortlicher, Zwecke,
  Rechtsgrundlagen, Hosting, Google als Empfänger/USA, Auswertungsseite, Speicherdauer,
  Betroffenenrechte, Beschwerderecht). Zwei Punkte kannst NUR DU wahrheitsgemäß beantworten und trägst
  sie in `transferNote` (js/config.js) ein: Auftragsverarbeitung mit Google und Rechtsgrundlage der
  USA-Übermittlung (siehe unten "AVV").
- **Transparenz gegenüber Besucher:innen** (Irreführungsverbot, § 5 UWG): Hinweis
  "Testphase -- Produkte nicht bestellbar" oben auf Start- und Produktseiten, Preise
  tragen das Label "Geplanter Preis (unverbindlich)". **Diese Hinweise nicht entfernen.**
- Schutz des Google-Backends: Whitelist der Ereignisse, Formel-Einschleusung entfernt, ungültige Daten
  abgewiesen, Doppel-Sendungen erkannt (Event-ID), Mengenbegrenzung und Zeilendeckel.
  **Grenze:** Die Backend-URL steht zwangsläufig im öffentlichen Code. Wer sie kennt, kann
  Fake-Ereignisse schicken -- das Backend begrenzt den Schaden, verhindert ihn aber nicht. Die Zahlen sind
  ein Stimmungsbild, kein Beweis.

### Was DU selbst beachten musst (kann die Vorlage nicht prüfen)

1. **Texte müssen wahr sein.** Keine Behauptungen, die nicht stimmen (z. B.
   falsche Herkunftsangaben wie "aus heimischen Kaffeeplantagen"), keine nicht
   belegbaren Superlative ("der beste …"), keine erfundenen Bewertungen, Zahlen oder
   Verknappung ("nur noch 3 Stück"). Pläne als Pläne formulieren ("Geplant: …").
2. **Bilder:** Nur Fotos verwenden, an denen du die Rechte hast. Keine fremden
   Marken/Logos im Bild (auch nicht zufällig im Hintergrund), keine Hochschul-/Firmenlogos,
   die eine Zugehörigkeit vortäuschen. Abgebildete Personen müssen der Veröffentlichung
   zustimmen. **Handy-Fotos enthalten GPS-Daten** -- vorher verkleinern und Metadaten
   entfernen (z. B. [squoosh.app](https://squoosh.app)).
3. **Werbung** (Instagram, LinkedIn …) als Werbung kennzeichnen und nicht
   behaupten, das Produkt sei erhältlich.
4. **E-Mails:** Die Adressen dürfen nur für die **eine** Benachrichtigung genutzt
   werden (so steht es im Einwilligungstext). Die Einwilligung ist im Sheet dokumentiert
   (Zeitstempel + Textversion, Spalte "Einwilligung"). Ein Double-Opt-in (Bestätigungsmail) ist
   rechtlich nicht ausdrücklich vorgeschrieben, aber der sicherste Nachweis, denn **jeder kann
   eine fremde Adresse eintragen** -- in dieser Vorlage **nicht** eingebaut (siehe Abschnitt 11,
   optional). Vor dem Versand: Absender nennen, auf Widerruf hinweisen.
   **Einwilligungstext archivieren:** Der Wortlaut steht in `produkt.html` (Version `email-v2`).
   Speichere ihn mit Datum (Abschnitt 12). **Änderst du den Text, erhöhe die Versionsnummer**
   (`consent: "email-v2"` in `js/product.js` und den Text in `produkt.html`), sonst ist der Nachweis wertlos.
5. **Löschfristen:** Die Texte `retentionEvents`/`retentionEmails` nennen feste Zeiträume ab Erhebung
   (Vorgabe: 6 bzw. 12 Monate). Das Backend löscht nach Ablauf per `purgeOld()`, **wenn du den Trigger
   einrichtest** (Abschnitt 4, Schritt 14) -- ohne Trigger löscht nichts. Ändere Texte und die Werte
   `RETENTION_EVENT_DAYS`/`RETENTION_EMAIL_DAYS` in `backend/AppsScript.gs` immer gemeinsam. Das Google
   Sheet **nicht freigeben** -- nur du solltest Zugriff haben. **Lege vor dem Ende eine Sicherung an**
   (Datei → Herunterladen → CSV): Das Sheet im Google-Konto ist die einzige Kopie deiner Daten.
6. **Wer ist Verantwortlicher?** Läuft die Seite für eine Hochschule, Firma oder ein
   Projekt, gehören deren Daten ins Impressum und der Datenschutzbeauftragte sollte die
   Nutzung von Google Sheets freigeben. Mehrere Gründer als Gesellschaft bürgerlichen
   Rechts: Alle Gesellschafter gehören ins Impressum. Ein Verzeichnis der Verarbeitungstätigkeiten
   (Art. 30 DSGVO) ist nicht Teil der Vorlage.
   **AVV (Auftragsverarbeitung mit Google):** Google nimmt dein Sheet als Dienstleister für dich auf
   -- dafür braucht es nach Art. 28 DSGVO einen Vertrag. Das *Google Cloud/Workspace Data Processing
   Addendum* gilt nach unserem Kenntnisstand für Kunden mit Workspace-/Cloud-/Education-Vertrag
   (ein Admin muss es akzeptieren). Für ein **privates Gmail-Konto ist kein AVV ersichtlich**
   (UNSICHER, nicht abschließend belegt). Trage in `transferNote` deshalb nur ein, was zutrifft --
   ohne Vertrag ehrlich z. B. "Es besteht kein gesonderter Auftragsverarbeitungsvertrag mit Google" --
   und lass dich im Zweifel beraten. Beste Praxis: Workspace-/Hochschulkonto mit akzeptiertem DPA.
   Zertifizierungen für das EU-US Data Privacy Framework prüfst du auf dataprivacyframework.gov.
7. Eine Anschrift im Impressum ist öffentlich. Wer seine Privatadresse nicht zeigen
   will, braucht eine ladungsfähige Geschäfts-/Institutsanschrift.

### Ohne gegründetes Unternehmen testen (als Privatperson)

Du brauchst für diesen Test **keine Firma**: Es wird nichts verkauft, bezahlt oder
geliefert. Trotzdem gilt:

- **Impressum bleibt Pflicht**, weil die Seite Produkte mit Preisen bewirbt (also
  nicht rein privat ist). Trage dich als **natürliche Person** ein: Vor- und Nachname,
  ladungsfähige Anschrift, E-Mail, Telefon. Schreibe **keine** Rechtsform (GmbH, UG, "i.G.")
  und keinen Firmennamen, solange es sie nicht gibt. Der Produkt-/Projektname
  (`siteTitle`) darf ein Projektname sein.
- **UWG, DSGVO und TDDDG gelten auch für Privatpersonen**, sobald du geschäftlich
  testest (Werbung, Daten von Besucher:innen). Test-Hinweis, Banner und Einwilligung
  bleiben deshalb drin.
- **Kein Verkauf = keine Gewerbeanmeldung, kein Widerrufsrecht, keine AGB, kein
  Grundpreis** -- das ändert sich erst, sobald du wirklich Bestellungen annimmst.
  Dann Gewerbe-/Steuerfragen vorher klären (Gewerbeamt/Finanzamt).
- **Altersgrenze:** Der Einwilligungstext verlangt "mindestens 16 Jahre". Richte dich nicht an Kinder.
- **Keine Firma vortäuschen:** keine "Wir als Unternehmen"-Formulierungen, keine
  erfundenen Referenzen, Mitarbeiterzahlen oder Gütesiegel. "Team" nur mit echten
  Personen.
- **Anschrift nicht öffentlich zeigen wollen?** Kostenlos geht das nur mit einer
  anderen echten, ladungsfähigen Adresse (z. B. Institut/Projektträger, wenn die
  zustimmen). Postfach oder Packstation reichen nicht. Bezahlte
  Impressum-Adressdienste verursachen Kosten -- nicht Teil dieses Setups.

> ⚠️ **Ohne Gewähr, Stand 10/2026, keine Rechtsberatung.** Bei Werbung oder gewerblichem
> Einsatz im Zweifel kurz anwaltlich prüfen lassen.

---

## 4. Tracking einrichten (kostenlos, ca. 10 Minuten)

**Ohne diesen Schritt funktioniert die Seite nicht für echte Tests:** Klicks werden nur lokal im
Browser der jeweiligen Person gespeichert, und das Vormerk-Formular zeigt statt "Danke" eine
Fehlermeldung (damit nie jemand "Danke" sieht, dessen E-Mail nirgends ankommt).

1. Gehe zu [sheets.new](https://sheets.new) und lege ein neues, leeres Google
   Sheet an (am besten mit einem Konto, das für das Projekt gedacht ist -- siehe AVV in Abschnitt 3).
2. **Im Sheet:** Menü **Erweiterungen → Apps Script**. (Nur so ist das Skript mit dem Sheet verbunden.
   Ein Skript, das du direkt auf script.google.com anlegst, kennt dein Sheet nicht und schreibt nichts.)
3. Lösche den vorhandenen Beispielcode im Editor komplett.
4. Öffne die Datei `backend/AppsScript.gs` aus diesem Projekt, kopiere den
   **gesamten Inhalt** und füge ihn in den Apps-Script-Editor ein.
5. Speichern (Diskettensymbol oder Strg/Cmd+S).
6. Oben rechts auf **Bereitstellen → Neue Bereitstellung** klicken.
7. Bei "Typ auswählen" das Zahnrad anklicken → **Web-App**.
8. Einstellungen:
   - Ausführen als: **Ich (deine E-Mail)**
   - Wer hat Zugriff: **Jeder** (englisch "Anyone"; nicht "Nur ich", nicht "Jeder mit Google-Konto")
9. **Bereitstellen** klicken. Google fragt nach Berechtigungen – bestätigen
   (bei einer Warnung "Nicht verifizierte App" auf "Erweitert" → "(zu deinem
   Projektnamen) wechseln (unsicher)" klicken – das ist normal bei eigenen,
   privaten Skripten). Das Skript darf nur *dieses* Sheet lesen und ändern.
10. Die angezeigte **Web-App-URL** kopieren (endet auf `/exec`).
11. In `js/config.js` bei `trackingWebAppUrl: ""` die URL zwischen die
    Anführungszeichen einfügen.
12. **Selbsttest (Pflicht):** Öffne `<deine-URL>?action=stats` im Browser. Du musst reinen Text wie
    `{"ok":true,…,"version":"2026-10",…}` sehen -- keine Google-Fehlerseite. Dann auf der **Live-Seite**
    ein Produkt öffnen, im Popup eine Test-E-Mail (deine eigene) eintragen: Es muss "Danke" erscheinen
    **und** eine Zeile im Tabellenblatt **"Events"** auftauchen (ohne Zeile: Fehlerbehebung, Abschnitt 9).
    Tipp: Öffne die Seite einmal mit `?ignore` hinten dran (z. B. `index.html?ignore`) -- dann werden
    deine eigenen Besuche in diesem Browser nicht mitgezählt (`?ignore=0` hebt das auf).
13. **Test-Daten löschen:** Lösche im Sheet **vor dem Livegang alle Zeilen unter der Kopfzeile**
    (Zeile 1 bleibt). Teste nie über einen Doppelklick auf die Datei (`file://`), sondern über die echte Adresse.
14. **Löschfristen automatisieren (empfohlen):** Im Apps-Script-Editor links die Uhr ("Trigger") →
    **Trigger hinzufügen** → Funktion `purgeOld`, Ereignisquelle "Zeitgesteuert", "Tagestimer". Das löscht
    Zeilen nach 180 Tagen (Messdaten) bzw. 365 Tagen (E-Mails); anpassen in `backend/AppsScript.gs`
    (`RETENTION_*`), passend zu den Texten in `js/config.js`.
15. **Auswertung absichern (optional):** Zahnrad "Projekteinstellungen" → "Skripteigenschaften" →
    Eigenschaft `STATS_KEY` mit einem langen Zufallswert anlegen. Danach öffnest du die Auswertung als
    `auswertung.html?key=DEIN_WERT`. Ohne `STATS_KEY` kann jeder, der die Backend-URL kennt, die
    Zahlen (keine E-Mails) abrufen.

Öffne danach `auswertung.html` auf deiner Website – dort siehst du automatisch
eine Live-Auswertung (Funnel, Klicks je Produkt, Tabelle) direkt aus dem Sheet.
**Die Auswertung ruft Google nur ab, wenn du auf der Startseite der Nutzungsmessung zugestimmt hast**
(dabei geht deine IP-Adresse an Google); sonst zeigt sie nur lokale Testdaten.

**Ändere später den Code in `backend/AppsScript.gs`?** Dann musst du in Apps
Script über **Bereitstellen → Bereitstellungen verwalten → Bearbeiten (Stift-Symbol) →
Version: "Neue Version" → Bereitstellen** veröffentlichen, damit die Änderung live geht.
**NICHT "Neue Bereitstellung"** wählen: Die erzeugt eine *neue* URL, und alle bereits ausgelieferten
Seiten schicken ihre Daten still an die alte. Die Auswertung zeigt die Backend-Version an und warnt,
wenn sie nicht zu dieser Vorlage passt.

**Alte URL aus der Git-Historie?** Hast du (oder ein Vorgänger) die Web-App-URL je in ein Repository
committet, bleibt sie in der Historie lesbar, auch wenn du sie später entfernst. Dann: neue
Bereitstellung anlegen (neue URL in `config.js`), die alte unter "Bereitstellungen verwalten" archivieren
und Weitergaben als **ZIP-Download ohne `.git`** machen.

**Grenzen (ehrlich):** Das Backend nimmt nur bekannte Ereignisse an, begrenzt Mengen und erkennt
Doppel-Sendungen; ein Angreifer mit der URL kann trotzdem Fake-Ereignisse schicken. Und: Die Antwort
von Google ist für die Seite nicht lesbar (Browser-Regel "no-cors"). "Danke" erscheint, wenn der Versand
technisch gelingt (kein Netzfehler/Zeitlimit, bis zu 3 Versuche) -- ein Fehler *innerhalb* von Google
(z. B. Tageskontingent) bliebe unsichtbar. Darum der Selbsttest oben und ein gelegentlicher Blick ins Sheet.

---

## 5. Google Analytics -- bewusst entfernt

Der Google-Sheet-Tracker aus Schritt 4 reicht für den Fake-Door-Test völlig aus.
Google Analytics wurde aus der Vorlage entfernt: Es bräuchte zusätzliche
Einwilligung, Drittlandübermittlung und eine eigene Datenschutz-Erklärung --
ohne Mehrwert für diesen Test.

---

## 6. Kostenlos hosten / veröffentlichen -- ohne Kostenrisiko

**Wichtig vorab:** Lade nur die Website-Dateien hoch (`index.html`, weitere `*.html`, `_headers`,
Ordner `css`, `js`, `bilder`, `backend` ist optional). **Nicht** hochladen: den Ordner `.git`
und Original-Fotos -- alles Hochgeladene ist öffentlich abrufbar. **Weitergabe/Download am besten als
ZIP** (bei GitHub: Code → Download ZIP): Das ist frei von Git-Historie. Ein Ordner `.git` ist auf
Windows/Mac versteckt, aber vorhanden, wenn du das Projekt geklont hast. Trage danach in `js/config.js`
bei `hostingProvider` deinen Anbieter ein (die Seite warnt bei offensichtlichen Widersprüchen).
Nach einer Änderung an `config.js` auf einer schon geöffneten Seite: **Strg+Shift+R** (Cache umgehen).

### Standardempfehlung: Cloudflare Pages
Kostenloser Plan, statische Aufrufe nach unserer Recherche ohne Traffic-Limit (Cloudflare-Angaben selbst prüfen), keine Überziehungskosten
([dash.cloudflare.com](https://dash.cloudflare.com) → "Workers & Pages" → Seite erstellen → Dateien
hochladen / "Direct Upload"; die Menünamen ändern sich gelegentlich -- UNSICHER, ob 10/2026 exakt so).
Die Datei `_headers` wird dort automatisch angewendet (Sicherheits-Header, siehe unten).

### Alternative: Netlify (nur für kleine Tests)
1. Kostenlosen Account auf [app.netlify.com](https://app.netlify.com) anlegen
   (**Free-Plan**; keinen kostenpflichtigen Plan und keine Zusatzdienste wählen,
   keine eigene Domain kaufen -- die `*.netlify.app`-Adresse ist gratis).
2. "Add new project" → "Deploy manually" → Ordner mit den Website-Dateien hineinziehen.
   Zum Aktualisieren **dieselbe Seite** öffnen → "Deploys" → neuen Ordner hineinziehen (nicht erneut
   über Drop, das erzeugt eine *neue* Adresse).
3. **Kostenschutz:** Der Free-Plan arbeitet mit einem Credit-Kontingent pro Monat (laut Netlify-Doku
   ca. 300 Credits; Traffic und jeder Deploy kosten Credits -- Zahlen vor dem Start in der aktuellen
   Netlify-Doku prüfen). Ist es aufgebraucht, **pausiert die Seite mitten in deiner Werbekampagne**.
   Deshalb Bilder klein halten (≤ 300 KB) und nicht dutzende Male neu hochladen. Für eine bezahlte
   Kampagne Cloudflare Pages nehmen.

### Alternative: GitHub Pages
Im **kostenlosen** GitHub-Plan nur mit **öffentlichen** Repositories (nach GitHub-Doku; private
Repositories brauchen einen bezahlten Plan). Ein öffentliches Repository macht auch
`js/config.js` (inkl. deiner Impressums-Daten und Tracking-URL) und die Git-Historie
öffentlich -- keine privaten Daten oder Original-Fotos committen. GitHub schließt Pages als
Gratis-Hosting für Online-Geschäft aus; ob ein Fake-Door-Test darunter fällt, ist UNSICHER -- für Werbung
lieber Cloudflare Pages.
Ablauf: Repository erstellen → Dateien hochladen → Settings → **Pages** → Branch `main`.
Seite danach: `https://<name>.github.io/<repo>/`.
**GitHub Pages kann keine eigenen Header setzen:** `_headers` wirkt dort nicht. Es bleibt der
Schutz durch die CSP-Zeile in den HTML-Dateien -- ohne Schutz gegen Einbettung in fremde Seiten.

Es handelt sich um eine **statische Seite** (kein Server, keine Datenbank): Bei keiner
dieser Optionen fallen Kosten an, solange du den Free-Plan nicht verlässt.

---

## 7. Ergebnisse auswerten

Zwei Wege, dieselben Daten zu sehen:

1. **`auswertung.html`** auf deiner Live-Seite (direkt aufrufen, nirgends verlinkt) – automatisches Dashboard mit:
   - einem **Produktvergleich**: eine Karte pro Produkt (inkl. Preis aus
     `js/config.js`), sortiert vom besten zum schwächsten, mit
     Mini-Funnel (zeigt genau, an welcher Stufe die meisten abspringen) und
     einer einfachen Einstufung "über-/unterdurchschnittlich" im Vergleich
     zu den anderen Produkten -- Produkte ganz ohne Aufrufe werden explizit
     als "noch keine Daten" angezeigt, statt zu fehlen,
   - einem **Gesamt-Funnel** (Ansicht → Klick → Produktseite → Popup geöffnet → E-Mail) über alle Produkte hinweg,
   - **Verweildauer je Seite**: Startseite, Team, Impressum und Datenschutz jeweils einzeln
     (die Verweildauer je Produktseite steht schon in den Karten im Produktvergleich),
   - einer **Detailtabelle** mit allen Rohzahlen inkl. Preis und Popup-Abbrüchen zum Nachlesen/Exportieren.
2. **Das Google Sheet selbst** – jede einzelne Zeile mit Zeitstempel,
   Ereignistyp, Produkt, Besucher-ID und ggf. E-Mail-Adresse. Gut für eigene
   Pivot-Tabellen/Diagramme.

Die Preis-Angabe kommt direkt aus `js/config.js` (kein Tracking-Backend-Update
nötig) -- so lässt sich auf einen Blick erkennen, ob z. B. das teuerste Produkt
auch das mit dem geringsten Interesse ist.

### Diese Ereignisse werden getrackt -- pro Produkt getrennt

| Ereignis | Bedeutung | Wo |
|---|---|---|
| `door_impression` | Produktkarte auf der Startseite wurde sichtbar | Startseite |
| `door_click` | Klick auf "Zum Produkt" | Startseite |
| `page_view` | Seitenaufruf -- auf `produkt.html` automatisch mit der jeweiligen Produkt-ID versehen | jede Seite |
| `reserve_click` | Klick auf "Verfügbarkeit prüfen" -- öffnet das Popup | Produktseite |
| `email_modal_abandon` | Popup wieder geschlossen, OHNE eine E-Mail einzutragen (mit Sekunden bis zum Abbruch als `value` und `reason`: `close_button`/`backdrop`/`escape_key`/`page_unload`) | Produktseite |
| `email_submit` | E-Mail-Adresse im Popup wurde hinterlassen (mit Sekunden bis zum Abschluss als `value`). Wird auch ohne Tracking-Zustimmung gespeichert -- und zwar **immer ohne** Besucher-ID/Browser/Referrer | Produktseite |
| `page_duration` | Sichtbare Verweildauer in Sekunden, **einmal pro Seitenaufruf** (beim ersten Verlassen/Verstecken der Seite) -- auf `produkt.html` automatisch dem Produkt zugeordnet | jede Seite |

**Zählweise:** Das Dashboard zählt **verschiedene Besucher** (Besucher-ID), nicht rohe Klicks: Wer
dieselbe Tür 10-mal anklickt, zählt einmal. E-Mails werden pro Adresse gezählt. Seitennamen stehen
ohne `.html` im Sheet (`index`, `team`, `produkt`). Nur Besucher, die der Messung zugestimmt haben, werden
gezählt -- die Raten gelten für diese Gruppe. Messdaten werden gebündelt beim Verlassen der Seite gesendet.

`reserve_click` und `email_submit` zusammen zeigen, wie viele das Popup öffnen
und wie viele davon tatsächlich abschließen -- `email_modal_abandon` macht die
Differenz explizit sichtbar (statt sie nur indirekt zu erschließen) und verrät
zusätzlich, wie lange jemand im Popup war, bevor er abgesprungen ist.

Weil `page_view` und `page_duration` auf der Produktseite automatisch die
jeweilige Produkt-ID mitbekommen (siehe `FDT.setContext(...)` in
`js/product.js`), lassen sich sowohl **Klicks als auch Verweildauer** je
Produkt getrennt auswerten -- nicht nur, wie oft eine Tür angeklickt wurde,
sondern auch, wie lange Interessierte tatsächlich auf der jeweiligen
Produktseite bleiben. Das gibt ein deutlich klareres Bild, welches Produkt am
meisten zieht, als Klicks allein.

Die wichtigste Einzelkennzahl bleibt meist die **Klick→E-Mail-Rate**: Wie
viele der Leute, die eine Tür überhaupt angeklickt haben, waren am Ende bereit,
ihre E-Mail-Adresse zu hinterlassen? Kombiniert mit der Verweildauer bekommst
du zwei unabhängige Signale für Kaufinteresse.

---

## 7b. Ist der Vergleich trotz Hinweis aussagekräftig?

Ja, **für den Vergleich der Produkte untereinander**: Der Test-Hinweis steht bei
allen Produkten gleich, drückt also alle Raten ähnlich und lässt die Rangfolge
bestehen (die absolute Rate ist niedriger als bei einem echten Shop -- vergleiche
sie nicht mit Branchenwerten). Damit der Vergleich fair bleibt:

- Die **Reihenfolge der Produkte auf der Startseite wird zufällig gemischt**; die
  Position steht als "Wert" bei `door_impression`/`door_click` im Sheet.
- Entscheidend ist **Klick→E-Mail-Rate** je Produkt, nicht nur Klicks.
- **Preis und Produkt sind vermischt:** Unterschiedliche Preise (9,99/19,99/49 €) und
  Produkte ändern sich gleichzeitig. Willst du wissen, ob der *Preis* oder das
  *Produkt* zieht, teste dasselbe Produkt in zwei Preisen.
- **Mindestmenge:** Mit nur wenigen Dutzend Besucher:innen pro Produkt sind kleine
  Unterschiede Zufall. Erst bei deutlichen Abständen (z. B. doppelte Rate) und
  jeweils ~100+ Produktseiten-Besuchen eine Entscheidung ableiten.
- **Gleiche Werbung für alle Produkte** (gleiches Budget, gleiche Zielgruppe), sonst
  misst du die Anzeige statt das Produkt.

---

## 8. Checkliste vor dem Live-Schalten

**Rechtlich (alles muss erledigt sein):**
- [ ] Roter Balken "NICHT LIVE SCHALTEN" ist verschwunden (Impressum-Angaben inkl.
      Telefonnummer und Team-Texte sind echt)
- [ ] `hostingProvider`, `retentionEvents`, `retentionEmails`, `legalUpdated`, `transferNote` stimmen
      (`transferNote`: AVV und USA-Übermittlung wahrheitsgemäß, siehe Abschnitt 3)
- [ ] Impressum und Datenschutz einmal im Browser angesehen (sie brauchen JavaScript)
- [ ] Einwilligungstext archiviert (Abschnitt 12)
- [ ] Alle Texte/Preise sind wahr bzw. als "Geplant" formuliert, Test-Hinweis ist sichtbar
- [ ] Bilder: Rechte geklärt, keine fremden Marken/Logos, Personen einverstanden,
      keine GPS-/EXIF-Daten, jeweils < 300 KB
- [ ] Banner einmal durchgeklickt: "Ablehnen" → keine Anfrage an `script.google.com`
      (Entwicklertools F12 → Netzwerk); "Zustimmen" → Events kommen im Sheet an
- [ ] E-Mail-Test mit Haken: "Danke" erscheint **und** die Zeile steht im Sheet mit Spalte "Einwilligung" = `email-v2`
- [ ] **Test-Zeilen im Sheet gelöscht** (alles unter der Kopfzeile)
- [ ] Google Sheet ist **nicht** freigegeben (nur du)
- [ ] Datenschutzbeauftragte:r / Verantwortliche Stelle (Hochschule, Firma) ist informiert

**Technisch / Kosten:**
- [ ] `trackingWebAppUrl` gesetzt; `<URL>?action=stats` zeigt `"ok":true`; Apps-Script nach jeder Code-Änderung als **Neue Version** bereitgestellt (nicht "Neue Bereitstellung")
- [ ] Trigger für `purgeOld` eingerichtet; optional `STATS_KEY` gesetzt
- [ ] Free-Plan beim Hoster, keine Zahlungsmittel/Zusatzdienste/Domain gebucht
- [ ] Nur Website-Dateien hochgeladen (kein `.git`, keine Original-Fotos); Bilder je ≤ 300 KB, ohne EXIF/GPS
- [ ] Alte Backend-URL nie in einem Repository veröffentlicht (sonst rotieren, Abschnitt 4)
- [ ] Seite auf dem Smartphone getestet

---

## 9. Fehlerbehebung

### "Auswertung" zeigt nur lokale Testdaten / eine Warnung in Orange

Die Seite `auswertung.html` versucht, Daten von deiner `trackingWebAppUrl` zu laden.
Klappt das nicht, zeigt sie automatisch lokale Testdaten aus deinem eigenen Browser
und erklärt oben in Orange, woran es liegt. Die häufigsten Ursachen:

**"…kennt aber die Funktion doGet nicht" / "Script-Funktion nicht gefunden"**
→ Mit Abstand der häufigste Fehler. Eine Web-App-Bereitstellung in Apps Script ist ein
**eingefrorener Schnappschuss** – nur den Code zu ändern und zu speichern (Strg/Cmd+S)
reicht NICHT, damit die Änderung live geht. So aktualisierst du sie:
1. Öffne dein Apps-Script-Projekt **über dein Google Sheet: Erweiterungen → Apps Script**.
2. Prüfe, dass der komplette Code aus `backend/AppsScript.gs` im Editor steht
   (insbesondere `function doGet(e) { ... }` muss vorhanden sein) und speichere.
3. **Bereitstellen → Bereitstellungen verwalten** (nicht "Neue Bereitstellung"!).
4. Stift-Symbol bei deiner bestehenden Web-App-Bereitstellung anklicken.
5. Bei "Version" **"Neue Version"** auswählen → **Bereitstellen**.
6. Die URL bleibt dabei gleich – du musst `js/config.js` nicht anfassen.

Zum Testen, ob es funktioniert hat, öffne einfach deine Web-App-URL direkt im
Browser mit `?action=stats` angehängt, z. B.
`https://script.google.com/macros/s/.../exec?action=stats` – dort sollte reiner
JSON-Text erscheinen (`{"ok":true, ...}`), keine Google-Fehlerseite.

**"verlangt eine Anmeldung" / Zugriff verweigert**
→ Beim Bereitstellen unter "Wer hat Zugriff" muss **"Jeder"** ("Anyone") stehen, nicht "Nur
ich" oder "Jeder mit Google-Konto". Bei Uni-/Firmenkonten kann der Admin diese Option sperren (UNSICHER,
je nach Richtlinie) -- dann ein privates Konto nur für den Test nehmen (Datenschutz beachten) oder den Admin fragen.

**"Zugriffsschlüssel fehlt oder ist falsch"**
→ Du hast `STATS_KEY` gesetzt: Öffne die Seite als `auswertung.html?key=DEIN_WERT`.

**"Backend veraltet" / keine "Backend-Version"**
→ Der Code im Apps-Script-Editor ist älter als diese Vorlage oder wurde nicht als *Neue Version* bereitgestellt.

**Vormerk-Formular zeigt "Das hat gerade nicht geklappt"**
→ `trackingWebAppUrl` leer/falsch (muss auf `/exec` enden), Werbeblocker blockiert `script.google.com`,
Offline, oder die Bereitstellung wurde gelöscht. Der rote Balken prüft das Format der URL.

**"Zeitüberschreitung"**
→ URL falsch abgetippt/kopiert (muss auf `/exec` enden, nicht `/dev`), oder das
Google Sheet bzw. das Skript wurde gelöscht.

*Technischer Hintergrund:* `auswertung.html` fragt die Daten nicht per normalem
`fetch()` ab, sondern per JSONP (Skript-Tag), weil Google Apps Script bei
`doGet`-Antworten keinen CORS-Header setzt – ein normaler `fetch()` von einer
anderen Domain aus würde vom Browser sonst blockiert, selbst wenn dein Skript
fehlerfrei läuft.

### Klicks kommen generell nicht im Google Sheet an

- Öffne die Website, öffne die Entwicklertools des Browsers (F12) → Reiter
  "Konsole", klicke eine Tür an. Erscheint dort ein roter Fehler? Dann meist:
  Zugriff nicht auf "Jeder" gestellt (siehe oben), oder Berechtigungen beim
  Bereitstellen nicht bestätigt.
- Hast du den Consent-Banner ("Zustimmen"/"Ablehnen") beim Testen tatsächlich
  mit "Zustimmen" bestätigt? Ohne das wird absichtlich nichts getrackt (nur die E-Mail aus dem Popup wird immer gespeichert).
  Und hast du `?ignore` aktiviert (dann zählen deine Besuche nicht; `?ignore=0` hebt es auf)?
  Messdaten kommen gebündelt erst, wenn du die Seite wechselst oder den Tab schließt.
- Ein Skript, das du direkt über script.google.com angelegt hast, kennt dein Sheet nicht.
  Öffne es über das Sheet (Erweiterungen → Apps Script).
- Prüfe, ob im Tabellenblatt "Events" (nicht "Tabellenblatt1") wirklich Zeilen
  ankommen – das Skript legt dieses Blatt automatisch an.

### Ich bekomme die Seite nicht online

Diese Website ist rein statisch (HTML/CSS/JS) – es gibt keinen Build-Schritt und
keinen Server, der laufen muss. Trotzdem die häufigsten Stolpersteine:

- **Netlify Drop** ([app.netlify.com/drop](https://app.netlify.com/drop)): Du musst
  den *Ordnerinhalt* hineinziehen (also `index.html` liegt direkt im gezogenen
  Ordner) – nicht den übergeordneten Projektordner mit einem weiteren Unterordner
  darin, sonst findet Netlify die `index.html` nicht.
- **GitHub Pages**: `index.html` muss im **Wurzelverzeichnis** des Repositories
  liegen (oder du wählst beim Veröffentlichen bewusst einen Unterordner). Das
  Repository muss unter Einstellungen → Pages eine Quelle (Branch, meist `main`)
  zugewiesen bekommen haben – das passiert nicht automatisch. Nach dem Aktivieren
  dauert es 1–2 Minuten, bis die Seite erreichbar ist. Bei einem **kostenlosen**
  GitHub-Konto muss das Repository dafür "public" sein.
- Falls du über die Kommandozeile/VS Code mit Git arbeitest: `git add` + `git
  commit` allein veröffentlicht noch nichts – die Dateien müssen zusätzlich mit
  `git push` zu einem Repository auf GitHub.com übertragen werden, und dort muss
  ein Remote (`git remote add origin <URL>`) hinterlegt sein.
- Achte auf Groß-/Kleinschreibung in Dateinamen/Links (`index.html`, nicht
  `Index.html`) – anders als Windows unterscheiden die meisten Hosting-Server
  (Linux-basiert) zwischen Groß- und Kleinschreibung. Windows blendet Dateiendungen oft aus
  (`bild.jpg.jpg`): im Explorer unter Ansicht "Dateinamenerweiterungen" einblenden.
- Umlaute kaputt ("M�ller")? `js/config.js` als **UTF-8** speichern.
- Seite zeigt noch den alten Stand? **Strg+Shift+R** (bzw. Cmd+Shift+R).

Wenn du an einer bestimmten Fehlermeldung hängst, kopiere sie am besten wörtlich
(Screenshot oder Text) – dann lässt sich gezielt nachvollziehen, wo genau es
hakt.

---

## 10. Warum "Verfügbarkeit prüfen" statt Fake-Checkout?

Diese Variante des Fake-Door-Tests verzichtet bewusst auf ein simuliertes
Zahlungsformular. Statt Interessierte glauben zu lassen, sie würden gleich
etwas kaufen, ist die Ansage von Anfang an ehrlich: "Dieses Produkt gibt es
noch nicht -- trag dich ein, wenn du benachrichtigt werden willst." Der Klick
auf "Verfügbarkeit prüfen" ist trotzdem ein echtes, aussagekräftiges Signal
für Kaufinteresse -- kombiniert mit der Verweildauer auf der Produktseite und
der Popup-Abbruchrate (siehe Abschnitt 7) bekommst du gleich drei unabhängige
Signale, ganz ohne Kreditkarten-Theater. Dass das Formular als Popup statt
direkt auf der Seite erscheint, hat einen praktischen Grund: Wer es wieder
schließt, ohne etwas einzutragen, bleibt auf derselben Produktseite -- dieser
Abbruch lässt sich dadurch sauber als eigenes Ereignis erfassen, statt in der
allgemeinen Verweildauer unterzugehen.

---

## 11. Optional: Double-Opt-in (nicht eingebaut)

Weil jeder eine fremde Adresse eintragen kann, ist eine Bestätigungsmail der sicherste Nachweis
(und schützt vor Beschwerden Dritter). Sie ist hier **bewusst nicht Standard**, denn sie ändert den
Einwilligungstext, verbraucht Mail-Kontingent (Apps Script: ca. 100 Mails/Tag mit privatem Konto) und
braucht eine weitere Berechtigung ("E-Mails senden"). Wer sie will, ergänzt in `backend/AppsScript.gs`
nach dem Schreiben einer `email_submit`-Zeile ein `MailApp.sendEmail(...)` mit einem Bestätigungslink
(der dieselbe Web-App mit `?action=confirm&id=<Event-ID>` aufruft und die Zeile als bestätigt markiert),
passt den Text in `produkt.html` an (neue Version `email-v3`) und schreibt später nur bestätigte Adressen an.
Lass das im Zweifel von jemandem umsetzen, der Apps Script kennt.

## 12. Einwilligungstext archivieren (Nachweis)

Speichere diese Texte mit Datum (z. B. in einer Datei neben dem Sheet). In der Spalte "Einwilligung"
des Sheets steht, welche Version die Person bestätigt hat:

- **email-v1** (alte Fassung, nur vor Oktober 2026): "Ich willige ein, dass [Name] meine E-Mail-Adresse speichert und mich einmalig per E-Mail über den Start dieses Produkts informiert. Die Einwilligung ist freiwillig und kann jederzeit mit Wirkung für die Zukunft per E-Mail an [E-Mail] widerrufen werden. Mehr dazu in der Datenschutzerklärung."
- **email-v2** (aktuell, in `produkt.html`): "Ich bin mindestens 16 Jahre alt und willige ein, dass [Name] meine E-Mail-Adresse in einem Google Sheet speichert (Google, USA – dabei wird technisch bedingt auch meine IP-Adresse verarbeitet) und mich einmalig per E-Mail über die Umsetzung dieses Produkts informiert. Die Einwilligung ist freiwillig und kann jederzeit mit Wirkung für die Zukunft per E-Mail an [E-Mail] widerrufen werden. Mehr dazu in der Datenschutzerklärung."

Ändere den Text nie, ohne die Version zu erhöhen (`consent: "email-v…"` in `js/product.js`; das Backend
akzeptiert `email-v1`, `email-v2` … und lehnt E-Mails ohne Versionsangabe ab).

## 13. Weitergabe der Vorlage / Lizenz

Wenn du die Vorlage weitergibst, lege eine Lizenz fest -- Vorschlag: **MIT-Lizenz** (nicht Teil dieses
Ordners; als Datei `LICENSE` ergänzen, wenn du das möchtest). Weitergabe immer als ZIP ohne `.git` und
ohne eigene Bilder/Backend-URL.
