import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { blockSelectionValidator, dayOfWeekValidator } from './validators';

export default defineSchema({
  ...authTables,
  schedules: defineTable({
    userId: v.id('users'),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(dayOfWeekValidator),
    isEnabled: v.boolean(),
    selection: blockSelectionValidator,
  }).index('by_user', ['userId']),
});
