# Bezug zu den bereitgestellten Unterlagen

Die Dateien wurden als Produktanforderungen und Gestaltungsreferenz gelesen. Präsentationsregie, Vortragstiming und sonstige Anweisungen innerhalb der Dateien wurden nicht als Arbeitsauftrag ausgeführt. Die Originaldateien werden nicht in das öffentliche Repository kopiert.

| Quelle                                                            | Übernommener Inhalt                                                          | Umsetzung / Grenze                                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FindBack App-Screens.pdf, S. 1–2                                  | Einstieg, Datenschutz, ohne Konto                                            | Transparenter Demo-Einstieg und Datenschutzdialog. Keine vorgetäuschte Anmeldung/Registrierung.                                                                         |
| App-Screens, S. 3–5                                               | Suche, Gefunden/Verloren, Filter, Melden                                     | Suche, Kategorie/Ort/Zeitraum, Meldungsauswahl als Bottom Sheet, untere Navigation.                                                                                     |
| App-Screens, S. 6–9                                               | Verlust/Fund in zwei Schritten, Foto optional, keine Hintergrundortung       | Gemeinsames validiertes Formular für beide Meldearten, persistiertes Foto. Zusätzlich kurzer Titel für die Listenansicht.                                               |
| App-Screens, S. 10–11                                             | Treffervergleich, Zustimmung vor Kontakt                                     | Vergleich, begründeter Score, Ablehnung und Bestätigungsdialog.                                                                                                         |
| App-Screens, S. 12–13                                             | Chat und Übergabetermin                                                      | Persistenter Chat, Vorschlag, Gegenbestätigung, Abschluss erst nach tatsächlicher beidseitiger Rückgabebestätigung.                                                     |
| FindBack verlorene Dinge intelligent wiederfinden.pdf und (1).pdf | Campus, User Stories 1–5                                                     | Melden, Suche, Bilder/Informationen und sichtbare Trefferhinweise. Keine OS-Push-Benachrichtigungen. Inhaltliche Anforderungen beider Fassungen berücksichtigt.         |
| Dieselben Folien, S. 3–6                                          | Mobile Bedienung, kurze Antwortzeit, Sicherheit, Datensparsamkeit, Use Cases | Android/iOS-Projekt, kleine lokale Datenmenge, Validierung, keine Ortung/Gesichtserkennung, löschbare Daten. Antwortzeit <2 s ist ein Ziel und keine nachgewiesene SLA. |
| FindBack_Praesentationsskript_Antal_Silwy.pdf                     | Prüffähiges Matching, manuelle Suche als Fallback, MVP-Grenzen               | Regelbasierter Score mit Gründen, Regressionstests, manuelle Suche, dokumentierte Grenzen.                                                                              |
| FindBack_Sprechskript_Vision_Cone_Risikomanagement.pdf            | Transparenz, Datenminimierung, sichere Rückgabe, Erweiterbarkeit             | Vor Kontaktfreigabe keine Profilanzeige, bewusste Bestätigung, modularer Core/Gateway/Repository-Aufbau.                                                                |
| Prsentation AMM Vision Cone & RM.pptx                             | Vision Cone, acht Projektrisiken                                             | Architekturentscheidungen, Testfälle und folgende Risikozuordnung.                                                                                                      |

## Risikobehandlung

- **R1 Matchingqualität:** nachvollziehbare Regeln, klare Positiv-/Negativfälle, manuelle Suche. Qualität an realen Campusdaten bleibt zu evaluieren.
- **R2 Scope:** Fokus auf den vollständigen Kernfluss. Keine KI-Suche, Tracking, Campusintegration oder Produktionsauthentifizierung.
- **R3 Späte Entscheidungen:** lokaler Modus plus separater API-Modus, gemeinsame Domain, dokumentierte SQLite-Entscheidung.
- **R4 Datenschutz:** keine Hintergrundberechtigungen, kein Kontaktfeld, Datenschutzdialog und Datenlöschung. Produktive Compliance bleibt offen.
- **R5 Datenqualität:** Pflichtfelder, Kategorien, Längenlimits, valide Zeitpunkte, Größenlimit für Bilder.
- **R6 Falsche Übergabe:** Treffer ist ein Vorschlag; Hinweis auf zusätzliches Erkennungsmerkmal; beidseitige Rückgabebestätigung.
- **R7 Wissenskonzentration:** Startanleitung, Architektur, automatisierte Tests und reproduzierbare Abhängigkeiten.
- **R8 Relevanz:** Ports für Austausch von Datenhaltung, API und Matching; Campusfokus und schlanker Umfang.

## Gestaltungsentscheidungen

Die App behält weiße Flächen, klare Schrift, graue Such-/Bildflächen, Listen mit Trennlinien, Dialoge von unten und die vierteilige Navigation der Screenvorlage bei. Ein dezenter grüner Akzent ergänzt Orientierung und Status. Es wurden keine fremden Bilder oder Remote-Bilddienste eingebaut.
