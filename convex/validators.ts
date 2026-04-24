import { v } from 'convex/values';

export const dayOfWeekValidator = v.union(
  v.literal('mon'),
  v.literal('tue'),
  v.literal('wed'),
  v.literal('thu'),
  v.literal('fri'),
  v.literal('sat'),
  v.literal('sun'),
);

const activitySelectionMetadataValidator = {
  applicationCount: v.number(),
  categoryCount: v.number(),
  webDomainCount: v.number(),
  includeEntireCategory: v.boolean(),
};

export const persistedActivitySelectionValidator = v.union(
  v.object({
    status: v.literal('empty'),
  }),
  v.object({
    status: v.literal('saved'),
    selectionId: v.string(),
    ...activitySelectionMetadataValidator,
  }),
);

export const blockSelectionValidator = v.object({
  activitySelection: persistedActivitySelectionValidator,
  webDomains: v.array(v.string()),
});
