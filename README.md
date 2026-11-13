# FindBack

Ein modularer React-Native-Prototyp für die Lost-and-Found-Plattform auf dem Campus. Entwickelt aus den bereitgestellten App-Screens, User Stories und Unterlagen zu Vision Cone und Risikomanagement.

## Start in drei Schritten

Stack: **Expo SDK 58**, React Native 0.88 und React 19.3, über das Lockfile abgestimmt.

Voraussetzung: Node.js **22.13 oder neuer** (Node 22 LTS empfohlen) und npm.

```sh
npm ci
npm run check
npm start
```

Im Expo-Terminal `a` für einen gestarteten Android-Emulator oder `i` für den iOS-Simulator auf macOS drücken. Für ein echtes Gerät eine zur SDK-Version passende Expo-Go-Version oder einen Development Build verwenden. Der iOS-Simulator benötigt macOS/Xcode; Android benötigt Android Studio für den Emulator.

Die App startet ohne Backend im lokalen Demo-Modus. Auf Android/iOS persistiert **expo-sqlite** alle Meldungen, Fotos, Chats und Übergaben über App-Neustarts. Die zusätzliche Browser-Vorschau (`npm run web`) verwendet **localStorage**, nicht SQLite. Sie dient der schnellen Präsentation der identischen React-Native-Komponenten.

## Was funktioniert?

- Helle Oberfläche mit Suche, Gefunden/Verloren-Tabs, Filterdialog und unterer Navigation nach den App-Screens.
- Verlust- und Fundmeldung in zwei Schritten, mit Pflichtfeldern und optionalem Foto aus der Mediathek.
- Suche nach Text/Ort, Kategorie und Zeitraum; Anzeigen, Löschen und Status eigener Meldungen.
- Regelbasiertes Matching mit sichtbarer Begründung. Bilder werden nicht analysiert; ein Score ist kein Eigentumsnachweis.
- Treffer annehmen oder ablehnen. Erst nach ausdrücklicher Bestätigung ist der Chat verfügbar.
- Persistenter Chat zwischen den beiden Demo-Profilen Alex und Mara, Übergabevorschläge, Terminbestätigung und Rückgabebestätigung durch **beide** Beteiligte.
- Aktivitätsliste für Treffer und Chats, Profilwechsel und Löschung eigener Demo-Daten.
- Optionales separates HTTP-Backend mit SQLite für eine gemeinsame Demo auf mehreren Geräten.

## Eine Vorführung in fünf Minuten

1. „Demo starten“ wählen. Als Alex gibt es eine Verlustmeldung zur schwarzen Regenjacke und einen passenden Fund von Mara.
2. In „Suchen“ den Treffer öffnen. Ort, Zeit und Matching-Gründe vergleichen, „Ja, das ist meiner“ und anschließend „Bestätigen und Chat öffnen“ wählen.
3. Eine Nachricht senden und eine Übergabe für einen zukünftigen Zeitpunkt vorschlagen.
4. Im Chat „Als Mara weitermachen“ wählen. Nachricht lesen, antworten und Termin bestätigen.
5. Die tatsächliche Rückgabe als Mara bestätigen, dann als Alex bestätigen. Erst jetzt steht der Fall auf „Zurückgegeben“.
6. Optional eine weitere Verlust- oder Fundmeldung erstellen, filtern und über „Profil“ wieder löschen.

Demo-Daten werden nur bei einer noch leeren Datenbank initialisiert. Gelöschte Daten tauchen beim nächsten Start nicht wieder auf. Eine vollständig neue Vorführung erhält man durch Löschen der App-Daten bzw. durch eine frische Backend-Datenbank. Im Browser den Website-Speicher zurücksetzen. **Das löscht alle jeweiligen Testdaten.**

## Gemeinsames Backend

Standardmäßig lauscht die API nur auf `127.0.0.1`. Beispiel für einen lokalen Test mit zwei Browsern:

```sh
# Terminal 1, Repository-Wurzel
FINDBACK_DEMO_TOKEN='replace-with-a-long-demo-token' npm run api
```

