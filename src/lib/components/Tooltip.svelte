<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Position preference (will auto-flip if not enough space)
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
	// Max width of tooltip
	export let maxWidth: number = 280;
	// Additional classes for the tooltip container
	let className = '';
	export { className as class };
	// Additional classes for the trigger wrapper
	let wrapperClassName = '';
	export { wrapperClassName as wrapperClass };

	let triggerEl: HTMLElement;
	let tooltipEl: HTMLElement;
	let visible = false;
	let positioned = false;
	let computedPosition = position;
	let tooltipStyle = 'top: 0; left: 0;';
	let arrowStyle = '';
	let arrowClass = '';

	const ARROW_SIZE = 6;
	const OFFSET = 8;

	function showTooltip() {
		visible = true;
		positioned = false;
		// Use double requestAnimationFrame to ensure DOM is fully updated
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (tooltipEl && triggerEl) {
					calculatePosition();
					positioned = true;
				}
			});
		});
	}

	function hideTooltip() {
		visible = false;
	}

	function calculatePosition() {
		if (!triggerEl || !tooltipEl) return;

		const triggerRect = triggerEl.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Calculate available space in each direction
		const spaceTop = triggerRect.top;
		const spaceBottom = viewportHeight - triggerRect.bottom;
		const spaceLeft = triggerRect.left;
		const spaceRight = viewportWidth - triggerRect.right;

		// Determine best position based on preference and available space
		let finalPosition = position;
		const tooltipHeight = tooltipRect.height + OFFSET + ARROW_SIZE;
		const tooltipWidth = tooltipRect.width + OFFSET + ARROW_SIZE;

		if (position === 'top' && spaceTop < tooltipHeight) {
			finalPosition = spaceBottom >= tooltipHeight ? 'bottom' : position;
		} else if (position === 'bottom' && spaceBottom < tooltipHeight) {
			finalPosition = spaceTop >= tooltipHeight ? 'top' : position;
		} else if (position === 'left' && spaceLeft < tooltipWidth) {
			finalPosition = spaceRight >= tooltipWidth ? 'right' : position;
		} else if (position === 'right' && spaceRight < tooltipWidth) {
			finalPosition = spaceLeft >= tooltipWidth ? 'left' : position;
		}

		computedPosition = finalPosition;

		// Calculate tooltip position
		let top = 0;
		let left = 0;
		let arrowTop = '';
		let arrowLeft = '';
		let arrowClasses = '';

		const triggerCenterX = triggerRect.left + triggerRect.width / 2;
		const triggerCenterY = triggerRect.top + triggerRect.height / 2;

		switch (finalPosition) {
			case 'top':
				top = triggerRect.top - tooltipRect.height - OFFSET - ARROW_SIZE;
				left = triggerCenterX - tooltipRect.width / 2;
				arrowTop = '100%';
				arrowLeft = '50%';
				// Arrow pointing down
				arrowClasses =
					'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-700 -translate-x-1/2';
				break;
			case 'bottom':
				top = triggerRect.bottom + OFFSET + ARROW_SIZE;
				left = triggerCenterX - tooltipRect.width / 2;
				arrowTop = `-${ARROW_SIZE}px`;
				arrowLeft = '50%';
				// Arrow pointing up
				arrowClasses =
					'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-700 -translate-x-1/2';
				break;
			case 'left':
				top = triggerCenterY - tooltipRect.height / 2;
				left = triggerRect.left - tooltipRect.width - OFFSET - ARROW_SIZE;
				arrowTop = '50%';
				arrowLeft = '100%';
				// Arrow pointing right
				arrowClasses =
					'border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-700 -translate-y-1/2';
				break;
			case 'right':
				top = triggerCenterY - tooltipRect.height / 2;
				left = triggerRect.right + OFFSET + ARROW_SIZE;
				arrowTop = '50%';
				arrowLeft = `-${ARROW_SIZE}px`;
				// Arrow pointing left
				arrowClasses =
					'border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-700 -translate-y-1/2';
				break;
		}

		// Keep tooltip within viewport bounds
		const padding = 8;
		if (left < padding) left = padding;
		if (left + tooltipRect.width > viewportWidth - padding) {
			left = viewportWidth - tooltipRect.width - padding;
		}
		if (top < padding) top = padding;
		if (top + tooltipRect.height > viewportHeight - padding) {
			top = viewportHeight - tooltipRect.height - padding;
		}

		tooltipStyle = `top: ${top}px; left: ${left}px;`;
		arrowStyle = `top: ${arrowTop}; left: ${arrowLeft};`;
		arrowClass = arrowClasses;
	}

	// Recalculate on scroll/resize
	function handleViewportChange() {
		if (visible) {
			calculatePosition();
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleViewportChange, true);
		window.addEventListener('resize', handleViewportChange);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', handleViewportChange, true);
			window.removeEventListener('resize', handleViewportChange);
		}
	});
</script>

<svelte:body />

<!-- Trigger wrapper -->
<span
	bind:this={triggerEl}
	class="inline-flex {wrapperClassName}"
	on:mouseenter={showTooltip}
	on:mouseleave={hideTooltip}
	on:focusin={showTooltip}
	on:focusout={hideTooltip}
	role="button"
	tabindex="0"
>
	<slot name="trigger" />
</span>

<!-- Tooltip portal to body -->
{#if visible}
	<div
		bind:this={tooltipEl}
		class="fixed z-[9999] select-none rounded-md border border-gray-700 bg-primary-950 px-3 py-2 text-xs text-gray-400 shadow-lg {className}"
		class:invisible={!positioned}
		class:visible={positioned}
		style="{tooltipStyle} max-width: {maxWidth}px;"
		role="tooltip"
	>
		<!-- Arrow -->
		<div class="absolute h-0 w-0 {arrowClass}" style={arrowStyle} />
		<!-- Content -->
		<slot />
	</div>
{/if}
