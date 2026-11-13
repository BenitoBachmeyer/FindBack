import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Action, emptyState, Gateway, State } from "@findback/core";
import { createGateway } from "./data/gateway";
interface Store {
  state: State;
  actor: string;
  setActor: (actor: string) => Promise<void>;
  ready: boolean;
  busy: boolean;
  error: string;
  clearError: () => void;
  reload: () => Promise<void>;
  run: (action: Action) => Promise<boolean>;
}
const Context = createContext<Store>(null!);
export function Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(emptyState),
    [actor, setActorState] = useState("alex"),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const gateway = useRef<Gateway | null>(null),
    activeActor = useRef("alex"),
    locked = useRef(false);
  const fail = (e: unknown) =>
    setError(
      e instanceof Error
        ? e.message
        : "Das hat nicht funktioniert. Bitte erneut versuchen.",
    );
  const reload = async () => {
    try {
      if (!gateway.current) gateway.current = await createGateway();
      const a = activeActor.current;
      const value = await gateway.current.snapshot(a);
      if (a === activeActor.current) setState(value);
      setReady(true);
      setError("");
    } catch (e) {
      fail(e);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const setActor = async (next: string) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const value = await gateway.current!.snapshot(next);
      activeActor.current = next;
      setActorState(next);
      setState(value);
    } catch (e) {
      fail(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const run = async (action: Action) => {
    if (locked.current || !gateway.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await gateway.current.dispatch(activeActor.current, action);
      setState(value);
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <Context.Provider
      value={{
        state,
        actor,
        setActor,
        ready,
        busy,
        error,
        clearError: () => setError(""),
        reload,
        run,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
