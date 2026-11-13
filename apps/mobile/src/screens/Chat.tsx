import React, { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { profiles } from "@findback/core";
import { useStore } from "../store";
import {
  Button,
  colors,
  dateLabel,
  Field,
  Note,
  s,
  Sheet,
} from "../components/ui";
import { localDateTime, parseDateTime } from "./ReportForm";
export function Chat({ matchId }: { matchId: string }) {
  const {
    state,
    actor,
    run,
    busy,
    setActor,
    reload,
    error: serviceError,
  } = useStore();
  const [text, setText] = useState(""),
    [sheet, setSheet] = useState(false),
    [place, setPlace] = useState("Vor der Bibliothek"),
    [at, setAt] = useState(localDateTime(new Date(Date.now() + 86400000))),
    [error, setError] = useState(""),
    [returnSheet, setReturnSheet] = useState(false);
  const match = state.matches.find((m) => m.id === matchId);
  if (!match || (match.status !== "accepted" && match.status !== "returned"))
    return (
      <View style={s.content}>
        <Text style={s.body}>Bitte zuerst einen Treffer bestätigen.</Text>
      </View>
    );
  const report = state.reports.find(
    (r) =>
      (r.id === match.lostId || r.id === match.foundId) && r.ownerId !== actor,
  )!;
  const partner = profiles.find((p) => p.id === report.ownerId)!;
  const messages = state.messages.filter((m) => m.matchId === match.id);
  const handover = state.handovers.find((h) => h.matchId === match.id);
  const closed = match.status === "returned";
  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={busy} onRefresh={() => void reload()} />
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.row}>
          <View
            style={[
              s.thumb,
              { backgroundColor: colors.mint, width: 48, height: 48 },
            ]}
          >
            <Text style={[s.h2, { color: colors.green }]}>
              {partner.name[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>{partner.name}</Text>
            <Text style={s.small}>{report.title}</Text>
          </View>
        </View>
        <Note>
          Demo-Chat zwischen Alex und Mara. Es gibt keine automatisch erzeugten
          Antworten. Wechsle das Profil, um die andere Seite zu spielen.
        </Note>
        <Button
          secondary
          title={`Als ${partner.name} weitermachen`}
          disabled={busy}
          onPress={() => void setActor(partner.id)}
        />
        {!handover && !closed && (
          <Button
            title="Übergabe vereinbaren"
            icon="calendar-outline"
            onPress={() => setSheet(true)}
          />
        )}
        <Text style={[s.small, { textAlign: "center" }]}>
          Treffer bestätigt ·{" "}
          {closed ? "Fall abgeschlossen" : "Übergabe noch offen"}
        </Text>
        {!messages.length && (
          <Text style={s.body}>
            Schreibe eine erste Nachricht und besprecht ein Erkennungsmerkmal.
          </Text>
        )}
        {messages.map((m) => (
          <View
            key={m.id}
            style={{
              alignSelf: m.senderId === actor ? "flex-end" : "flex-start",
              maxWidth: "88%",
              gap: 5,
            }}
          >
            <View
              style={{
                backgroundColor:
                  m.senderId === actor ? colors.mint : colors.soft,
                borderRadius: 18,
                padding: 15,
              }}
            >
              <Text style={[s.body, { color: colors.ink }]}>{m.text}</Text>
            </View>
            <Text
              style={[
                s.small,
                { textAlign: m.senderId === actor ? "right" : "left" },
              ]}
            >
              {profiles.find((p) => p.id === m.senderId)?.name} ·{" "}
              {dateLabel(m.createdAt)}
            </Text>
          </View>
        ))}
        {handover && (
          <View style={s.card}>
            <Text style={s.eyebrow}>
              {closed ? "ZURÜCKGEGEBEN" : "ÜBERGABEVORSCHLAG"}
            </Text>
            <Text style={s.h3}>{handover.place}</Text>
            <Text style={s.body}>{dateLabel(handover.at)}</Text>
            <Text style={s.small}>
              Termin bestätigt: {handover.confirmedBy.length}/2 · Rückgabe
              bestätigt: {handover.returnedBy.length}/2
            </Text>
            {!closed && !handover.confirmedBy.includes(actor) && (
              <Button
                title="Termin bestätigen"
                disabled={busy}
                onPress={() => void run({ type: "confirmHandover", matchId })}
              />
            )}{" "}
            {!closed &&
              handover.confirmedBy.length < 2 &&
              handover.confirmedBy.includes(actor) && (
                <Text style={s.body}>
                  Warte auf die Terminbestätigung von {partner.name}.
                </Text>
              )}
            {!closed &&
              handover.confirmedBy.length === 2 &&
              !handover.returnedBy.includes(actor) && (
                <Button
                  title="Tatsächliche Rückgabe bestätigen"
                  disabled={busy}
                  onPress={() => setReturnSheet(true)}
                />
              )}{" "}
            {!closed && handover.returnedBy.includes(actor) && (
              <Text style={s.body}>
                Deine Rückgabebestätigung ist gespeichert. {partner.name} muss
                noch bestätigen.
              </Text>
            )}
            {!closed && !handover.returnedBy.length && (
              <Button
                title="Anderen Termin vorschlagen"
                secondary
                onPress={() => {
                  setPlace(handover.place);
                  setAt(localDateTime(new Date(handover.at)));
                  setSheet(true);
                }}
              />
            )}
          </View>
        )}
        {closed ? (
          <Note>
            Wiedergefunden! Beide Meldungen sind abgeschlossen. Der Chat bleibt
            lesbar.
          </Note>
        ) : (
          <>
            <Field
              label="Nachricht"
              placeholder="Schreibe eine Nachricht …"
              multiline
              value={text}
              onChangeText={setText}
              maxLength={2000}
            />
            <Button
              title="Nachricht senden"
              icon="send-outline"
              disabled={busy || !text.trim()}
              onPress={async () => {
                if (await run({ type: "sendMessage", matchId, text }))
                  setText("");
              }}
            />
          </>
        )}
      </ScrollView>
      <Sheet
        visible={sheet}
        title="Übergabe vereinbaren"
        onClose={() => setSheet(false)}
      >
        <Text style={s.body}>
          Wähle einen öffentlichen Treffpunkt. Die andere Person muss den
          Vorschlag bestätigen.
        </Text>
        <Field
          label="Datum und Uhrzeit (JJJJ-MM-TT HH:MM)"
          value={at}
          onChangeText={setAt}
        />
        <Field
          label="Treffpunkt"
          value={place}
          onChangeText={setPlace}
          maxLength={120}
        />
        {(error || serviceError) && (
          <Text accessibilityRole="alert" style={s.error}>
            {error || serviceError}
          </Text>
        )}
        <Button
          title="Vorschlag senden"
          disabled={busy}
          onPress={async () => {
            const time = parseDateTime(at);
            if (!Number.isFinite(time)) {
              setError(
                "Bitte einen gültigen Termin im angegebenen Format eingeben.",
              );
              return;
            }
            if (
              await run({
                type: "proposeHandover",
                matchId,
                place,
                at: new Date(time).toISOString(),
              })
            ) {
              setSheet(false);
              setError("");
            }
          }}
        />
      </Sheet>
      <Sheet
        visible={returnSheet}
        title="Gegenstand übergeben?"
        onClose={() => setReturnSheet(false)}
      >
        <Text style={s.body}>
          Bestätige nur, wenn die Rückgabe tatsächlich stattgefunden hat und ihr
          das Eigentum anhand eines zusätzlichen Merkmals geprüft habt.
        </Text>
        {serviceError && (
          <Text accessibilityRole="alert" style={s.error}>
            {serviceError}
          </Text>
        )}
        <Button
          title="Ja, Rückgabe hat stattgefunden"
          disabled={busy}
          onPress={async () => {
            if (await run({ type: "confirmReturn", matchId }))
              setReturnSheet(false);
          }}
        />
        <Button
          title="Noch nicht"
          secondary
          onPress={() => setReturnSheet(false)}
        />
      </Sheet>
    </>
  );
}
