import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { blockSelectionValidator, dayOfWeekValidator } from './validators';

export default defineSchema({
  settings: defineTable({
    userId: v.string(),
    setupWindow: v.union(
      v.null(),
      v.object({
        days: v.array(dayOfWeekValidator),
        startTime: v.string(),
        endTime: v.string(),
      }),
    ),
  }).index('by_user', ['userId']),
  blockProfiles: defineTable({
    userId: v.string(),
    name: v.string(),
    selection: blockSelectionValidator,
  }).index('by_user', ['userId']),
  schedules: defineTable({
    userId: v.string(),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(dayOfWeekValidator),
    isEnabled: v.boolean(),
    profileId: v.id('blockProfiles'),
  })
    .index('by_user', ['userId'])
    .index('by_user_profile', ['userId', 'profileId']),
});
