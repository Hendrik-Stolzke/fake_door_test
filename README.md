# Fake-Door-Test – Baukasten

Eine fertige, kostenlose Website, um mehrere Produktideen gleichzeitig zu testen:
Besucher:innen sehen "Türen" (Produktkarten), klicken auf eine, durchlaufen einen
täuschend echten (aber nicht funktionalen) Bestellprozess und werden am Ende
gebeten, ihre E-Mail-Adresse für eine Launch-Benachrichtigung zu hinterlassen.
Jeder Klick, jeder Kaufversuch und jede Verweildauer wird automatisch getrackt.

Keine Programmierkenntnisse nötig, um Inhalte zu ändern – nur eine Datei
(`js/config.js`) bearbeiten. Alles ist kostenlos betreibbar.

---

## 1. Was ist enthalten?

```
index.html          Startseite mit den Produkt-„Türen“
team.html            Team-Seite
impressum.html       Impressum (Pflichtangaben)
datenschutz.html     Datenschutzerklärung
auswertung.html      Live-Dashboard mit den Tracking-Ergebnissen
css/style.css        Design (Farben, Layout)
js/config.js         ★ DIE DATEI, DIE DU BEARBEITEST ★ – Türen, Team, Texte, Tracking-Links
js/tracking.js        Tracking-Logik (Consent, Events, Verweildauer)
js/app.js             Rendert Türen/Team, steuert den Checkout-Dialog
js/stats.js           Rendert das Dashboard auf auswertung.html
backend/AppsScript.gs  Code für dein kostenloses Google-Sheet-Backend
```

Du kannst diesen kompletten Ordner unverändert auf einen Gratis-Webhosting-Dienst
hochladen (siehe Abschnitt 5) – es ist reines HTML/CSS/JavaScript, kein Server,
keine Installation, keine Kosten.

---

## 2. Türen (Produkte) anpassen – für Nicht-Programmierer:innen

