import { atom } from 'nanostores';
import type { ActiveDialog } from './types';

export const isStartedStore = atom<boolean>(false);
export const volumeStore = atom<number>(70);
export const gamepadConnectedStore = atom<boolean>(false);
export const collectedSkillsStore = atom<string[]>([]);
export const activeDialogStore = atom<ActiveDialog | null>(null);
