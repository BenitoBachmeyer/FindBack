import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category, Report } from "@findback/core";
export const colors = {
  ink: "#182527",
  muted: "#6C7778",
  line: "#E5E9E8",
  soft: "#F3F5F4",
  green: "#087F68",
  mint: "#E8F6F0",
  white: "#FFFFFF",
  red: "#AB3434",
};
export function Icon({
  name,
  size = 22,
  color = colors.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={20}
          color={secondary ? colors.ink : colors.white}
        />
      )}
      <Text style={[s.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        s.chip,
        selected && { backgroundColor: colors.ink, borderColor: colors.ink },
      ]}
    >
      <Text
        style={{
          color: selected ? "white" : colors.ink,
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#899391"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 112, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.note}>
      <Icon name="information-circle-outline" size={20} color={colors.green} />
      <Text style={[s.body, { flex: 1, fontSize: 13 }]}>{children}</Text>
    </View>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
      <Icon name="search-outline" size={38} color={colors.muted} />
      <Text style={s.h3}>{title}</Text>
      <Text style={[s.body, { textAlign: "center" }]}>{detail}</Text>
    </View>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable
          accessibilityLabel="Schließen"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.row}>
            <Text accessibilityRole="header" style={[s.h2, { flex: 1 }]}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={onClose}
              style={s.iconButton}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 20, paddingBottom: 30 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const categoryIcons: Record<
  Category,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  Kleidung: "shirt-outline",
  Taschen: "bag-handle-outline",
  Elektronik: "headset-outline",
  Dokumente: "card-outline",
  Schlüssel: "key-outline",
  Sonstiges: "cube-outline",
};
export function ItemImage({
  report,
  large = false,
}: {
  report: Report;
  large?: boolean;
}) {
  return (
    <View
      style={[
        s.thumb,
        large && { width: "100%", height: 200, borderRadius: 20 },
      ]}
    >
      {report.photo ? (
        <Image
          source={{ uri: report.photo }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: large ? 20 : 16,
          }}
        />
      ) : (
        <Icon
          name={categoryIcons[report.category]}
          size={large ? 70 : 28}
          color={colors.muted}
        />
      )}
    </View>
  );
}
export const dateLabel = (date: string) =>
  new Date(date).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export function ReportRow({
  report,
  onPress,
}: {
  report: Report;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.reportRow}>
      <ItemImage report={report} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.h3}>{report.title}</Text>
        <Text style={s.small}>
          {report.category} · {report.location}
        </Text>
        <Text style={s.small}>
          {dateLabel(report.occurredAt)}
          {report.status === "returned"
            ? " · Zurückgegeben"
            : report.status === "matched"
              ? " · In Übergabe"
              : ""}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <ActivityIndicator color={colors.green} />
      <Text style={s.body}>FindBack wird geladen …</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingBottom: 32, gap: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  h1: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1.1,
    color: colors.ink,
  },
  h2: {
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.ink,
  },
  h3: { fontSize: 16, fontWeight: "600", color: colors.ink },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  small: { fontSize: 13, lineHeight: 19, color: colors.muted },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  input: {
    backgroundColor: colors.soft,
    borderRadius: 13,
    padding: 15,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 50,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.green,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 15 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: {
    backgroundColor: colors.mint,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  reportRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#11252166",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    maxHeight: "90%",
    width: "100%",
    maxWidth: 580,
    gap: 18,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.line,
    alignSelf: "center",
  },
  divider: { height: 1, backgroundColor: colors.line },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: colors.green,
  },
  error: {
    backgroundColor: "#FFF0EF",
    padding: 14,
    borderRadius: 12,
    color: colors.red,
    lineHeight: 21,
  },
});
