import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, conversationsTable, messagesTable, laborersTable } from "@workspace/db";
import {
  ListConversationsQueryParams,
  ListConversationsResponse,
  CreateConversationBody,
  GetMessagesParams,
  GetMessagesResponse,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", async (req, res): Promise<void> => {
  const params = ListConversationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.hirerPhone, params.data.phone))
    .orderBy(conversationsTable.updatedAt);

  res.json(
    ListConversationsResponse.parse(
      conversations.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))
    )
  );
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [laborer] = await db
    .select()
    .from(laborersTable)
    .where(eq(laborersTable.id, parsed.data.laborerId));

  if (!laborer) {
    res.status(404).json({ error: "Laborer not found" });
    return;
  }

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.laborerId, parsed.data.laborerId),
        eq(conversationsTable.hirerPhone, parsed.data.hirerPhone)
      )
    );

  if (existing.length > 0) {
    const conv = existing[0];
    res.status(201).json({ ...conv, updatedAt: conv.updatedAt.toISOString() });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values({
      laborerId: parsed.data.laborerId,
      laborerName: laborer.name,
      hirerPhone: parsed.data.hirerPhone,
      lastMessage: null,
    })
    .returning();

  res.status(201).json({ ...conversation, updatedAt: conversation.updatedAt.toISOString() });
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(
    GetMessagesResponse.parse(
      messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
    )
  );
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      senderPhone: parsed.data.senderPhone,
      content: parsed.data.content,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ lastMessage: parsed.data.content, updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json({ ...message, createdAt: message.createdAt.toISOString() });
});

export default router;
