import { atom } from 'nanostores';

export const isStartedStore = atom<boolean>(false);
export const volumeStore = atom<number>(70);
export const gamepadConnectedStore = atom<boolean>(false);
export const collectedSkillsStore = atom<string[]>([]);
