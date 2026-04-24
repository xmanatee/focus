import { create } from 'zustand';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { convex } from '../../api/convex';
import type { BlockSelection } from '../blocker/types';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';

type Profile = Doc<'blockProfiles'>;

interface ProfileActions {
  list: () => Promise<Profile[]>;
  ensureDefault: () => Promise<Id<'blockProfiles'>>;
  setSelection: (
    profileId: Id<'blockProfiles'>,
    name: string,
    selection: BlockSelection,
  ) => Promise<void>;
  remove: (profileId: Id<'blockProfiles'>) => Promise<void>;
}

export const useProfileStore = create<ProfileActions>(() => ({
  list: () => convex.query(api.profiles.list),

  ensureDefault: async () => {
    const existing = await convex.query(api.profiles.list);
    const defaultProfile = existing[0];
    if (defaultProfile) {
      return defaultProfile._id;
    }
    return convex.mutation(api.profiles.create, {
      name: 'Default',
      selection: EMPTY_BLOCK_SELECTION,
    });
  },

  setSelection: async (profileId, name, selection) => {
    await convex.mutation(api.profiles.update, {
      id: profileId,
      name,
      selection,
    });
  },

  remove: async (profileId) => {
    await convex.mutation(api.profiles.remove, { id: profileId });
  },
}));
