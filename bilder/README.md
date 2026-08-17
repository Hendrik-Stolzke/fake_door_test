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

## Alternative: Bild von einer anderen Website verlinken

Statt eine Datei hier abzulegen, kannst du bei `image` auch direkt eine
vollständige Web-Adresse eintragen, z. B. `image: "https://beispiel.de/foto.jpg"`.
Dann brauchst du diesen Ordner gar nicht.

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
- **Dateigröße möglichst klein halten** (unter ca. 300 KB pro Bild), damit die
  Seite schnell lädt – z. B. mit [squoosh.app](https://squoosh.app) (kostenlos,
  läuft im Browser) komprimieren.
- **Dateinamen ohne Leerzeichen/Umlaute** (z. B. `produkt-a.jpg`, nicht
  `Produkt A.jpg`), das vermeidet Probleme beim Hochladen.

## Wichtig beim Hosten

Dieser komplette Ordner muss mit hochgeladen werden (er ist Teil des normalen
Projektordners) – sonst zeigen die `image`-Pfade ins Leere und es erscheint
wieder das Emoji als Platzhalter.
