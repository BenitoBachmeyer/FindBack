export const categories = [
  "Kleidung",
  "Taschen",
  "Elektronik",
  "Dokumente",
  "Schlüssel",
  "Sonstiges",
] as const;
export type Category = (typeof categories)[number];
export type ReportKind = "lost" | "found";
export type ReportStatus = "open" | "matched" | "returned";
export interface Report {
  id: string;
  ownerId: string;
  kind: ReportKind;
  title: string;
  description: string;
  category: Category;
  location: string;
  occurredAt: string;
  createdAt: string;
  photo?: string;
  status: ReportStatus;
}
export type ReportInput = Pick<
  Report,
  | "kind"
  | "title"
  | "description"
  | "category"
  | "location"
  | "occurredAt"
  | "photo"
>;
export interface Match {
  id: string;
  lostId: string;
  foundId: string;
  score: number;
  reasons: string[];
  status: "suggested" | "accepted" | "rejected" | "returned";
  readBy: string[];
}
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
export interface Handover {
  matchId: string;
  proposedBy: string;
  place: string;
  at: string;
  confirmedBy: string[];
  returnedBy: string[];
}
export interface State {
  version: 1;
  reports: Report[];
  matches: Match[];
  messages: Message[];
  handovers: Handover[];
}
export type Action =
  | { type: "createReport"; input: ReportInput }
  | { type: "deleteReport"; reportId: string }
  | { type: "acceptMatch" | "rejectMatch" | "readMatch"; matchId: string }
  | { type: "sendMessage"; matchId: string; text: string }
  | { type: "proposeHandover"; matchId: string; place: string; at: string }
  | { type: "confirmHandover" | "confirmReturn"; matchId: string }
  | { type: "eraseMyData" };
export interface Repository {
  load(): Promise<State | null>;
  save(state: State): Promise<void>;
}
export interface Gateway {
  snapshot(actor: string): Promise<State>;
  dispatch(actor: string, action: Action): Promise<State>;
}
export const profiles = [
  { id: "alex", name: "Alex", role: "Sucht eine Regenjacke" },
  { id: "mara", name: "Mara", role: "Hat eine Regenjacke gefunden" },
];
export const emptyState = (): State => ({
  version: 1,
  reports: [],
  matches: [],
  messages: [],
  handovers: [],
});
