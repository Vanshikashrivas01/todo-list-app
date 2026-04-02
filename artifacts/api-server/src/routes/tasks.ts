import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks/stats", async (req, res) => {
  const [row] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${tasksTable.done} = true)`,
    })
    .from(tasksTable);

  const total = Number(row.total);
  const completed = Number(row.completed);

  res.json({ total, completed, pending: total - completed });
});

router.get("/tasks", async (_req, res) => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .orderBy(tasksTable.createdAt);
  res.json(tasks);
});

router.post("/tasks", async (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [task] = await db
    .insert(tasksTable)
    .values({ text: parsed.data.text })
    .returning();
  res.status(201).json(task);
});

router.patch("/tasks/:id", async (req, res) => {
  const paramsParsed = UpdateTaskParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateTaskBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const updates: Partial<{ text: string; done: boolean }> = {};
  if (bodyParsed.data.text !== undefined) updates.text = bodyParsed.data.text;
  if (bodyParsed.data.done !== undefined) updates.done = bodyParsed.data.done;

  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, paramsParsed.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

router.delete("/tasks/:id", async (req, res) => {
  const paramsParsed = DeleteTaskParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(tasksTable).where(eq(tasksTable.id, paramsParsed.data.id));
  res.status(204).send();
});

export default router;
