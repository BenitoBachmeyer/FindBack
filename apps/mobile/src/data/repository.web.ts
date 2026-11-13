import { Repository } from "@findback/core";
// The optional browser preview uses localStorage. Android/iOS use SQLite.
export async function createRepository(): Promise<Repository> {
  return {
    async load() {
      const value = localStorage.getItem("findback-state-v1");
      return value ? JSON.parse(value) : null;
    },
    async save(state) {
      localStorage.setItem("findback-state-v1", JSON.stringify(state));
    },
  };
}
