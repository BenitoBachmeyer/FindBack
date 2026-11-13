import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import { SqliteRepository } from "../apps/api/src/repository";
import { createApi } from "../apps/api/src/server";
const token = "findback-test-secret-123";
test("API authentication, validation, persistence across restart and chat lifecycle", async () => {
  const dir = mkdtempSync(join(tmpdir(), "findback-"));
  const path = join(dir, "test.db");
  let repo = new SqliteRepository(path);
  const server = createApi(repo, token);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request = (url: string, body?: unknown, actor = "alex") =>
    fetch(base + url, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Demo-Actor": actor,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    assert.equal((await fetch(base + "/v1/state")).status, 401);
    assert.equal(
      (await request("/v1/state", undefined, "stranger")).status,
      400,
    );
    let s = await (await request("/v1/state")).json();
    const matchId = s.matches[0].id;
    assert.equal(
      (
        await request("/v1/actions", {
          type: "sendMessage",
          matchId,
          text: "blocked",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/v1/actions", {
          type: "createReport",
          input: { title: "bad" },
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("/v1/actions", { type: "acceptMatch", matchId })).status,
      200,
    );
    assert.equal(
      (
        await request("/v1/actions", {
          type: "sendMessage",
          matchId,
          text: "Hallo Mara",
        })
      ).status,
      200,
    );
    s = await (await request("/v1/state", undefined, "mara")).json();
    assert.equal(s.messages[0].text, "Hallo Mara");
    assert.equal(
      (
        await request("/v1/actions", {
          type: "proposeHandover",
          matchId,
          place: "Bibliothek",
          at: new Date(Date.now() + 86400000).toISOString(),
        })
      ).status,
      200,
    );
    await request("/v1/actions", { type: "confirmHandover", matchId }, "mara");
    await request("/v1/actions", { type: "confirmReturn", matchId });
    s = await (
      await request("/v1/actions", { type: "confirmReturn", matchId }, "mara")
    ).json();
    assert.equal(s.matches[0].status, "returned");
    repo.close();
    repo = new SqliteRepository(path);
    const stored = await repo.load();
    assert.equal(stored?.matches[0].status, "returned");
    assert.equal(stored?.messages.length, 1);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
