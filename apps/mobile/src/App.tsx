import React, { useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ReportKind } from "@findback/core";
import { Provider, useStore } from "./store";
import { Button, colors, Icon, Loading, Note, s, Sheet } from "./components/ui";
import { Search } from "./screens/Search";
import { ReportForm } from "./screens/ReportForm";
import { Detail } from "./screens/Detail";
import { Chat } from "./screens/Chat";
import { Activity } from "./screens/Activity";
import { Profile } from "./screens/Profile";
import { apiUrl } from "./data/gateway";
type Route =
  | { screen: "search" }
  | { screen: "activity" }
  | { screen: "profile" }
  | { screen: "form"; kind: ReportKind }
  | { screen: "detail"; reportId?: string; matchId?: string }
  | { screen: "chat"; matchId: string };
function Shell() {
  const { ready, error, clearError, reload, state, actor } = useStore();
  const [started, setStarted] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [notice, setNotice] = useState(""),
    [chooser, setChooser] = useState(false),
    [routes, setRoutes] = useState<Route[]>([{ screen: "search" }]);
  const route = routes[routes.length - 1];
  const push = (next: Route) => setRoutes((old) => [...old, next]);
  const root = (screen: "search" | "activity" | "profile") =>
    setRoutes([{ screen }]);
  const back = () =>
    setRoutes((old) => (old.length > 1 ? old.slice(0, -1) : old));
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (routes.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [routes.length]);
  const unread = state.matches.filter(
    (m) => m.status !== "rejected" && !m.readBy.includes(actor),
  ).length;
  const openReport = (reportId: string) => push({ screen: "detail", reportId });
  const openMatch = (matchId: string) => push({ screen: "detail", matchId });
  const openChat = (matchId: string) => push({ screen: "chat", matchId });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EDF1EE" }}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 600,
          alignSelf: "center",
          backgroundColor: "white",
        }}
      >
        {!ready ? (
          <>
            {error ? (
              <View style={s.content}>
                <Text style={s.h2}>FindBack konnte nicht starten</Text>
                <Text style={s.error}>{error}</Text>
                <Button
                  title="Erneut versuchen"
                  onPress={() => void reload()}
                />
              </View>
            ) : (
              <Loading />
            )}
          </>
        ) : !started ? (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 30,
              justifyContent: "center",
              gap: 24,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 26,
                backgroundColor: colors.mint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="scan-outline" size={44} color={colors.green} />
            </View>
            <Text style={[s.eyebrow, { marginTop: 12 }]}>
              DEIN CAMPUS. DEINE DINGE.
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "700",
                letterSpacing: -2,
                color: colors.ink,
              }}
            >
              FindBack
            </Text>
            <Text style={[s.h2, { fontWeight: "400", lineHeight: 34 }]}>
              Verlorene Dinge.{"\n"}Gemeinsam wiederfinden.
            </Text>
            <Text style={s.body}>
              Melde einen Verlust oder Fund, prüfe passende Treffer und
              vereinbare eine sichere Rückgabe.
            </Text>
            <Button
              title="Demo starten"
              icon="arrow-forward"
              onPress={() => setStarted(true)}
            />
            <Button
              title="Ohne Konto umsehen"
              secondary
              onPress={() => setStarted(true)}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setPrivacy(true)}
              style={{ paddingVertical: 10 }}
            >
              <Text
                style={[
                  s.small,
                  { textAlign: "center", textDecorationLine: "underline" },
                ]}
              >
                Welche Daten verarbeitet FindBack?
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.mint,
                paddingHorizontal: 24,
                paddingVertical: 8,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ color: colors.green, fontSize: 11, fontWeight: "600" }}
              >
                {apiUrl ? "SERVER-DEMO" : "LOKALE DEMO"} ·{" "}
                {actor === "alex" ? "Alex" : "Mara"}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => root("profile")}
              >
                <Text style={{ color: colors.green, fontSize: 11 }}>
                  Profil wechseln
                </Text>
              </Pressable>
            </View>
            {routes.length > 1 && (
              <View
                style={[
                  s.row,
                  {
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderColor: colors.line,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Zurück"
                  onPress={back}
                  style={s.iconButton}
                >
                  <Icon name="arrow-back" />
                </Pressable>
                <Text style={s.label}>
                  {route.screen === "form"
                    ? `Gegenstand ${route.kind === "lost" ? "verloren" : "gefunden"}`
                    : route.screen === "chat"
                      ? "Chat & Übergabe"
                      : "Meldung prüfen"}
                </Text>
              </View>
            )}
            {notice && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hinweis schließen"
                onPress={() => setNotice("")}
                style={{ padding: 12 }}
              >
                <Note>{notice}</Note>
              </Pressable>
            )}
            {error && (
              <Pressable
                accessibilityRole="button"
                onPress={clearError}
                style={{ padding: 12 }}
              >
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                  {"\n"}Tippen zum Schließen
                </Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              {route.screen === "search" ? (
                <Search openReport={openReport} openMatch={openMatch} />
              ) : route.screen === "activity" ? (
                <Activity openMatch={openMatch} openChat={openChat} />
              ) : route.screen === "profile" ? (
                <Profile openReport={openReport} />
              ) : route.screen === "form" ? (
                <ReportForm
                  key={`${routes.length}-${route.kind}`}
                  kind={route.kind}
                  onDone={() => {
                    setNotice(
                      "Meldung gespeichert. Passende Vorschläge findest du unter Treffer.",
                    );
                    root("profile");
                  }}
                />
              ) : route.screen === "detail" ? (
                <Detail
                  reportId={route.reportId}
                  matchId={route.matchId}
                  onChat={openChat}
                  onBack={back}
                  onCreate={() => setChooser(true)}
                />
              ) : (
                <Chat matchId={route.matchId} />
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingVertical: 9,
                backgroundColor: "white",
              }}
            >
              {(
                [
                  { key: "search", label: "Suchen", icon: "search-outline" },
                  {
                    key: "create",
                    label: "Melden",
                    icon: "add-circle-outline",
                  },
                  {
                    key: "activity",
                    label: "Treffer",
                    icon: "notifications-outline",
                  },
                  { key: "profile", label: "Profil", icon: "person-outline" },
                ] as const
              ).map((tab) => (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: route.screen === tab.key }}
                  onPress={() =>
                    tab.key === "create" ? setChooser(true) : root(tab.key)
                  }
                  style={{
                    flex: 1,
                    minHeight: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  <View>
                    <Icon
                      name={tab.icon}
                      color={
                        route.screen === tab.key ? colors.green : colors.muted
                      }
                      size={24}
                    />
                    {tab.key === "activity" && unread > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          right: -3,
                          top: 0,
                          width: 7,
                          height: 7,
                          borderRadius: 7,
                          backgroundColor: colors.green,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color:
                        route.screen === tab.key ? colors.green : colors.muted,
                      fontWeight: "500",
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Sheet
          visible={chooser}
          title="Was möchtest du melden?"
          onClose={() => setChooser(false)}
        >
          <Button
            title="Gegenstand verloren"
            icon="search-outline"
            onPress={() => {
              setChooser(false);
              push({ screen: "form", kind: "lost" });
            }}
          />
          <Text style={s.small}>Verlustmeldung in zwei Schritten</Text>
          <Button
            title="Gegenstand gefunden"
            icon="hand-left-outline"
            secondary
            onPress={() => {
              setChooser(false);
              push({ screen: "form", kind: "found" });
            }}
          />
          <Text style={s.small}>Fundmeldung in zwei Schritten</Text>
        </Sheet>
        <Sheet
          visible={privacy}
          title="Datensparsam wiederfinden"
          onClose={() => setPrivacy(false)}
        >
          <Note>
            Keine Ortung im Hintergrund. Keine Gesichtserkennung. Keine
            automatische Bildanalyse.
          </Note>
          <Text style={s.body}>
            Im lokalen Demo-Modus bleiben Meldungen, Bilder und Chats auf deinem
            Gerät. Der optionale Servermodus speichert gemeinsame Daten in einer
            SQLite-Datenbank auf dem konfigurierten Server.
          </Text>
          <Text style={s.body}>
            Bitte nur Testdaten verwenden. Es gibt noch keine echte
            Registrierung oder sichere Kontoverwaltung. Unter „Profil“ kannst du
            deine Demo-Daten löschen.
          </Text>
        </Sheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Provider>
        <Shell />
      </Provider>
    </SafeAreaProvider>
  );
}
