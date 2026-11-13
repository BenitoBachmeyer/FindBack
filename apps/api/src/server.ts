import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import {
  Action,
  demoState,
  DomainError,
  FindBackService,
} from "@findback/core";
import { SqliteRepository } from "./repository";
export function createApi(
  repository: SqliteRepository,
  token: string,
  allowedOrigin = "http://localhost:8081",
) {
  const service = new FindBackService(repository, demoState);
  return createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (req.headers.origin === allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Demo-Actor",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    const reply = (code: number, body: unknown) => {
      res.statusCode = code;
      res.end(JSON.stringify(body));
    };
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.url === "/health" && req.method === "GET") {
      reply(200, { status: "ok", mode: "demo" });
      return;
    }
    const supplied = Buffer.from(req.headers.authorization || ""),
      expected = Buffer.from(`Bearer ${token}`);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      reply(401, { error: "Demo-Zugangsschlüssel fehlt oder ist ungültig." });
      return;
    }
    const actor = req.headers["x-demo-actor"];
    if (actor !== "alex" && actor !== "mara") {
      reply(400, { error: "Ungültiges Demo-Profil." });
      return;
    }
    try {
      if (req.url === "/v1/state" && req.method === "GET") {
        reply(200, await service.snapshot(actor));
        return;
      }
      if (req.url === "/v1/actions" && req.method === "POST") {
        let body = "",
          size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > 2200000) {
            reply(413, { error: "Anfrage ist zu groß." });
            return;
          }
          body += chunk;
        }
        let action: Action;
        try {
          action = JSON.parse(body);
        } catch {
          reply(400, { error: "Ungültiges JSON." });
          return;
        }
        reply(200, await service.dispatch(actor, action));
        return;
      }
      reply(404, { error: "Endpunkt nicht gefunden." });
    } catch (error) {
      reply(error instanceof DomainError ? 400 : 500, {
        error:
          error instanceof DomainError
            ? error.message
            : "Speichern fehlgeschlagen. Bitte erneut versuchen.",
      });
    }
  });
}
