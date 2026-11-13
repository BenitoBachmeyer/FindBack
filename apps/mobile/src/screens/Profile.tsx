import React, { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { profiles } from "@findback/core";
import { useStore } from "../store";
import { apiUrl } from "../data/gateway";
import { Button, Chip, Note, ReportRow, s, Sheet } from "../components/ui";
export function Profile({ openReport }: { openReport: (id: string) => void }) {
  const { state, actor, setActor, run, busy } = useStore();
  const [privacy, setPrivacy] = useState(false),
    [erase, setErase] = useState(false);
  const reports = state.reports.filter((r) => r.ownerId === actor);
  return (
    <>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>DEIN BEREICH</Text>
        <Text style={s.h1}>Profil & Meldungen</Text>
        <Note>
          Du nutzt einen Prototyp mit fiktiven Demo-Profilen. Anmeldung und
          Registrierung sind für die spätere Campus-Anbindung vorgesehen.
        </Note>
        <Text style={s.label}>Demo-Profil wechseln</Text>
        <View style={s.chips}>
          {profiles.map((p) => (
            <Chip
              key={p.id}
              selected={actor === p.id}
              label={p.name}
              onPress={() => {
                if (!busy) void setActor(p.id);
              }}
            />
          ))}
        </View>
        <Text style={s.body}>
          {apiUrl
            ? "Gemeinsamer Demo-Server. Zum Aktualisieren die Liste nach unten ziehen."
            : Platform.OS === "web"
              ? "Browser-Vorschau: Daten bleiben in diesem Browser gespeichert."
              : "Lokale Demo: Daten bleiben in SQLite auf diesem Gerät gespeichert."}
        </Text>
        <Button
          title="Welche Daten verarbeitet FindBack?"
          secondary
          onPress={() => setPrivacy(true)}
        />
        <View>
          <Text style={s.h2}>Meine Meldungen ({reports.length})</Text>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} onPress={() => openReport(r.id)} />
          ))}
          {!reports.length && (
            <Text style={[s.body, { marginTop: 16 }]}>
              Du hast noch keine Meldung erstellt.
            </Text>
          )}
        </View>
        <Button
          title="Meine Demo-Daten löschen"
          secondary
          onPress={() => setErase(true)}
        />
      </ScrollView>
      <Sheet
        visible={privacy}
        title="Deine Daten"
        onClose={() => setPrivacy(false)}
      >
        <Text style={s.body}>
          FindBack speichert deine Meldungen, optional ausgewählte Fotos,
          Trefferentscheidungen, Chatnachrichten und Übergabeinformationen.
        </Text>
        <Text style={s.body}>
          Meldungen sind für beide Demo-Profile sichtbar. Chat und Termin sind
          erst nach einer Trefferbestätigung für die Beteiligten verfügbar. Es
          gibt kein Hintergrundtracking, keine Gesichtserkennung und keine
          Analyse deiner Fotos.
        </Text>
        <Text style={s.body}>
          {apiUrl
            ? "Im Servermodus werden die Angaben an die konfigurierte Demo-API gesendet und dort in SQLite gespeichert."
            : "Im lokalen Modus verlassen Meldungen und Fotos dieses Gerät nicht."}{" "}
          Die Datenbank ist im Prototyp nicht zusätzlich verschlüsselt.
        </Text>
        <Text style={s.body}>
          Verwende ausschließlich Testdaten. Demo-Profile ersetzen keine sichere
          Anmeldung. Eine produktive Version benötigt echte Benutzerkonten,
          HTTPS, Zugriffsschutz sowie ein überprüftes Datenschutz- und
          Löschkonzept.
        </Text>
      </Sheet>
      <Sheet
        visible={erase}
        title="Eigene Daten löschen?"
        onClose={() => setErase(false)}
      >
        <Text style={s.body}>
          Deine Meldungen einschließlich verknüpfter Treffer, Nachrichten und
          Übergaben werden dauerhaft entfernt. Die unabhängigen Meldungen des
          anderen Demo-Profils bleiben erhalten.
        </Text>
        <Button
          title="Meine Daten endgültig löschen"
          disabled={busy}
          onPress={async () => {
            if (await run({ type: "eraseMyData" })) setErase(false);
          }}
        />
        <Button title="Abbrechen" secondary onPress={() => setErase(false)} />
      </Sheet>
    </>
  );
}
