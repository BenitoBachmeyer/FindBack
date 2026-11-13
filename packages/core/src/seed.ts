import { emptyState, Report, State } from "./model";
import { refreshMatches } from "./service";
export function demoState(now = Date.now()): State {
  const state = emptyState();
  const base = {
    createdAt: new Date(now - 3600000).toISOString(),
    status: "open" as const,
  };
  state.reports = [
    {
      ...base,
      id: "lost-jacket",
      ownerId: "alex",
      kind: "lost",
      title: "Schwarze Regenjacke",
      description:
        "Schwarze Regenjacke mit rotem Reißverschluss. Am Fensterplatz im Lesesaal liegen gelassen.",
      category: "Kleidung",
      location: "Bibliothek, 2. OG",
      occurredAt: new Date(now - 3 * 3600000).toISOString(),
    },
    {
      ...base,
      id: "found-jacket",
      ownerId: "mara",
      kind: "found",
      title: "Schwarze Regenjacke",
      description:
        "Schwarze Regenjacke mit rotem Reißverschluss, lag am Fensterplatz im Lesesaal.",
      category: "Kleidung",
      location: "Bibliothek, 2. OG",
      occurredAt: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      ...base,
      id: "found-card",
      ownerId: "mara",
      kind: "found",
      title: "Studierendenausweis",
      description:
        "Ein Studierendenausweis in einer transparenten Hülle. Bitte den Namen bei der Übergabe nennen.",
      category: "Dokumente",
      location: "Hörsaal B 1.01",
      occurredAt: new Date(now - 86400000).toISOString(),
    },
    {
      ...base,
      id: "found-headphones",
      ownerId: "mara",
      kind: "found",
      title: "Kopfhörer, weiß",
      description:
        "Weiße kabellose Kopfhörer in einer weißen Ladebox auf einem Tisch gefunden.",
      category: "Elektronik",
      location: "Mensa",
      occurredAt: new Date(now - 2 * 86400000).toISOString(),
    },
  ] as Report[];
  refreshMatches(state);
  return state;
}
