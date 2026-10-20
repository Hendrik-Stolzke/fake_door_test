# Bilder-Ordner

Hier legst du die Bilder für deine Produkte **und für die Fotos vom
Gründungsteam** (team.html) ab – beides funktioniert genau gleich.

## So benutzt du sie

1. Bilddatei hier in diesen Ordner kopieren, z. B. `produkt-a.jpg` oder
   `team-lena.jpg`.
2. In `js/config.js` beim passenden Produkt (im `DOORS`-Array) **oder** bei
   der passenden Person (im `TEAM`-Array) beim Feld `image` den Dateinamen
   mit vorangestelltem `bilder/` eintragen:

```js
// Bei einem Produkt (DOORS):
{
  id: "produkt-a",
  title: "Produkt A",
  ...
  image: "bilder/produkt-a.jpg",   // <- so
},

// Bei einer Person im Team (TEAM):
{
  name: "Lena Beispiel",
  role: "Gründerin",
  ...
  image: "bilder/team-lena.jpg",   // <- genauso
},
```

3. Speichern, Seite neu laden (oder neu hochladen) – fertig. Lässt du
   `image: ""` leer, wird stattdessen das `emoji` als Platzhalter gezeigt
   (bei Produkten eckig, bei Team-Fotos rund).

## Keine Bilder von anderen Websites

Bei `image` sind **nur Dateien aus diesem Ordner** erlaubt (`bilder/produkt-a.jpg`).
Web-Adressen (`https://...`) werden aus Datenschutzgründen ignoriert: Der fremde
Server würde die IP-Adresse der Besucher:innen schon *vor* ihrer Einwilligung
erhalten. Wird ein Bild nicht gefunden (Tippfehler, falsche Groß-/Kleinschreibung),
zeigt die Seite automatisch das `emoji` als Platzhalter.

## Die Vorlage enthält absichtlich KEINE Bilder

Dieser Ordner ist leer (außer dieser Anleitung). Lege nur Bilder ab, an denen du
die Rechte hast und auf denen abgebildete Personen zugestimmt haben.

## Empfehlungen für die Bilder selbst

- **Produktbilder:** Seitenverhältnis **4:3** (z. B. 800 × 600 Pixel) – so
  werden sie auf den Produktkarten und der Produktseite ohne hässlichen
  Zuschnitt angezeigt.
- **Team-Fotos:** werden **rund zugeschnitten** (wie ein klassisches
  Profilbild). Am besten ein **quadratisches** Foto (z. B. 400 × 400 Pixel)
  verwenden, mit dem Gesicht mittig im Bild – bei rechteckigen Fotos schneidet
  die Website automatisch die Seiten ab, was ungünstig aussehen kann, wenn das
  Gesicht nicht mittig ist.
- **Dateiformat:** JPG oder WebP für Fotos, PNG nur wenn Transparenz nötig ist.
- **Dateigröße höchstens 300 KB pro Bild** (Kantenlänge höchstens 1200 Pixel), damit
  die Seite schnell lädt und dein Gratis-Kontingent beim Hoster nicht aufgebraucht
  wird – z. B. mit [squoosh.app](https://squoosh.app) (kostenlos, läuft im Browser)
  verkleinern. Handy-Originale (3-4 MB) sind viel zu groß.
- **EXIF-/GPS-Daten entfernen:** Squoosh (oder ein anderes Neu-Speichern/Exportieren)
  entfernt sie. Originale **nicht** in diesem Ordner lassen.
- **Dateinamen nur in Kleinbuchstaben, ohne Leerzeichen/Umlaute** (z. B. `produkt-a.jpg`,
  nicht `Produkt A.jpg`). Server unterscheiden Groß-/Kleinschreibung: `Produkt-A.jpg`
  wird auf dem Server **nicht** gefunden, obwohl es auf deinem PC funktioniert.
- **Windows blendet Dateiendungen oft aus.** Im Explorer: Ansicht → Anzeigen →
  *Dateinamenerweiterungen*. Sonst heißt deine Datei womöglich `produkt-a.jpg.jpg`
  und wird nicht gefunden.

## Wichtig beim Hosten

Dieser komplette Ordner muss mit hochgeladen werden (er ist Teil des normalen
Projektordners) – sonst zeigen die `image`-Pfade ins Leere und es erscheint
wieder das Emoji als Platzhalter.

## Rechtliches zu Bildern (bitte vor dem Live-Schalten lesen)

- **Rechte:** Nur eigene Fotos oder Bilder mit passender Lizenz verwenden.
- **Keine fremden Marken/Logos** im Bild (z. B. Verpackungen im Hintergrund, Roll-ups einer
  Hochschule oder Firma) -- sie können eine Zugehörigkeit vortäuschen.
- **Personenfotos:** Die abgebildete Person muss der Veröffentlichung zustimmen.
- **Metadaten entfernen:** Handy-Fotos enthalten oft den Aufnahmeort (GPS). Mit
  [squoosh.app](https://squoosh.app) oder einem Python-Skript (Pillow: `Image.save(...)`
  ohne `exif`) neu speichern. Originale **nicht** in diesem Ordner liegen lassen,
  sonst werden sie mit hochgeladen.
