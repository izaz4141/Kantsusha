<script lang="ts">
  import type { Snippet } from 'svelte';
  import { portal } from '$lib/actions/portal';

  interface Props {
    open?: boolean;
    trigger: HTMLElement;
    children: Snippet;
    class?: string;
    direction: 'left' | 'right';
    overlay?: boolean;
    targetPortal?: string;
  }

  let {
    open = $bindable(false),
    trigger,
    children,
    class: className = '',
    direction = 'right',
    overlay = false,
    targetPortal,
  }: Props = $props();

  function close() {
    open = false;
  }

  let horizontalStyle = $state<{
    left?: string;
    right?: string;
    marginRight?: string;
    marginLeft?: string;
  }>();
  let verticalStyle = $state<{ transform: string; top?: string; bottom?: string }>({
    transform: 'none',
  });
  let triangleStyle = $state<{ top?: string; bottom?: string }>();
  let contentEl = $state<HTMLDivElement>();

  $effect(() => {
    if (!open || !trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentHeight = contentEl?.clientHeight || 150;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const triggerMiddle = triggerRect.height / 2;

    if (spaceAbove >= contentHeight / 2 && spaceBelow >= contentHeight / 2) {
      if (targetPortal) {
        verticalStyle = {
          transform: 'translateY(-50%)',
          top: `${triggerRect.top + triggerMiddle}px`,
        };
      } else {
        verticalStyle = { transform: 'translateY(-50%)', top: '50%' };
      }
      triangleStyle = { top: `calc(50% - 8px)` };
    } else if (spaceAbove < contentHeight / 2) {
      verticalStyle = { transform: 'none', top: `${-spaceAbove + 16}px` };
      triangleStyle = { top: `${spaceAbove - 8 - 16 + triggerMiddle}px` };
    } else if (spaceBelow < contentHeight / 2) {
      verticalStyle = { transform: 'none', bottom: `${-spaceBelow + 16}px` };
      triangleStyle = { bottom: `${spaceBelow - 8 - 16 + triggerMiddle}px` };
    }

    if (direction === 'right') {
      if (targetPortal) {
        horizontalStyle = { left: `${triggerRect.right + 16}px` };
      } else {
        horizontalStyle = { left: '100%', right: 'auto', marginRight: '16px' };
      }
    } else {
      if (targetPortal) {
        horizontalStyle = { right: `${window.innerWidth - triggerRect.left + 16}px` };
      } else {
        horizontalStyle = { left: 'auto', right: '100%', marginLeft: '16px' };
      }
    }
  });
</script>

{#if open}
  <div
    use:portal={targetPortal}
    class="{targetPortal ? 'pointer-events-auto fixed' : 'absolute'} z-50 {!targetPortal
      ? direction == 'left'
        ? 'mr-2'
        : 'ml-2'
      : ''} {className}"
    style="left: {horizontalStyle?.left};
           right: {horizontalStyle?.right};
           margin-left: {horizontalStyle?.marginLeft};
           margin-right: {horizontalStyle?.marginRight};
           transform: {verticalStyle.transform};
           top: {verticalStyle.top};
           bottom: {verticalStyle.bottom};"
  >
    <div
      class="absolute h-4 w-4 rotate-45 {direction == 'left'
        ? 'border-t border-r'
        : 'border-b border-l'} border-border bg-surface"
      style="top: {triangleStyle?.top};
             bottom: {triangleStyle?.bottom};
             {direction === 'right' ? 'left' : 'right'}: -6px;"
    ></div>
    <div bind:this={contentEl} class="rounded-lg border border-border bg-surface p-1 shadow-xl">
      {@render children()}
    </div>
  </div>

  {#if overlay}
    <button
      type="button"
      use:portal={targetPortal}
      class="pointer-events-auto fixed inset-0 z-40 cursor-default border-none bg-transparent"
      onclick={close}
      aria-label="Close dropside"
    ></button>
  {/if}
{/if}
