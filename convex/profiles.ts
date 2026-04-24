import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { authComponent } from './auth';
import { blockSelectionValidator } from './validators';

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const user = await authComponent.getAuthUser(ctx);
  return user._id;
}

async function requireOwnedProfile(
  ctx: MutationCtx,
  id: Id<'blockProfiles'>,
): Promise<void> {
  const userId = await requireUserId(ctx);
  const profile = await ctx.db.get(id);
  if (!profile || profile.userId !== userId) {
    throw new Error('Unauthorized');
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query('blockProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    selection: blockSelectionValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.name.trim().length === 0) {
      throw new Error('Profile name is required.');
    }
    return ctx.db.insert('blockProfiles', {
      userId,
      name: args.name.trim(),
      selection: args.selection,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('blockProfiles'),
    name: v.string(),
    selection: blockSelectionValidator,
  },
  handler: async (ctx, args) => {
    await requireOwnedProfile(ctx, args.id);
    if (args.name.trim().length === 0) {
      throw new Error('Profile name is required.');
    }
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      selection: args.selection,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('blockProfiles') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedProfile(ctx, args.id);

    const schedulesUsingProfile = await ctx.db
      .query('schedules')
      .withIndex('by_user_profile', (q) =>
        q.eq('userId', userId).eq('profileId', args.id),
      )
      .collect();

    if (schedulesUsingProfile.length > 0) {
      throw new Error(
        `Profile is used by ${schedulesUsingProfile.length} schedule(s). Delete or reassign them first.`,
      );
    }

    await ctx.db.delete(args.id);
  },
});
