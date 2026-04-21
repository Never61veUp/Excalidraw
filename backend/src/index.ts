import "dotenv/config";
import express from "express";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { boardsRouter } from "./routes/boards";
import { authRequired } from "./middleware/authRequired";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/boards", authRequired, boardsRouter);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`backend listening on :${env.PORT}`);
});

