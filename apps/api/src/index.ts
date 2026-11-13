import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SqliteRepository } from "./repository";
import { createApi } from "./server";
const token = process.env.FINDBACK_DEMO_TOKEN;
if (!token || token.length < 16)
  throw new Error(
    "FINDBACK_DEMO_TOKEN mit mindestens 16 Zeichen setzen. Nur für Demo-Netzwerke verwenden.",
  );
const path = resolve(process.env.FINDBACK_DB || "data/findback.db");
mkdirSync(dirname(path), { recursive: true });
const repo = new SqliteRepository(path);
const server = createApi(repo, token, process.env.FINDBACK_WEB_ORIGIN);
server.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `FindBack Demo API: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3001}`,
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      repo.close();
      process.exit(0);
    }),
  );
