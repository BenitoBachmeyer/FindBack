import { DatabaseSync } from "node:sqlite";
import { Repository, State } from "@findback/core";
/** Small prototype repository. The atomic snapshot keeps match/return transitions consistent. */
export class SqliteRepository implements Repository {
  readonly db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL, json TEXT NOT NULL); PRAGMA user_version=1;",
    );
  }
  async load(): Promise<State | null> {
    const row = this.db
      .prepare("SELECT json FROM app_state WHERE id=1")
      .get() as { json: string } | undefined;
    return row ? JSON.parse(row.json) : null;
  }
  async save(state: State) {
    this.db
      .prepare(
        "INSERT INTO app_state (id,version,json) VALUES (1,1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
      )
      .run(JSON.stringify(state));
  }
  close() {
    this.db.close();
  }
}