Öffne `js/config.js` mit einem einfachen Texteditor (z. B. Editor unter Windows,
TextEdit im "Nur Text"-Modus auf dem Mac, oder besser: [VS Code](https://code.visualstudio.com/), kostenlos).

Finde den Block `const DOORS = [ ... ]`. Jedes Produkt ist ein Abschnitt zwischen
geschweiften Klammern:

```js
{
  id: "produkt-a",              // eindeutiger Name, ohne Leerzeichen/Umlaute
  title: "Produkt A",           // Name, der angezeigt wird
  description: "Kurzer Text.",  // 1 Satz Beschreibung
  price: "19,99 €",             // Preis als Text
  emoji: "🚀",                  // Icon, falls kein Bild
  image: "",                    // optional: Bild-URL, sonst leer lassen
  badge: "Beliebt",             // optional: kleines Label, sonst ""
},
```

- **Tür hinzufügen:** einen kompletten Block kopieren, einfügen, Werte ändern.
- **Tür entfernen:** den kompletten Block (inkl. `{ }` und Komma) löschen.
- **Reihenfolge ändern:** Blöcke einfach verschieben.

Die Anzahl der Türen ist beliebig – die Seite passt das Layout automatisch an.
Speichern, Seite im Browser neu laden – fertig.

Das Team auf `team.html` funktioniert genauso über das `TEAM`-Array in derselben Datei.

### Farben & Texte

Ganz oben in `js/config.js` im Block `SITE_CONFIG` kannst du außerdem ändern:
Seitentitel, Überschrift, Untertitel, Markenfarbe (`brandColor`), Texte für das
E-Mail-Formular usw. – alles mit Kommentaren erklärt.

---

## 3. Rechtliches ausfüllen (vor dem Live-Schalten!)

Trage im selben `SITE_CONFIG`-Block deine echten Angaben ein: `companyName`,
`companyStreet`, `companyCity`, `companyEmail` usw. Diese Werte erscheinen
automatisch auf `impressum.html` und `datenschutz.html`.

> ⚠️ Die mitgelieferten Impressum-/Datenschutz-Texte sind eine Vorlage, **keine
> Rechtsberatung**. Prüfe insbesondere bei gewerblicher Nutzung, ob weitere
> Angaben nötig sind (z. B. Umsatzsteuer-ID), und sprich im Zweifel mit einer
> fachkundigen Stelle bzw. dem Datenschutzbeauftragten deiner Institution.

---

## 4. Tracking einrichten (kostenlos, ca. 5 Minuten)

**Ohne diesen Schritt funktioniert die Seite trotzdem**, aber Klicks werden nur
lokal im Browser der jeweiligen Person gespeichert – du als Betreiber:in siehst
sie nicht. Für einen echten Test mit echten Besucher:innen **musst** du dieses
kostenlose Google-Sheet-Backend einrichten, sonst landen die Daten nirgendwo,
wo du sie auswerten kannst.

1. Gehe zu [sheets.new](https://sheets.new) und lege ein neues, leeres Google
   Sheet an (kostenloser Google-Account reicht).
2. Menü **Erweiterungen → Apps Script**.
3. Lösche den vorhandenen Beispielcode im Editor komplett.
4. Öffne die Datei `backend/AppsScript.gs` aus diesem Projekt, kopiere den
   **gesamten Inhalt** und füge ihn in den Apps-Script-Editor ein.
5. Speichern (Diskettensymbol oder Strg/Cmd+S).
6. Oben rechts auf **Bereitstellen → Neue Bereitstellung** klicken.
7. Bei "Typ auswählen" das Zahnrad anklicken → **Web-App**.
8. Einstellungen:
   - Ausführen als: **Ich (deine E-Mail)**
   - Zugriff: **Alle** ("Anyone")
9. **Bereitstellen** klicken. Google fragt nach Berechtigungen – bestätigen
   (bei einer Warnung "Nicht verifizierte App" auf "Erweitert" → "(zu deinem
   Projektnamen) wechseln (unsicher)" klicken – das ist normal bei eigenen,
   privaten Skripten).
10. Die angezeigte **Web-App-URL** kopieren (endet auf `/exec`).
11. In `js/config.js` bei `trackingWebAppUrl: ""` die URL zwischen die
    Anführungszeichen einfügen.
12. Seite speichern, hochladen bzw. neu laden – fertig! Jeder Klick landet jetzt
    als neue Zeile im Tabellenblatt **"Events"** deines Google Sheets.

Öffne danach `auswertung.html` auf deiner Website – dort siehst du automatisch
eine Live-Auswertung (Funnel, Klicks je Produkt, Tabelle) direkt aus dem Sheet.

**Ändere später den Code in `backend/AppsScript.gs`?** Dann musst du in Apps
Script erneut über "Bereitstellen → Bereitstellungen verwalten → Bearbeiten
(Stift-Symbol) → Neue Version" veröffentlichen, damit die Änderung live geht.

---

## 5. (Optional) Google Analytics 4 zusätzlich einrichten

Das Google-Sheet-Tracking aus Schritt 4 reicht für den Fake-Door-Test völlig
aus. Falls du zusätzlich klassische Web-Analytics willst:

1. [analytics.google.com](https://analytics.google.com) → kostenloses Konto →
   neue "Property" anlegen → Datenstrom-Typ "Web".
2. Die **Messwert-ID** kopieren (Format `G-XXXXXXXXXX`).
3. In `js/config.js` bei `gaMeasurementId: ""` einfügen.

Ohne diesen Schritt funktioniert alles andere unverändert weiter.

---

## 6. Kostenlos hosten / veröffentlichen

Jede dieser Optionen ist gratis und braucht nur den kompletten Projektordner:

### Option A – Netlify Drop (am einfachsten, kein Account nötig zum Testen)
1. Gehe zu [app.netlify.com/drop](https://app.netlify.com/drop).
2. Den kompletten Projektordner per Drag & Drop dort hineinziehen.
3. Fertig – du bekommst sofort eine Live-URL (mit kostenlosem Account bleibt sie dauerhaft bestehen und ist unter deinem gewünschten Namen erreichbar).

### Option B – GitHub Pages
1. Kostenlosen Account auf [github.com](https://github.com) anlegen.
2. Neues Repository erstellen, den Projektordner hochladen (Web-Oberfläche:
   "Add file → Upload files").
3. Repository-Einstellungen → **Pages** → als Quelle den `main`-Branch wählen.
4. Nach wenigen Minuten ist die Seite unter `https://<dein-name>.github.io/<repo-name>/` erreichbar.

### Option C – Cloudflare Pages / Vercel
Beide bieten ebenfalls kostenlose Static-Hosting-Pläne mit Drag-&-Drop-Upload
oder GitHub-Anbindung – Vorgehen ist sehr ähnlich zu Netlify/GitHub Pages.

Wichtig: Es handelt sich um eine **statische Seite** (kein Server, keine
Datenbank nötig) – jeder dieser Anbieter reicht aus, es fallen keine Kosten an.

---

## 7. Ergebnisse auswerten

Zwei Wege, dieselben Daten zu sehen:

1. **`auswertung.html`** auf deiner Live-Seite – automatisches Dashboard mit
   Funnel (Ansicht → Klick → Checkout → Kaufversuch → E-Mail), Ranking der
   Produkte nach Klicks, und einer Tabelle mit Conversion-Raten je Produkt.
2. **Das Google Sheet selbst** – jede einzelne Zeile mit Zeitstempel,
   Ereignistyp, Produkt, Sitzungs-ID und ggf. E-Mail-Adresse. Gut für eigene
   Pivot-Tabellen/Diagramme.

### Diese Ereignisse werden pro Tür getrackt
| Ereignis | Bedeutung |
|---|---|
| `door_impression` | Produktkarte wurde sichtbar (Impression) |
| `door_click` | Klick auf "Ansehen" |
| `checkout_open` | Checkout-Dialog geöffnet |
| `checkout_close` | Dialog geschlossen (mit Dauer in Sekunden) |
| `payment_attempt` | Klick auf "Jetzt kaufen" (Kaufabsicht!) |
| `paywall_shown` | "Fast geschafft"-Hinweis wurde angezeigt |
| `email_submit` | E-Mail-Adresse wurde hinterlassen |
| `page_duration` | Verweildauer auf der Seite in Sekunden |

Die wichtigste Kennzahl für einen Fake-Door-Test ist meist die
**Klick→E-Mail-Rate**: Wie viele der Leute, die eine Tür überhaupt angeklickt
haben, waren am Ende bereit, ihre E-Mail-Adresse zu hinterlassen? Das ist ein
deutlich stärkeres Signal für echtes Kaufinteresse als reine Klicks.

---

## 8. Checkliste vor dem Live-Schalten

- [ ] Türen in `js/config.js` mit echten Produktideen befüllt
- [ ] Team in `js/config.js` befüllt
- [ ] Impressum-Angaben (`companyName`, `companyStreet`, …) ausgefüllt
- [ ] `trackingWebAppUrl` gesetzt und getestet (einmal selbst durchklicken,
      prüfen ob in `auswertung.html` bzw. im Google Sheet eine Zeile ankommt)
- [ ] Consent-Banner einmal durchgeklickt und geprüft, dass danach Events ankommen
- [ ] Seite auf dem Smartphone getestet (responsive)
- [ ] Datenschutzerklärung & Impressum von einer fachkundigen Stelle
      gegengelesen, falls die Seite öffentlich beworben wird

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
1. Öffne dein Apps-Script-Projekt (über die drei Punkte am Google Sheet → Apps Script,
   oder direkt über [script.google.com](https://script.google.com)).
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
→ Beim Bereitstellen unter "Zugriff" muss **"Alle"** ("Anyone") stehen, nicht "Nur
ich" oder "Alle mit Google-Konto".

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
  Zugriff nicht auf "Alle" gestellt (siehe oben), oder Berechtigungen beim
  Bereitstellen nicht bestätigt.
- Hast du den Consent-Banner ("Akzeptieren"/"Ablehnen") beim Testen tatsächlich
  mit "Akzeptieren" bestätigt? Ohne das wird absichtlich nichts getrackt.
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
  GitHub-Konto muss das Repository dafür nicht zwingend "public" sein – Pages
  funktioniert seit 2021 auch bei privaten Repos auf Free-Plänen.
- Falls du über die Kommandozeile/VS Code mit Git arbeitest: `git add` + `git
  commit` allein veröffentlicht noch nichts – die Dateien müssen zusätzlich mit
  `git push` zu einem Repository auf GitHub.com übertragen werden, und dort muss
  ein Remote (`git remote add origin <URL>`) hinterlegt sein.
- Achte auf Groß-/Kleinschreibung in Dateinamen/Links (`index.html`, nicht
  `Index.html`) – anders als Windows unterscheiden die meisten Hosting-Server
  (Linux-basiert) zwischen Groß- und Kleinschreibung.

Wenn du an einer bestimmten Fehlermeldung hängst, kopiere sie am besten wörtlich
(Screenshot oder Text) – dann lässt sich gezielt nachvollziehen, wo genau es
hakt.

---

## 10. Warum "täuscht" das Kauf-Formular nicht wirklich?

Die Kartenfelder im Checkout-Dialog sind rein optisch – es werden keine
eingegebenen Werte ausgelesen, gespeichert oder übertragen, und es gibt keine
echte Zahlungsanbindung. Direkt nach dem Klick auf "Jetzt kaufen" steht sichtbar
"Demo-Checkout – es erfolgt keine echte Zahlung", und im nächsten Schritt wird
unmissverständlich erklärt, dass das Produkt noch nicht verfügbar ist. So misst
du echte Kaufabsicht, ohne jemanden über eine tatsächlich stattfindende
Zahlung zu täuschen.
