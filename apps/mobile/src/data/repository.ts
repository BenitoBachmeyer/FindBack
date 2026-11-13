import * as SQLite from "expo-sqlite";
import { Repository, State } from "@findback/core";
export async function createRepository(): Promise<Repository> {
  const db = await SQLite.openDatabaseAsync("findback.db");
  await db.execAsync(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, json TEXT NOT NULL); PRAGMA user_version=1;",
  );
  return {
    async load() {
      const row = await db.getFirstAsync<{ json: string }>(
        "SELECT json FROM app_state WHERE id=1",
      );
      return row ? JSON.parse(row.json) : null;
    },
    async save(state: State) {
      await db.runAsync(
        "INSERT INTO app_state (id,version,json) VALUES (1,1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
        JSON.stringify(state),
      );
    },
  };
}
