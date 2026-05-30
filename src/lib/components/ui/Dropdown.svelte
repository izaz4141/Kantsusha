<script lang="ts">
  import type { Snippet } from 'svelte';
  import { portal } from '$lib/actions/portal';

  interface Props {
    open?: boolean;
    trigger: HTMLElement;
    children: Snippet;
    class?: string;
    overlay?: boolean;
    targetPortal?: string;
  }

  let {
    open = $bindable(false),
    trigger,
    children,
    class: className = '',
    overlay = false,
    targetPortal,
  }: Props = $props();

  function close() {
    open = false;
  }

  let horizontalStyle = $state<{ left: string; transform: string; right?: string }>({
    left: '0px',
    transform: 'none',
  });
  let verticalStyle = $state<{
    top?: string;
    bottom?: string;
    marginTop?: string;
    marginBottom?: string;
  }>({ top: '100%', marginTop: '8px' });
  let triangleStyle = $state<{ left?: string; right?: string }>();
  let contentEl = $state<HTMLDivElement>();

  $effect(() => {
    if (!open || !trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentWidth = contentEl?.clientWidth || 180;
    const triggerCenter = triggerRect.width / 2;
    const spaceLeft = triggerRect.left;
    const spaceRight = window.innerWidth - triggerRect.right;

    if (spaceLeft >= contentWidth / 2 && spaceRight >= contentWidth / 2) {
      if (targetPortal) {
        horizontalStyle = {
          left: `${triggerRect.left + triggerCenter}px`,
          transform: 'translateX(-50%)',
        };
      } else {
        horizontalStyle = { left: '50%', transform: 'translateX(-50%)' };
      }
      triangleStyle = { left: `calc(50% - 8px)` };
    } else if (spaceLeft < contentWidth / 2) {
      if (targetPortal) {
        horizontalStyle = { left: `${16}px`, transform: 'none' };
      } else {
        horizontalStyle = { left: `${-spaceLeft + 16}px`, right: 'auto', transform: 'none' };
      }
      triangleStyle = { left: `${spaceLeft - 8 - 16 + triggerCenter}px` };
    } else {
      if (targetPortal) {
        horizontalStyle = { left: 'auto', right: `${16}px`, transform: 'none' };
      } else {
        horizontalStyle = { left: 'auto', right: `${-spaceRight + 16}px`, transform: 'none' };
      }
      triangleStyle = { right: `${spaceRight - 8 - 16 + triggerCenter}px` };
    }

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceAbove > spaceBelow) {
      if (targetPortal) {
        verticalStyle = { bottom: `${window.innerHeight - triggerRect.top + 8}px` };
      } else {
        verticalStyle = { bottom: '100%', marginBottom: '8px' };
      }
    } else {
      if (targetPortal) {
        verticalStyle = { top: `${triggerRect.bottom + 8}px` };
      } else {
        verticalStyle = { top: '100%', marginTop: '8px' };
      }
    }
  });
</script>

{#if open}
  <div
    use:portal={targetPortal}
    class="{targetPortal ? 'pointer-events-auto fixed' : 'absolute'} z-50 {className}"
    style="left: {horizontalStyle.left};
           right: {horizontalStyle.right};
           transform: {horizontalStyle.transform};
           top: {verticalStyle.top};
           bottom: {verticalStyle.bottom};
           margin-top: {verticalStyle.marginTop};
           margin-bottom: {verticalStyle.marginBottom};"
  >
    <div
      class="absolute h-4 w-4 rotate-45 {verticalStyle.bottom
        ? 'border-r border-b'
        : 'border-t border-l'} border-border bg-surface"
      style="left: {triangleStyle?.left};
             right: {triangleStyle?.right};
             top: {verticalStyle.top ? '-6px' : 'auto'};
             bottom: {verticalStyle.bottom ? '-6px' : 'auto'};"
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
      aria-label="Close dropdown"
    ></button>
  {/if}
{/if}

<style>
  button {
    cursor: default;
  }
</style>
