<script lang="ts">
	export let value: number = 0; // 0 to 100
	export let orientation: 'horizontal' | 'vertical' = 'horizontal';

	// Size classes: length runs along the progress direction; thickness is the cross-axis.
	export let lengthClass: string = 'w-48 sm:w-60';
	export let thicknessClass: string = 'h-3 sm:h-3.5';

	export let progressClass: string = 'bg-blue-500';
	export let backgroundClass: string = 'bg-gray-800/40';
	export let useGradient: boolean = false;
	export let gradientFromClass: string = 'from-indigo-500';
	export let gradientToClass: string = 'to-pink-500';
	export let gradientViaClass: string = ''; // optional middle stop
	export let rounded: boolean = true;
	export let ariaLabel: string = 'Progress';

	// Clamp and derive orientation helpers.
	$: clampedValue = Math.max(0, Math.min(100, value));
	$: isHorizontal = orientation === 'horizontal';
	$: cornerClass = rounded ? 'rounded-full' : 'rounded-none';
	$: fillStyle = isHorizontal ? `width:${clampedValue}%` : `height:${clampedValue}%`;
	$: sizeClasses = isHorizontal
		? `${lengthClass} ${thicknessClass}`
		: `${thicknessClass} ${lengthClass}`; // swap for vertical
	$: fillPositionClass = isHorizontal ? 'left-0 inset-y-0' : 'bottom-0 inset-x-0';
	$: gradientDirectionClass = isHorizontal ? 'bg-gradient-to-r' : 'bg-gradient-to-t';
	$: fillColorClass = useGradient
		? `${gradientDirectionClass} ${gradientFromClass} ${gradientViaClass} ${gradientToClass}`
		: progressClass;
</script>

<div
	class={`relative overflow-hidden ${sizeClasses} ${cornerClass}`}
	role="progressbar"
	aria-valuemin="0"
	aria-valuemax="100"
	aria-valuenow={clampedValue}
	aria-label={ariaLabel}
>
	<div class={`absolute inset-0 ${backgroundClass}`}></div>
	<div
		class={`absolute ${fillPositionClass} ${fillColorClass} ${cornerClass}`}
		style={fillStyle}
	></div>
</div>
