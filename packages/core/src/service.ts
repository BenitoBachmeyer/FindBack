import {
  Action,
  categories,
  emptyState,
  Gateway,
  Match,
  ReportInput,
  Repository,
  State,
} from "./model";
import { scoreMatch } from "./matching";
export class DomainError extends Error {}
const requireThat: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new DomainError(message);
};
const str = (
  value: unknown,
  min: number,
  max: number,
  label: string,
): string => {
  requireThat(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${label}: Bitte ${min} bis ${max} Zeichen eingeben.`,
  );
  return value.trim();
};
const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export function validateReport(
  input: ReportInput,
  now = Date.now(),
): ReportInput {
  requireThat(input && typeof input === "object", "Ungültige Meldung.");
  requireThat(
    input.kind === "lost" || input.kind === "found",
    "Bitte Verlust oder Fund wählen.",
  );
  requireThat(
    categories.includes(input.category),
    "Bitte eine Kategorie wählen.",
  );
  const time = Date.parse(input.occurredAt);
  requireThat(
    Number.isFinite(time) && time <= now + 5 * 60000,
    "Bitte einen gültigen Zeitpunkt in der Vergangenheit angeben.",
  );
  requireThat(
    !input.photo ||
      (typeof input.photo === "string" &&
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
          input.photo,
        ) &&
        input.photo.length <= 2000000),
    "Bitte ein JPEG-, PNG- oder WebP-Foto unter 1,5 MB auswählen.",
  );
  return {
    kind: input.kind,
    category: input.category,
    title: str(input.title, 3, 80, "Titel"),
    description: str(input.description, 10, 1500, "Beschreibung"),
    location: str(input.location, 2, 120, "Ort"),
    occurredAt: new Date(time).toISOString(),
    ...(input.photo ? { photo: input.photo } : {}),
  };
}
export function refreshMatches(state: State) {
  const lost = state.reports.filter(
    (r) => r.kind === "lost" && r.status === "open",
  );
  const found = state.reports.filter(
    (r) => r.kind === "found" && r.status === "open",
  );
  for (const a of lost)
    for (const b of found) {
      if (state.matches.some((m) => m.lostId === a.id && m.foundId === b.id))
        continue;
      const scored = scoreMatch(a, b);
      if (scored)
        state.matches.push({
          id: id(),
          lostId: a.id,
          foundId: b.id,
          ...scored,
          status: "suggested",
          readBy: [],
        });
    }
}
const participant = (state: State, match: Match, actor: string) =>
  state.reports.some(
    (r) =>
      (r.id === match.lostId || r.id === match.foundId) && r.ownerId === actor,
  );
function removeReports(state: State, ids: string[]) {
  const matches = state.matches
    .filter((m) => ids.includes(m.lostId) || ids.includes(m.foundId))
    .map((m) => m.id);
  state.reports = state.reports.filter((r) => !ids.includes(r.id));
  state.matches = state.matches.filter((m) => !matches.includes(m.id));
  state.messages = state.messages.filter((m) => !matches.includes(m.matchId));
  state.handovers = state.handovers.filter((h) => !matches.includes(h.matchId));
  for (const r of state.reports)
    if (
      r.status === "matched" &&
      !state.matches.some(
        (m) =>
          m.status === "accepted" && (m.lostId === r.id || m.foundId === r.id),
      )
    )
      r.status = "open";
}
export function applyAction(
  original: State,
  actor: string,
  action: Action,
  now = Date.now(),
): State {
  requireThat(
    actor === "alex" || actor === "mara",
    "Bitte ein Demo-Profil auswählen.",
  );
  requireThat(action && typeof action === "object", "Ungültige Aktion.");
  const state = JSON.parse(JSON.stringify(original)) as State;
  if (action.type === "createReport") {
    const input = validateReport(action.input, now);
    state.reports.unshift({
      ...input,
      id: id(),
      ownerId: actor,
      createdAt: new Date(now).toISOString(),
      status: "open",
    });
    refreshMatches(state);
    return state;
  }
  if (action.type === "eraseMyData") {
    removeReports(
      state,
      state.reports.filter((r) => r.ownerId === actor).map((r) => r.id),
    );
    state.messages = state.messages.filter((m) => m.senderId !== actor);
    return state;
  }
  if (action.type === "deleteReport") {
    const r = state.reports.find((r) => r.id === action.reportId);
    requireThat(
      r?.ownerId === actor,
      "Du kannst nur eigene Meldungen löschen.",
    );
    removeReports(state, [r.id]);
    return state;
  }
  requireThat("matchId" in action, "Unbekannte Aktion.");
  const match = state.matches.find((m) => m.id === action.matchId);
  requireThat(
    match && participant(state, match, actor),
    "Dieser Treffer ist nicht für dich verfügbar.",
  );
  if (action.type === "readMatch") {
    if (!match.readBy.includes(actor)) match.readBy.push(actor);
    return state;
  }
  if (action.type === "acceptMatch") {
    if (match.status === "accepted") return state;
    requireThat(
      match.status === "suggested",
      "Dieser Vorschlag ist nicht mehr offen.",
    );
    const pair = state.reports.filter(
      (r) => r.id === match.lostId || r.id === match.foundId,
    );
    requireThat(
      pair.length === 2 && pair.every((r) => r.status === "open"),
      "Eine Meldung ist bereits zugeordnet.",
    );
    match.status = "accepted";
    match.readBy = [actor];
    pair.forEach((r) => (r.status = "matched"));
    // A report can only participate in one active handover.
    state.matches.forEach((m) => {
      if (
        m.id !== match.id &&
        m.status === "suggested" &&
        (m.lostId === match.lostId || m.foundId === match.foundId)
      )
        m.status = "rejected";
    });
    return state;
  }
  if (action.type === "rejectMatch") {
    requireThat(
      match.status === "suggested",
      "Nur offene Vorschläge können abgelehnt werden.",
    );
    match.status = "rejected";
    return state;
  }
  requireThat(
    match.status === "accepted",
    "Bitte zuerst den Treffer bestätigen.",
  );
  if (action.type === "sendMessage") {
    state.messages.push({
      id: id(),
      matchId: match.id,
      senderId: actor,
      text: str(action.text, 1, 2000, "Nachricht"),
      createdAt: new Date(now).toISOString(),
    });
    return state;
  }
  if (action.type === "proposeHandover") {
    const at = Date.parse(action.at);
    requireThat(
      Number.isFinite(at) && at > now,
      "Der Übergabetermin muss in der Zukunft liegen.",
    );
    const existing = state.handovers.find((h) => h.matchId === match.id);
    requireThat(
      !existing?.returnedBy.length,
      "Die Rückgabe wurde bereits begonnen.",
    );
    state.handovers = state.handovers.filter((h) => h.matchId !== match.id);
    state.handovers.push({
      matchId: match.id,
      proposedBy: actor,
      place: str(action.place, 2, 120, "Treffpunkt"),
      at: new Date(at).toISOString(),
      confirmedBy: [actor],
      returnedBy: [],
    });
    return state;
  }
  const handover = state.handovers.find((h) => h.matchId === match.id);
  requireThat(handover, "Bitte zuerst eine Übergabe vereinbaren.");
  if (action.type === "confirmHandover") {
    if (!handover.confirmedBy.includes(actor)) handover.confirmedBy.push(actor);
    return state;
  }
  if (action.type === "confirmReturn") {
    requireThat(
      handover.confirmedBy.length === 2,
      "Beide Personen müssen den Übergabetermin bestätigen.",
    );
    if (!handover.returnedBy.includes(actor)) handover.returnedBy.push(actor);
    if (handover.returnedBy.length === 2) {
      match.status = "returned";
      state.reports
        .filter((r) => r.id === match.lostId || r.id === match.foundId)
        .forEach((r) => (r.status = "returned"));
    }
    return state;
  }
  throw new DomainError("Unbekannte Aktion.");
}
export function viewFor(state: State, actor: string): State {
  const matches = state.matches.filter((m) => participant(state, m, actor));
  const chatIds = matches
    .filter((m) => m.status === "accepted" || m.status === "returned")
    .map((m) => m.id);
  return {
    ...state,
    matches,
    messages: state.messages.filter((m) => chatIds.includes(m.matchId)),
    handovers: state.handovers.filter((h) => chatIds.includes(h.matchId)),
  };
}
export class FindBackService implements Gateway {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private repository: Repository,
    private seed: () => State = emptyState,
  ) {}
  private async load() {
    let state = await this.repository.load();
    if (!state) {
      state = this.seed();
      await this.repository.save(state);
    }
    return state;
  }
  async snapshot(actor: string) {
    await this.queue;
    return viewFor(await this.load(), actor);
  }
  dispatch(actor: string, action: Action): Promise<State> {
    const result = this.queue.then(async () => {
      const next = applyAction(await this.load(), actor, action);
      await this.repository.save(next);
      return viewFor(next, actor);
    });
    this.queue = result.catch(() => {});
    return result;
  }
}