`apps/mobile/.env` anlegen (siehe `.env.example`):

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_DEMO_TOKEN=replace-with-a-long-demo-token
```

Expo nach Änderungen an Umgebungsvariablen neu starten. Für Geräte im selben vertrauenswürdigen WLAN den Server mit `HOST=0.0.0.0` starten und die LAN-IP des Rechners statt `localhost` verwenden. Für den Android-Emulator ist der Host meist unter `10.0.2.2` erreichbar. Eigenständige iOS-/Android-Builds können unverschlüsseltes HTTP blockieren; dafür einen HTTPS-Endpunkt verwenden. Es werden bewusst keine globalen Ausnahmen für unsicheren Datenverkehr eingebaut.

- SQLite-Datei: `apps/api/data/findback.db` beim Start per npm-Workspace; überschreibbar mit `FINDBACK_DB`.
- API-Port: `PORT`, Standard `3001`.
- Browser-Origin: `FINDBACK_WEB_ORIGIN`, Standard `http://localhost:8081`.
- Keine automatische Synchronisierung zwischen lokaler Demo und Servermodus. Jeder Modus hat einen eigenen Datenbestand.
- Andere Geräte aktualisieren über Herunterziehen in Suche, Aktivitäten oder Chat. Keine WebSockets, Hintergrunddienste oder Push-Nachrichten.

**Die API ist ausschließlich eine Demo.** Der gemeinsame Demo-Schlüssel wird in den Client eingebaut und stellt keine Benutzeranmeldung dar. Wer den Schlüssel kennt, kann zwischen Alex und Mara wechseln. Ausschließlich fiktive Daten und ein vertrauenswürdiges Testnetz verwenden. Für einen realen Campusbetrieb sind echte Authentifizierung, serverseitige Benutzeridentität, TLS, Limits, Monitoring und ein geprüftes Datenschutzkonzept erforderlich.

## Projektstruktur

```text
apps/mobile/src/
  components/       UI-Bausteine und gemeinsame Gestaltung
  screens/          Suche, Melden, Detail, Aktivitäten, Chat, Profil
  data/             SQLite-Adapter und austauschbarer HTTP-Gateway
  store.tsx         App-Zustand, Fehlerbehandlung, Lade-/Schreibsperren
apps/api/src/       HTTP-Transport und serverseitiges SQLite-Repository
packages/core/src/  Modelle, Validierung, Matching, Anwendungsfälle, Demo-Daten
 tests/            Domain- und API-/SQLite-Integrationstests
 docs/             Architektur, Anforderungen, Testprotokoll
```

Die UI kennt weder SQL noch die Matching-Gewichte. Sie spricht das `Gateway`-Interface an. Lokaler Modus und API verwenden dieselbe Domänenlogik. Details: [Architektur](docs/architecture.md), [Abdeckung der Unterlagen](docs/requirements.md), [Testprotokoll](docs/verification.md).

## Entwicklung und Builds

```sh
npm run check            # TypeScript, Domain- und API-Integrationstests
npm run format           # Quellcode formatieren
npm run format:check
npm run web              # Browser-Vorschau
npm run android          # Expo mit Android öffnen
npm run ios              # Expo mit iOS öffnen (macOS)
```

Ein Expo/EAS-Konto und die jeweilige Signierung sind erst für eigenständige Installationspakete nötig. `apps/mobile/eas.json` enthält ein Preview-Profil für ein Android-APK und interne iOS-Verteilung. Mit eingerichteter EAS CLI aus `apps/mobile` ausführen:

```sh
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Für iOS benötigt die interne Geräteverteilung ein Apple-Developer-Konto und registrierte Testgeräte. Es wurden keine App-Store-Veröffentlichung und keine kostenpflichtigen Cloud-Builds ausgelöst.

## Bewusste Prototyp-Grenzen

Keine echte Anmeldung, Passwortverwaltung, Push-Nachrichten, KI-/Bildsuche, automatische Standortbestimmung oder Fundbüro-Verwaltung. Kein verschlüsselter Datenbankinhalt und keine zugesicherte DSGVO-Konformität. Die Anmeldescreens aus dem Entwurf werden deshalb durch einen transparenten Demo-Einstieg ersetzt. Alle übrigen Kernabläufe sind funktional, nicht bloß klickbare Attrappen.
