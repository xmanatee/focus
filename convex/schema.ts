import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { blockSelectionValidator, dayOfWeekValidator } from './validators';

export default defineSchema({
  ...authTables,
  blockProfiles: defineTable({
    userId: v.id('users'),
    name: v.string(),
    selection: blockSelectionValidator,
  }).index('by_user', ['userId']),
  schedules: defineTable({
    userId: v.id('users'),
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
