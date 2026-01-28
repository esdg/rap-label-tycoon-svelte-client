import { writable } from 'svelte/store';
import type { Label } from '../types/label';

export const label = writable<Label | null>(null);

export function updateLabelBankroll(amount: number) {
    label.update((currentLabel) => {
        if (!currentLabel) return currentLabel;
        return {
            ...currentLabel,
            bankroll: currentLabel.bankroll + amount
        };
    });
}
