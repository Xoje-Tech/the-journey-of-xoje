import { describe, it, expect } from 'vitest';
import {
  isStartedStore,
  volumeStore,
  gamepadConnectedStore,
  collectedSkillsStore,
  activeDialogStore,
} from "../src/modules/game/application/store";

describe('Nanostores state management', () => {
  it('should initialize with correct default values', () => {
    expect(isStartedStore.get()).toBe(false);
    expect(volumeStore.get()).toBe(70);
    expect(gamepadConnectedStore.get()).toBe(false);
    expect(collectedSkillsStore.get()).toEqual([]);
    expect(activeDialogStore.get()).toBeNull();
  });

  it('should update activeDialogStore correctly', () => {
    activeDialogStore.set({ npcName: 'Héctor', skillId: 'kuka-robotics', text: '¡Ey!' });
    expect(activeDialogStore.get()).toEqual({
      npcName: 'Héctor',
      skillId: 'kuka-robotics',
      text: '¡Ey!',
    });
    activeDialogStore.set(null);
    expect(activeDialogStore.get()).toBeNull();
  });

  it('should update and emit events on mutation', () => {
    let called = false;
    const unsubscribe = isStartedStore.listen((val) => {
      called = val;
    });
    isStartedStore.set(true);
    expect(isStartedStore.get()).toBe(true);
    expect(called).toBe(true);

    isStartedStore.set(false); // Reset
    unsubscribe();
  });
});
