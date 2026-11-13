# Prüfprotokoll

Stand: 13. November 2026. Verifiziert auf Linux mit Node 22.

## Automatisch

- TypeScript: `npm run typecheck` erfolgreich.
- Acht Domain-/Integrationstests: `npm test` erfolgreich.
- Abgedeckt: Positiv-/Negativ-Matching, Validierung, Zukunftsdatum, Chatfreigabe, Terminbestätigung, beidseitiger Abschluss, idempotente Bestätigung, konkurrierende Treffer, abgelehnte Treffer, Besitzprüfung, kaskadierendes Löschen, serialisierte Schreibvorgänge, Fehler beim Persistieren.
- API-Test mit echter temporärer SQLite-Datei: fehlender Token, ungültiges Profil, ungültige Eingaben, Chat und Rückgabe durch beide Demo-Profile, Wiederöffnen der Datenbank und persistierter Endzustand.
- Expo-Export für **Android, iOS und Web** erfolgreich, einschließlich Hermes-Bundles für beide nativen Plattformen.
- Formatierung mit Prettier geprüft.
- `npm audit`: keine bekannten Schwachstellen nach gezieltem Override von `@expo/fingerprint` → `minimatch@11.0.1`. Der verwendete Minimatch-Konstruktor und das Ignore-Pattern-Verhalten bleiben kompatibel; bei Expo-Upgrades diesen Override erneut prüfen.

## Browserprüfung

Die React-Native-Web-Oberfläche wurde bei 390 × 844 Pixeln visuell geprüft und bedient:

1. Demo starten, Suche mit beiden Meldearten anzeigen.
2. Trefferdetails mit Vergleich und Matching-Begründung öffnen.
3. Freigabedialog bestätigen, Chat öffnen und Nachricht speichern.
4. Übergabe vorschlagen, zu Mara wechseln und Termin bestätigen.
5. Rückgabe als Mara und anschließend als Alex bestätigen; erst danach „Zurückgegeben“.
6. Leeres Meldungsformular zurückweisen, neue Schlüssel-Verlustmeldung in zwei Schritten speichern.
7. Browser neu laden: neue Meldung, Chat und abgeschlossener Fall bleiben erhalten.
8. Kategorie Elektronik + Ort Mensa + letzte 7 Tage filtern: nur die passenden Kopfhörer bleiben sichtbar.

## Noch auf Geräten zu prüfen

Es waren keine Android-/iOS-Geräte oder Simulatoren verfügbar. Ein erfolgreicher Bundle-Export ersetzt keinen Test auf echter Hardware. Offen sind insbesondere native SQLite-Persistenz nach Prozessende, Mediatheksberechtigungen/Fotoauswahl, Bildschirmtastatur, Safe Areas, TalkBack/VoiceOver und der gemeinsame API-Modus über WLAN/HTTPS.

Es wurden keine signierten APK-/IPA-Pakete erstellt. Die API wurde automatisiert getestet; die Browser-UI lief im lokalen Demo-Modus. Bildverarbeitung und Fotoauswahl sind implementiert, wurden aber nicht mit einer echten Gerätemediathek getestet.
