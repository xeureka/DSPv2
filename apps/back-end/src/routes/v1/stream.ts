import { eq, gt } from "drizzle-orm";
import { streamSSE } from "hono/streaming";
import { db } from "@/db";
import { events } from "@/db/schema";
import { sessionMiddleware } from "@/middlewares/session.middleware";
import type { AppEnv } from "@/types/hono";
import { OpenAPIHono } from "@hono/zod-openapi";

const stream = new OpenAPIHono<AppEnv>();
stream.use("/stream", sessionMiddleware);
stream.get("/stream", (c) => { const user = c.get("user"); if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401); return streamSSE(c, async (sink) => { let after = new Date(Date.now() - 30_000); const last = c.req.header("last-event-id"); if (last) { const [event] = await db.select().from(events).where(eq(events.id, last)).limit(1); if (event) after = event.createdAt; } while (!sink.aborted) { const rows = await db.select().from(events).where(gt(events.createdAt, after)).orderBy(events.createdAt).limit(100); for (const event of rows) { after = event.createdAt; await sink.writeSSE({ id: event.id, event: event.subjectType, data: JSON.stringify({ type: event.type, subjectId: event.subjectId, payload: event.payload }) }); } await sink.writeSSE({ event: "heartbeat", data: JSON.stringify({ at: new Date().toISOString() }) }); await new Promise((resolve) => setTimeout(resolve, 5_000)); } }); });
export default stream;
