import React, { useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, type ExcalidrawImperativeAPI } from "@excalidraw/excalidraw";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getBoard, saveBoard } from "../../lib/api";

type Scene = {
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
};

const EMPTY_SCENE: Scene = { elements: [], appState: {}, files: {} };

function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}

export function BoardEditor({ boardId, onSaved }: { boardId: string; onSaved: () => void }) {
  const [initialData, setInitialData] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  const wsBase = (import.meta.env.VITE_WS_BASE_URL || "ws://localhost/room").replace(/\/$/, "");

  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const suppressLocalWriteRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setInitialData(null);
    setError(null);

    (async () => {
      try {
        const b = await getBoard(boardId);
        if (cancelled) return;
        const data = normalizeScene(b.data);
        setInitialData(data);
      } catch (e: any) {
        if (cancelled) return;
        setError(String(e?.message || "error"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  // Setup Yjs provider per board
  useEffect(() => {
    if (!boardId) return;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(wsBase, boardId, ydoc, {
      connect: true,
    });
    const ytext = ydoc.getText("scene");

    ydocRef.current = ydoc;
    ytextRef.current = ytext;
    providerRef.current = provider;

    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
      providerRef.current = null;
    };
  }, [boardId, wsBase]);

  // Apply remote updates into Excalidraw
  useEffect(() => {
    const api = excalidrawAPI;
    const ytext = ytextRef.current;
    const ydoc = ydocRef.current;
    if (!api || !ytext || !ydoc) return;

    const onUpdate = () => {
      // Avoid pushing remote changes back immediately as "local" writes.
      suppressLocalWriteRef.current = true;
      try {
        const txt = ytext.toString();
        if (!txt) return;
        const scene = normalizeScene(JSON.parse(txt));
        api.updateScene(scene as any);
      } catch {
        // ignore malformed updates
      } finally {
        window.setTimeout(() => {
          suppressLocalWriteRef.current = false;
        }, 0);
      }
    };

    ytext.observe(onUpdate);
    return () => ytext.unobserve(onUpdate);
  }, [excalidrawAPI, boardId]);

  // Seed Yjs doc once we have initial data
  useEffect(() => {
    const ytext = ytextRef.current;
    if (!ytext || !initialData) return;
    if (ytext.length > 0) return; // already seeded by someone else

    ytext.insert(0, JSON.stringify(initialData));
  }, [initialData]);

  const saveDebounced = useMemo(
    () =>
      debounce(async (scene: Scene) => {
        try {
          await saveBoard(boardId, scene);
          onSaved();
        } catch {
          // ignore autosave errors for now
        }
      }, 1200),
    [boardId, onSaved],
  );

  if (error) return <div className="center error">Error: {error}</div>;
  if (!initialData) return <div className="center muted">Loading board…</div>;

  return (
    <div style={{ flex: 1 }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData as any}
        onChange={(elements, appState, files) => {
          const scene: Scene = { elements: elements as any, appState: appState as any, files: files as any };

          if (!suppressLocalWriteRef.current) {
            const ytext = ytextRef.current;
            if (ytext) {
              const next = JSON.stringify(scene);
              // Write entire scene as a Y.Text value (simple but effective for MVP)
              ytext.delete(0, ytext.length);
              ytext.insert(0, next);
            }
          }

          saveDebounced(scene);
        }}
      />
    </div>
  );
}

function normalizeScene(data: any): Scene {
  if (!data || typeof data !== "object") return EMPTY_SCENE;
  return {
    elements: Array.isArray(data.elements) ? data.elements : [],
    appState: data.appState && typeof data.appState === "object" ? data.appState : {},
    files: data.files && typeof data.files === "object" ? data.files : {},
  };
}

