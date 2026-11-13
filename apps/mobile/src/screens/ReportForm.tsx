import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { categories, Category, ReportKind } from "@findback/core";
import { Button, Chip, Field, Note, s } from "../components/ui";
import { useStore } from "../store";
export const localDateTime = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
export const parseDateTime = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, y, m, d, h, min] = match.map(Number);
  const date = new Date(y, m - 1, d, h, min);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d &&
    date.getHours() === h &&
    date.getMinutes() === min
    ? date.getTime()
    : NaN;
};
export function ReportForm({
  kind,
  onDone,
}: {
  kind: ReportKind;
  onDone: () => void;
}) {
  const { run, busy } = useStore();
  const [step, setStep] = useState(1),
    [category, setCategory] = useState<Category>("Kleidung"),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [location, setLocation] = useState(""),
    [occurredAt, setOccurredAt] = useState(localDateTime()),
    [photo, setPhoto] = useState<string>(),
    [error, setError] = useState(""),
    [photoBusy, setPhotoBusy] = useState(false);
  const choosePhoto = async () => {
    setPhotoBusy(true);
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        exif: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const resized = await manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width, 1000) } }],
        { compress: 0.65, format: SaveFormat.JPEG, base64: true },
      );
      const data = `data:image/jpeg;base64,${resized.base64}`;
      if (data.length > 2000000)
        throw new Error(
          "Das Foto ist zu groß. Bitte ein kleineres Bild wählen.",
        );
      setPhoto(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Foto konnte nicht geladen werden.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };
  const next = () => {
    if (title.trim().length < 3 || description.trim().length < 10) {
      setError(
        "Bitte einen Titel mit mindestens 3 und eine Beschreibung mit mindestens 10 Zeichen eingeben.",
      );
      return;
    }
    setError("");
    setStep(2);
  };
  const submit = async () => {
    const time = parseDateTime(occurredAt);
    if (!Number.isFinite(time)) {
      setError("Bitte Datum und Uhrzeit im Format JJJJ-MM-TT HH:MM eingeben.");
      return;
    }
    setError("");
    if (
      await run({
        type: "createReport",
        input: {
          kind,
          category,
          title,
          description,
          location,
          occurredAt: new Date(time).toISOString(),
          photo,
        },
      })
    )
      onDone();
  };
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.content}
    >
      <Text style={s.eyebrow}>MELDUNG · SCHRITT {step} VON 2</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2].map((n) => (
          <View
            key={n}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 4,
              backgroundColor: n <= step ? "#087F68" : "#E5E9E8",
            }}
          />
        ))}
      </View>
      <Text style={s.h1}>
        {step === 1
          ? `Was hast du ${kind === "lost" ? "verloren" : "gefunden"}?`
          : "Wo und wann?"}
      </Text>
      <Text style={s.body}>
        {step === 1
          ? "Je genauer du den Gegenstand beschreibst, desto besser können wir passende Meldungen finden."
          : "Gib den Ort und Zeitpunkt so genau wie möglich an."}
      </Text>
      {step === 1 ? (
        <>
          <Text style={s.label}>Kategorie</Text>
          <View style={s.chips}>
            {categories.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
          <Field
            label="Titel"
            placeholder="z. B. Schwarze Regenjacke"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Field
            label="Beschreibung"
            placeholder="Farbe, Marke, besondere Merkmale …"
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={1500}
          />
          {photo && (
            <Image
              source={{ uri: photo }}
              style={{ width: "100%", height: 180, borderRadius: 16 }}
            />
          )}
          <Button
            title={
              photoBusy
                ? "Foto wird vorbereitet …"
                : photo
                  ? "Foto ändern"
                  : "Foto hinzufügen · optional"
            }
            icon="image-outline"
            secondary
            disabled={photoBusy}
            onPress={() => void choosePhoto()}
          />
          {photo && (
            <Button
              title="Foto entfernen"
              secondary
              onPress={() => setPhoto(undefined)}
            />
          )}
          <Note>
            Bitte keine Gesichter, Ausweisnummern oder persönlichen Kontaktdaten
            zeigen. Bilder werden nicht automatisch analysiert.
          </Note>
          <Button title="Weiter" onPress={next} disabled={photoBusy} />
        </>
      ) : (
        <>
          <Field
            label={kind === "lost" ? "Verlustort" : "Fundort"}
            placeholder="z. B. Bibliothek, 2. OG"
            value={location}
            onChangeText={setLocation}
            maxLength={120}
          />
          <Note>
            Nur deine Eingabe: FindBack ortet dich nicht im Hintergrund.
          </Note>
          <Field
            label="Zeitpunkt (JJJJ-MM-TT HH:MM)"
            placeholder="2026-11-13 14:30"
            value={occurredAt}
            onChangeText={setOccurredAt}
            autoCapitalize="none"
          />
          <Button
            title={
              busy
                ? "Wird gespeichert …"
                : `${kind === "lost" ? "Verlust" : "Fund"}meldung absenden`
            }
            onPress={() => void submit()}
            disabled={busy}
          />
          <Button
            title="Zurück zu den Angaben"
            secondary
            onPress={() => setStep(1)}
          />
          <Text style={s.small}>
            Deine Meldung wird gespeichert und automatisch mit passenden
            Gegenmeldungen abgeglichen.
          </Text>
        </>
      )}
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </ScrollView>
  );
}
