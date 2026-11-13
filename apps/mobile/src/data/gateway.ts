import {
  Action,
  demoState,
  FindBackService,
  Gateway,
  State,
} from "@findback/core";
import { createRepository } from "./repository";
export const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
export async function createGateway(): Promise<Gateway> {
  if (!apiUrl) return new FindBackService(await createRepository(), demoState);
  const request = async (actor: string, action?: Action): Promise<State> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(
        `${apiUrl}/v1/${action ? "actions" : "state"}`,
        {
          method: action ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Demo-Actor": actor,
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_DEMO_TOKEN || ""}`,
          },
          ...(action ? { body: JSON.stringify(action) } : {}),
          signal: controller.signal,
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Server nicht erreichbar.");
      return body;
    } finally {
      clearTimeout(timeout);
    }
  };
  return {
    snapshot: (actor) => request(actor),
    dispatch: (actor, action) => request(actor, action),
  };
}
