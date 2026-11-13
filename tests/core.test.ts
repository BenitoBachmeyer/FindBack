import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  demoState,
  emptyState,
  FindBackService,
  ReportInput,
  scoreMatch,
  State,
  validateReport,
  viewFor,
} from "@findback/core";
const now = Date.now();
const input: ReportInput = {
  kind: "lost",
  title: "Schwarze Regenjacke",
  description: "Schwarze Regenjacke mit rotem Reißverschluss",
  category: "Kleidung",
  location: "Bibliothek, 2. OG",
  occurredAt: new Date(now - 3600000).toISOString(),
};
test("Seed provides an explainable match and rejects category-only false positives", () => {
  const s = demoState(now);
  assert.equal(s.matches.length, 1);
  assert.ok(s.matches[0].score >= 55);
  assert.equal(s.matches[0].reasons.length, 4);
  const [a, b] = s.reports;
  assert.equal(
    scoreMatch(a, {
      ...b,
      title: "Grüne Schuhe",
      description: "Sandalen Größe vierzig",
    }),
    null,
  );
  assert.equal(scoreMatch(a, { ...b, kind: "lost" }), null);
  assert.equal(scoreMatch(a, { ...b, ownerId: a.ownerId }), null);
  assert.equal(
    scoreMatch(a, {
      ...b,
      occurredAt: new Date(now - 40 * 86400000).toISOString(),
    }),
    null,
  );
  assert.equal(scoreMatch(a, { ...b, category: "Elektronik" }), null);
});
test("Invalid and future reports are rejected, strings are trimmed", () => {
  assert.throws(() => validateReport({ ...input, title: " " }, now));
  assert.throws(() =>
    validateReport({ ...input, occurredAt: "not a date" }, now),
  );
  assert.throws(() =>
    validateReport(
      { ...input, occurredAt: new Date(now + 86400000).toISOString() },
      now,
    ),
  );
  assert.throws(() =>
    validateReport({ ...input, photo: "file:///private/photo.jpg" }, now),
  );
  assert.equal(
    validateReport({ ...input, title: "  Regenjacke  " }, now).title,
    "Regenjacke",
  );
});
test("Two-sided return lifecycle gates chat and completion", () => {
  let s = demoState(now);
  const matchId = s.matches[0].id;
  assert.throws(() =>
    applyAction(s, "alex", { type: "sendMessage", matchId, text: "Hallo" }),
  );
  s = applyAction(s, "alex", { type: "acceptMatch", matchId });
  assert.equal(s.reports[0].status, "matched");
  s = applyAction(s, "alex", {
    type: "sendMessage",
    matchId,
    text: "Ist ein roter Reißverschluss an der Jacke?",
  });
  s = applyAction(s, "mara", {
    type: "sendMessage",
    matchId,
    text: "Ja, genau.",
  });
  s = applyAction(s, "alex", {
    type: "proposeHandover",
    matchId,
    place: "Bibliothek",
    at: new Date(now + 86400000).toISOString(),
  });
  assert.throws(() =>
    applyAction(s, "alex", { type: "confirmReturn", matchId }),
  );
  s = applyAction(s, "mara", { type: "confirmHandover", matchId });
  s = applyAction(s, "alex", { type: "confirmReturn", matchId });
  assert.equal(s.matches[0].status, "accepted");
  s = applyAction(s, "alex", { type: "confirmReturn", matchId });
  assert.equal(s.handovers[0].returnedBy.length, 1);
  s = applyAction(s, "mara", { type: "confirmReturn", matchId });
  assert.equal(s.matches[0].status, "returned");
  assert.ok(
    s.reports
      .filter((r) => r.id.endsWith("jacket"))
      .every((r) => r.status === "returned"),
  );
  assert.throws(() =>
    applyAction(s, "alex", { type: "sendMessage", matchId, text: "closed" }),
  );
});
test("Rejected suggestions stay rejected after another report", () => {
  let s = demoState(now);
  const matchId = s.matches[0].id;
  s = applyAction(s, "alex", { type: "rejectMatch", matchId });
  s = applyAction(s, "alex", {
    type: "createReport",
    input: { ...input, category: "Schlüssel", title: "Schlüsselbund" },
  });
  assert.equal(
    s.matches.filter(
      (m) => m.lostId === "lost-jacket" && m.foundId === "found-jacket",
    ).length,
    1,
  );
  assert.equal(s.matches.find((m) => m.id === matchId)?.status, "rejected");
});
test("Deletion enforces ownership, cascades chats and releases surviving report", () => {
  let s = demoState(now);
  const matchId = s.matches[0].id;
  assert.throws(() =>
    applyAction(s, "alex", { type: "deleteReport", reportId: "found-jacket" }),
  );
  s = applyAction(s, "alex", { type: "acceptMatch", matchId });
  s = applyAction(s, "alex", { type: "sendMessage", matchId, text: "Hallo" });
  s = applyAction(s, "alex", { type: "eraseMyData" });
  assert.equal(s.matches.length, 0);
  assert.equal(s.messages.length, 0);
  assert.equal(s.reports.find((r) => r.id === "found-jacket")?.status, "open");
  assert.equal(viewFor(demoState(now), "stranger").matches.length, 0);
});
test("Competing matches cannot book the same object twice", () => {
  let s = demoState(now);
  s = applyAction(s, "alex", { type: "createReport", input });
  assert.equal(s.matches.length, 2);
  s = applyAction(s, "alex", { type: "acceptMatch", matchId: s.matches[0].id });
  assert.equal(s.matches[1].status, "rejected");
  assert.throws(() =>
    applyAction(s, "alex", { type: "acceptMatch", matchId: s.matches[1].id }),
  );
});
test("Service serializes concurrent writes and returns persistence failures", async () => {
  let persisted: State | null = emptyState();
  const repository = {
    load: async () => persisted,
    save: async (s: State) => {
      await new Promise((r) => setTimeout(r, 5));
      persisted = s;
    },
  };
  const service = new FindBackService(repository);
  await Promise.all([
    service.dispatch("alex", { type: "createReport", input }),
    service.dispatch("mara", {
      type: "createReport",
      input: { ...input, kind: "found" },
    }),
  ]);
  const s = await service.snapshot("alex");
  assert.equal(s.reports.length, 2);
  assert.equal(s.matches.length, 1);
  const failing = new FindBackService({
    load: async () => s,
    save: async () => {
      throw new Error("disk full");
    },
  });
  await assert.rejects(
    failing.dispatch("alex", { type: "createReport", input }),
    /disk full/,
  );
});
