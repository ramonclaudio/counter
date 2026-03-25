import { makeMigration } from 'convex-helpers/server/migrations';
import { internalMutation } from './_generated/server';

const migration = makeMigration(internalMutation, {
  migrationTable: 'migrations',
});

/**
 * Extracts embedded messages arrays from existing conversation docs
 * into the normalized messages table, then sets denormalized counts.
 *
 * Run: npx convex run migrations:extractMessages '{"fn":"migrations:extractMessages"}'
 */
export const extractMessages = migration({
  table: 'conversations',
  migrateOne: async (ctx, conv) => {
    const embedded = (conv as any).messages as
      | { role: string; content: string; timestamp: number }[]
      | undefined;
    if (!embedded || embedded.length === 0) {
      if (conv.messageCount === undefined) {
        await ctx.db.patch('conversations', conv._id, { messageCount: 0 });
      }
      return;
    }
    for (const msg of embedded) {
      await ctx.db.insert('messages', {
        conversationId: conv._id,
        userId: conv.userId,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
      });
    }
    const firstUserMsg = embedded.find((m) => m.role === 'user');
    await ctx.db.patch('conversations', conv._id, {
      messageCount: embedded.length,
      lastPreview: firstUserMsg?.content.slice(0, 80),
    });
  },
});
