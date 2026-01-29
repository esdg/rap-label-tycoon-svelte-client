import type { Action } from 'svelte/action';

export const clickOutside: Action<HTMLElement, undefined, { 'on:click_outside': (e: CustomEvent) => void }> = (node) => {
    const handleClick = (event: MouseEvent) => {
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            node.dispatchEvent(new CustomEvent('click_outside', { detail: node }));
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
};
