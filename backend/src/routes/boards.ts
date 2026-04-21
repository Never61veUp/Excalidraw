import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import type { AuthedRequest } from "../middleware/authRequired";

export const boardsRouter = Router();

const excalidrawDataSchema = z.object({
  elements: z.array(z.any()).default([]),
  appState: z.record(z.any()).default({}),
  files: z.record(z.any()).default({}),
});

boardsRouter.post("/", async (req: AuthedRequest, res) => {
  const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : "Untitled";
  const data = excalidrawDataSchema.safeParse(req.body?.data ?? { elements: [], appState: {}, files: {} });
  if (!data.success) return res.status(400).json({ error: "invalid_data" });

  const ownerId = req.user!.id;
  const result = await pool.query(
    "INSERT INTO boards (owner_id, name, data) VALUES ($1, $2, $3) RETURNING id, name, data, created_at, updated_at",
    [ownerId, name, data.data],
  );
  return res.status(201).json(mapBoard(result.rows[0]));
});

boardsRouter.get("/", async (req: AuthedRequest, res) => {
  const ownerId = req.user!.id;
  const result = await pool.query(
    "SELECT id, name, created_at, updated_at FROM boards WHERE owner_id=$1 ORDER BY updated_at DESC",
    [ownerId],
  );
  return res.json({
    items: result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

boardsRouter.get("/:id", async (req: AuthedRequest, res) => {
  const ownerId = req.user!.id;
  const id = req.params.id;
  const result = await pool.query(
    "SELECT id, name, data, created_at, updated_at FROM boards WHERE id=$1 AND owner_id=$2",
    [id, ownerId],
  );
  if (!result.rowCount) return res.status(404).json({ error: "not_found" });
  return res.json(mapBoard(result.rows[0]));
});

boardsRouter.put("/:id", async (req: AuthedRequest, res) => {
  const ownerId = req.user!.id;
  const id = req.params.id;

  const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : undefined;
  const dataParsed = excalidrawDataSchema.safeParse(req.body?.data);
  if (!dataParsed.success) return res.status(400).json({ error: "invalid_data" });

  const result = await pool.query(
    `UPDATE boards
     SET name = COALESCE($3, name),
         data = $4
     WHERE id=$1 AND owner_id=$2
     RETURNING id, name, data, created_at, updated_at`,
    [id, ownerId, name ?? null, dataParsed.data],
  );

  if (!result.rowCount) return res.status(404).json({ error: "not_found" });
  return res.json(mapBoard(result.rows[0]));
});

function mapBoard(row: any) {
  return {
    id: row.id,
    name: row.name,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

