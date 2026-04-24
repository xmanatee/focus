import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { validateScheduleInput } from '../src/features/schedule/validation';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { dayOfWeekValidator } from './validators';

async function requireAuthUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Not authenticated');
  }
  return userId;
}

async function requireOwnedSchedule(ctx: MutationCtx, id: Id<'schedules'>) {
  const userId = await requireAuthUserId(ctx);
  const schedule = await ctx.db.get(id);
  if (!schedule || schedule.userId !== userId) {
    throw new Error('Unauthorized');
  }
  return schedule;
}

async function requireOwnedProfile(
  ctx: MutationCtx,
  profileId: Id<'blockProfiles'>,
) {
  const userId = await requireAuthUserId(ctx);
  const profile = await ctx.db.get(profileId);
  if (!profile || profile.userId !== userId) {
    throw new Error('Profile not found.');
  }
  return profile;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    return ctx.db
      .query('schedules')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(dayOfWeekValidator),
    isEnabled: v.boolean(),
    profileId: v.id('blockProfiles'),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedProfile(ctx, args.profileId);
    validateScheduleInput({
      name: args.name,
      startTime: args.startTime,
      endTime: args.endTime,
      days: args.days,
      isEnabled: args.isEnabled,
    });

    return ctx.db.insert('schedules', {
      ...args,
      name: args.name.trim(),
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('schedules'),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(dayOfWeekValidator),
    profileId: v.id('blockProfiles'),
  },
  handler: async (ctx, args) => {
    const schedule = await requireOwnedSchedule(ctx, args.id);
    await requireOwnedProfile(ctx, args.profileId);
    validateScheduleInput({
      name: args.name,
      startTime: args.startTime,
      endTime: args.endTime,
      days: args.days,
      isEnabled: schedule.isEnabled,
    });
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      startTime: args.startTime,
      endTime: args.endTime,
      days: args.days,
      profileId: args.profileId,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id('schedules'), isEnabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireOwnedSchedule(ctx, args.id);
    await ctx.db.patch(args.id, { isEnabled: args.isEnabled });
  },
});

export const remove = mutation({
  args: { id: v.id('schedules') },
  handler: async (ctx, args) => {
    await requireOwnedSchedule(ctx, args.id);
    await ctx.db.delete(args.id);
  },
});
