import { vi } from 'vitest';

export const slotStore = new Map<string, string>();

vi.mock('react-native-device-activity', () => ({
  setFamilyActivitySelectionId: ({
    id,
    familyActivitySelection,
  }: {
    id: string;
    familyActivitySelection: string;
  }) => {
    if (familyActivitySelection === '') {
      slotStore.delete(id);
      return;
    }
    slotStore.set(id, familyActivitySelection);
  },
  getFamilyActivitySelectionId: (id: string) => slotStore.get(id),
}));
