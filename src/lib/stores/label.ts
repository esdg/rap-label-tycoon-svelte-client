import { writable } from 'svelte/store';
import type { Label } from '../types/label';

export const label = writable<Label | null>(null);
