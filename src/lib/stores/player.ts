import { writable } from 'svelte/store';
import type { Player } from '../types/player';

export const player = writable<Player | null>(null);
