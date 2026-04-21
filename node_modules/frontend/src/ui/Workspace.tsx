import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { BoardListItem, clearToken, createBoard, listBoards } from "../lib/api";
import { BoardEditor } from "./board/BoardEditor";

function useActiveBoardId() {
  const loc = useLocation();
  const match = loc.pathname.match(/^\/boards\/([^/]+)/);
  return match?.[1] || null;
}

export function Workspace() {
  const nav = useNavigate();
  const activeId = useActiveBoardId();
  const [items, setItems] = useState<BoardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listBoards();
      setItems(res.items);
    } catch (e: any) {
      setError(String(e?.message || "error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const active = useMemo(() => items.find((i) => i.id === activeId) || null, [items, activeId]);

  async function onCreate() {
    const b = await createBoard("Untitled");
    await refresh();
    nav(`/boards/${b.id}`);
  }

  function onLogout() {
    clearToken();
    nav("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Boards</h2>
          <button className="btn secondary" onClick={onLogout}>
            Logout
          </button>
        </div>

        <button className="btn" onClick={onCreate}>
          Create board
        </button>

        {loading && <div className="muted">Loading…</div>}
        {error && <div className="error">Error: {error}</div>}

        <div className="boards">
          {items.map((b) => (
            <Link
              key={b.id}
              to={`/boards/${b.id}`}
              className={`boardItem ${activeId === b.id ? "active" : ""}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="boardName">{b.name}</div>
              <div className="muted">{new Date(b.updatedAt).toLocaleDateString()}</div>
            </Link>
          ))}
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div style={{ fontWeight: 600 }}>{active?.name || "Select a board"}</div>
          <div className="muted">{active ? active.id : ""}</div>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to={items[0] ? `/boards/${items[0].id}` : "/empty"} replace />} />
          <Route path="/empty" element={<div className="center muted">Create a board to start.</div>} />
          <Route path="/boards/:id" element={<BoardRoute onSaved={refresh} />} />
        </Routes>
      </main>
    </div>
  );
}

function BoardRoute({ onSaved }: { onSaved: () => void }) {
  const { id } = useParams();
  if (!id) return <div className="center muted">No board selected.</div>;
  return <BoardEditor boardId={id} onSaved={onSaved} />;
}

