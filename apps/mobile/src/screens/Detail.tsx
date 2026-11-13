import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useStore } from "../store";
import {
  Button,
  colors,
  dateLabel,
  ItemImage,
  Note,
  s,
  Sheet,
} from "../components/ui";
export function Detail({
  reportId,
  matchId,
  onChat,
  onBack,
  onCreate,
}: {
  reportId?: string;
  matchId?: string;
  onChat: (id: string) => void;
  onBack: () => void;
  onCreate: () => void;
}) {
  const { state, actor, run, busy } = useStore();
  const [confirm, setConfirm] = useState(false),
    [remove, setRemove] = useState(false);
  const match = matchId
    ? state.matches.find((m) => m.id === matchId)
    : state.matches.find(
        (m) =>
          (m.lostId === reportId || m.foundId === reportId) &&
          m.status !== "rejected",
      );
  const pair = match
    ? state.reports.filter(
        (r) => r.id === match.lostId || r.id === match.foundId,
      )
    : [];
  const own = pair.find((r) => r.ownerId === actor);
  const report = reportId
    ? state.reports.find((r) => r.id === reportId)
    : pair.find((r) => r.ownerId !== actor);
  if (!report)
    return (
      <View style={s.content}>
        <Text style={s.body}>Diese Meldung ist nicht mehr verfügbar.</Text>
        <Button title="Zurück zur Suche" onPress={onBack} />
      </View>
    );
  return (
    <>
      <ScrollView contentContainerStyle={s.content}>
        <ItemImage report={report} large />
        <View style={{ gap: 8 }}>
          <Text style={s.eyebrow}>
            {report.kind === "found" ? "GEFUNDEN" : "VERLOREN"} ·{" "}
            {report.category.toUpperCase()}
          </Text>
          <Text style={s.h1}>{report.title}</Text>
          <Text style={s.body}>{dateLabel(report.occurredAt)}</Text>
        </View>
        <View style={s.divider} />
        <View style={{ gap: 8 }}>
          <Text style={s.label}>
            {report.kind === "found" ? "Fundort" : "Verlustort"}
          </Text>
          <Text style={s.body}>{report.location}</Text>
          {own && own.id !== report.id && (
            <Text style={s.small}>
              Deine Meldung: {own.location} · {dateLabel(own.occurredAt)}
            </Text>
          )}
        </View>
        <View style={{ gap: 8 }}>
          <Text style={s.label}>Beschreibung</Text>
          <Text style={[s.body, { color: colors.ink }]}>
            {report.description}
          </Text>
        </View>
        {match && match.status !== "rejected" && (
          <View style={s.card}>
            <Text style={s.h3}>Warum dieser Vorschlag?</Text>
            {match.reasons.map((reason) => (
              <Text key={reason} style={s.body}>
                ✓ {reason}
              </Text>
            ))}
            <Text style={s.small}>
              Ähnlichkeitswert: {match.score}/100. Keine Wahrscheinlichkeit und
              kein Eigentumsnachweis.
            </Text>
          </View>
        )}
        {match?.status === "suggested" ? (
          <>
            <Text style={s.h2}>
              {report.kind === "found"
                ? "Ist das dein Gegenstand?"
                : "Könnte diese Meldung passen?"}
            </Text>
            <Button
              title={
                report.kind === "found"
                  ? "Ja, das ist meiner"
                  : "Ja, Treffer prüfen und bestätigen"
              }
              onPress={() => setConfirm(true)}
            />
            <Button
              title="Nein, passt nicht"
              secondary
              disabled={busy}
              onPress={async () => {
                if (await run({ type: "rejectMatch", matchId: match.id }))
                  onBack();
              }}
            />
            <Text style={s.small}>
              Der Chat wird erst nach deiner ausdrücklichen Bestätigung
              freigegeben.
            </Text>
          </>
        ) : match &&
          (match.status === "accepted" || match.status === "returned") ? (
          <>
            <Note>
              {match.status === "returned"
                ? "Die Rückgabe wurde von beiden Personen bestätigt."
                : "Treffer bestätigt. Vereinbart die Übergabe im Chat."}
            </Note>
            <Button
              title="Chat und Übergabe öffnen"
              onPress={() => onChat(match.id)}
            />
          </>
        ) : report.ownerId !== actor && report.status === "open" ? (
          <>
            <Note>
              Erstelle eine eigene Gegenmeldung mit den Merkmalen deines
              Gegenstands. FindBack prüft dann mögliche Übereinstimmungen.
            </Note>
            <Button title="Eigene Meldung erstellen" onPress={onCreate} />
          </>
        ) : null}
        {report.ownerId === actor && (
          <Button
            title="Meldung löschen"
            secondary
            onPress={() => setRemove(true)}
          />
        )}
      </ScrollView>
      <Sheet
        visible={confirm}
        title="Treffer bestätigen?"
        onClose={() => setConfirm(false)}
      >
        <Text style={s.body}>
          Dein Demo-Profil wird im Chat sichtbar. Vergleicht vor der Rückgabe
          ein zusätzliches Merkmal, das nur die besitzende Person kennt.
        </Text>
        <Note>
          Der Fall bleibt offen, bis beide Personen die tatsächliche Rückgabe
          bestätigen.
        </Note>
        <Button
          title="Bestätigen und Chat öffnen"
          disabled={busy}
          onPress={async () => {
            if (
              match &&
              (await run({ type: "acceptMatch", matchId: match.id }))
            ) {
              setConfirm(false);
              onChat(match.id);
            }
          }}
        />
        <Button title="Abbrechen" secondary onPress={() => setConfirm(false)} />
      </Sheet>
      <Sheet
        visible={remove}
        title="Meldung löschen?"
        onClose={() => setRemove(false)}
      >
        <Text style={s.body}>
          Auch verknüpfte Treffer, Chats und Übergaben werden entfernt. Diese
          Aktion kann nicht rückgängig gemacht werden.
        </Text>
        <Button
          title="Endgültig löschen"
          disabled={busy}
          onPress={async () => {
            if (await run({ type: "deleteReport", reportId: report.id })) {
              setRemove(false);
              onBack();
            }
          }}
        />
      </Sheet>
    </>
  );
}
