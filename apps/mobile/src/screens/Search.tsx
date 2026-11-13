import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { categories, Category, normalize, ReportKind } from "@findback/core";
import { useStore } from "../store";
import {
  Button,
  Chip,
  colors,
  Empty,
  Icon,
  ReportRow,
  s,
  Sheet,
  Field,
} from "../components/ui";
export function Search({
  openReport,
  openMatch,
}: {
  openReport: (id: string) => void;
  openMatch: (id: string) => void;
}) {
  const { state, actor, reload, busy } = useStore();
  const [kind, setKind] = useState<ReportKind>("found"),
    [query, setQuery] = useState(""),
    [filters, setFilters] = useState(false);
  const [category, setCategory] = useState<Category | "Alle">("Alle"),
    [place, setPlace] = useState(""),
    [days, setDays] = useState(0);
  const [draftCategory, setDraftCategory] = useState(category),
    [draftPlace, setDraftPlace] = useState(place),
    [draftDays, setDraftDays] = useState(days);
  const matches = state.matches.filter((m) => m.status === "suggested");
  const first = matches[0];
  const reports = state.reports.filter(
    (r) =>
      r.kind === kind &&
      r.status === "open" &&
      (category === "Alle" || r.category === category) &&
      normalize(`${r.title} ${r.description} ${r.location}`).includes(
        normalize(query),
      ) &&
      normalize(r.location).includes(normalize(place)) &&
      (!days || Date.parse(r.occurredAt) >= Date.now() - days * 86400000),
  );
  const count = Number(category !== "Alle") + Number(!!place) + Number(!!days);
  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={busy}
            onRefresh={() => void reload()}
            tintColor={colors.green}
          />
        }
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View style={{ gap: 6 }}>
            <Text style={s.eyebrow}>FINDBACK · CAMPUS</Text>
            <Text accessibilityRole="header" style={s.h1}>
              Suchen
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.mint,
              padding: 12,
              borderRadius: 18,
            }}
          >
            <Icon name="scan-outline" color={colors.green} />
          </View>
        </View>
        <Text style={[s.body, { marginTop: -10 }]}>
          Was verloren geht, kann wieder nach Hause.
        </Text>
        <View
          style={[
            s.row,
            { backgroundColor: colors.soft, borderRadius: 16, paddingLeft: 16 },
          ]}
        >
          <Icon name="search-outline" color={colors.muted} />
          <TextInput
            accessibilityLabel="Gegenstände suchen"
            placeholder="Gegenstand oder Ort suchen"
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              paddingVertical: 16,
              fontSize: 15,
              color: colors.ink,
              minWidth: 0,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter öffnen"
            onPress={() => {
              setDraftCategory(category);
              setDraftPlace(place);
              setDraftDays(days);
              setFilters(true);
            }}
            style={s.iconButton}
          >
            <Icon
              name="options-outline"
              color={count ? colors.green : colors.ink}
            />
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          {(["found", "lost"] as const).map((k) => (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: k === kind }}
              onPress={() => setKind(k)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingBottom: 14,
                borderBottomWidth: 2,
                borderColor: kind === k ? colors.ink : "transparent",
              }}
            >
              <Text
                style={[
                  s.h3,
                  { color: kind === k ? colors.ink : colors.muted },
                ]}
              >
                {k === "found" ? "Gefunden" : "Verloren"}
              </Text>
            </Pressable>
          ))}
        </View>
        {first && (
          <Pressable
            accessibilityRole="button"
            onPress={() => openMatch(first.id)}
            style={[s.note, { alignItems: "center" }]}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                backgroundColor: colors.green,
              }}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[s.h3, { fontSize: 14 }]}>
                {matches.length}{" "}
                {matches.length === 1
                  ? "möglicher Treffer"
                  : "mögliche Treffer"}
              </Text>
              <Text style={s.small}>Für deine Meldungen. Jetzt prüfen.</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.green} />
          </Pressable>
        )}
        <View>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={s.eyebrow}>
              {reports.length} {reports.length === 1 ? "MELDUNG" : "MELDUNGEN"}
            </Text>
            {count > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setCategory("Alle");
                  setPlace("");
                  setDays(0);
                }}
              >
                <Text style={{ color: colors.green, fontSize: 13 }}>
                  Filter zurücksetzen ({count})
                </Text>
              </Pressable>
            )}
          </View>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} onPress={() => openReport(r.id)} />
          ))}
          {!reports.length && (
            <Empty
              title="Noch kein passender Fund"
              detail="Passe deine Suche an oder erstelle eine eigene Meldung."
            />
          )}
        </View>
        <Text style={[s.small, { textAlign: "center" }]}>
          Gemeinsam finden wir mehr.
        </Text>
      </ScrollView>
      <Sheet visible={filters} title="Filter" onClose={() => setFilters(false)}>
        <Text style={s.label}>Kategorie</Text>
        <View style={s.chips}>
          {(["Alle", ...categories] as const).map((c) => (
            <Chip
              key={c}
              label={c}
              selected={c === draftCategory}
              onPress={() => setDraftCategory(c)}
            />
          ))}
        </View>
        <Field
          label="Ort"
          value={draftPlace}
          onChangeText={setDraftPlace}
          placeholder="z. B. Bibliothek"
        />
        <Text style={s.label}>Zeitraum</Text>
        <View style={s.chips}>
          {[1, 7, 30, 0].map((d) => (
            <Chip
              key={d}
              label={
                d ? `Letzte ${d === 1 ? "24 Stunden" : `${d} Tage`}` : "Alle"
              }
              selected={d === draftDays}
              onPress={() => setDraftDays(d)}
            />
          ))}
        </View>
        <Button
          title="Filter anwenden"
          onPress={() => {
            setCategory(draftCategory);
            setPlace(draftPlace);
            setDays(draftDays);
            setFilters(false);
          }}
        />
        <Button
          title="Zurücksetzen"
          secondary
          onPress={() => {
            setDraftCategory("Alle");
            setDraftPlace("");
            setDraftDays(0);
          }}
        />
      </Sheet>
    </>
  );
}
