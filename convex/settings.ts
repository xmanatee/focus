import { type Infer, v } from 'convex/values';
import { validateSetupWindow } from '../src/features/settings/validation';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { authComponent } from './auth';
import { dayOfWeekValidator } from './validators';

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const user = await authComponent.getAuthUser(ctx);
  return user._id;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query('settings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
  },
});

const setupWindowValidator = v.object({
  days: v.array(dayOfWeekValidator),
  startTime: v.string(),
  endTime: v.string(),
});

type SetupWindow = Infer<typeof setupWindowValidator>;

async function upsertSettings(
  ctx: MutationCtx,
  setupWindow: SetupWindow | null,
): Promise<void> {
  const userId = await requireUserId(ctx);
  const existing = await ctx.db
    .query('settings')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { setupWindow });
    return;
  }
  await ctx.db.insert('settings', { userId, setupWindow });
}

export const setSetupWindow = mutation({
  args: { window: setupWindowValidator },
  handler: async (ctx, args) => {
    validateSetupWindow(args.window);
    await upsertSettings(ctx, args.window);
  },
});

export const clearSetupWindow = mutation({
  args: {},
  handler: async (ctx) => {
    await upsertSettings(ctx, null);
  },
});
