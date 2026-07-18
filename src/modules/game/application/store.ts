import { atom } from 'nanostores';
import type { ActiveDialog } from "@/modules/game/domain/types";

export interface TooltipState {
  id: string;
  type: 'skill' | 'npc';
  name: string;
  screenX: number;
  screenY: number;
}

export const isStartedStore = atom<boolean>(false);
export const volumeStore = atom<number>(70);
export const gamepadConnectedStore = atom<boolean>(false);
export const collectedSkillsStore = atom<string[]>([]);
export const activeDialogStore = atom<ActiveDialog | null>(null);
export const activeTooltipStore = atom<TooltipState | null>(null);
