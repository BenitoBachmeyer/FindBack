import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useStore } from "../store";
import { colors, Empty, Icon, s } from "../components/ui";
export function Activity({
  openMatch,
  openChat,
}: {
  openMatch: (id: string) => void;
  openChat: (id: string) => void;
}) {
  const { state, actor, run, reload, busy } = useStore();
  const matches = state.matches.filter((m) => m.status !== "rejected");
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={busy} onRefresh={() => void reload()} />
      }
      contentContainerStyle={s.content}
    >
      <Text style={s.eyebrow}>DEINE AKTIVITÄTEN</Text>
      <Text style={s.h1}>Treffer & Chats</Text>
      <Text style={s.body}>
        Prüfe Vorschläge und bringe Gegenstände zurück.
      </Text>
      {matches.map((m) => {
        const report = state.reports.find(
          (r) =>
            (r.id === m.lostId || r.id === m.foundId) && r.ownerId !== actor,
        )!;
        return (
          <Pressable
            accessibilityRole="button"
            key={m.id}
            onPress={() => {
              void run({ type: "readMatch", matchId: m.id });
              m.status === "suggested" ? openMatch(m.id) : openChat(m.id);
            }}
            style={s.card}
          >
            <View style={s.row}>
              <Icon
                name={
                  m.status === "returned"
                    ? "checkmark-circle-outline"
                    : m.status === "accepted"
                      ? "chatbubbles-outline"
                      : "sparkles-outline"
                }
                color={colors.green}
              />
              <Text style={[s.eyebrow, { flex: 1 }]}>
                {m.status === "returned"
                  ? "ZURÜCKGEGEBEN"
                  : m.status === "accepted"
                    ? "CHAT & ÜBERGABE"
                    : "MÖGLICHER TREFFER"}
              </Text>
              {!m.readBy.includes(actor) && (
                <View
                  style={{
                    backgroundColor: colors.green,
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                  }}
                />
              )}
            </View>
            <Text style={s.h3}>{report.title}</Text>
            <Text style={s.body}>{report.location}</Text>
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: colors.green }}
            >
              {m.status === "suggested"
                ? "Vorschlag prüfen"
                : "Unterhaltung öffnen"}{" "}
              →
            </Text>
          </Pressable>
        );
      })}
      {!matches.length && (
        <Empty
          title="Noch keine Treffer"
          detail="Neue passende Meldungen erscheinen hier automatisch. Du kannst jederzeit manuell suchen."
        />
      )}
    </ScrollView>
  );
}
