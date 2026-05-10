<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    trigger: HTMLElement;
    children: Snippet;
    class?: string;
  }

  let { open = $bindable(false), trigger, children, class: className = '' }: Props = $props();

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
      horizontalStyle = { left: '50%', transform: 'translateX(-50%)' };
      triangleStyle = { left: `calc(50% - 8px)` };
    } else if (spaceLeft < contentWidth / 2) {
      horizontalStyle = { left: `${-spaceLeft + 16}px`, right: 'auto', transform: 'none' };
      triangleStyle = { left: `${spaceLeft - 8 - 16 + triggerCenter}px` };
    } else if (spaceRight < contentWidth / 2) {
      horizontalStyle = { left: 'auto', right: `${-spaceRight + 16}px`, transform: 'none' };
      triangleStyle = { right: `${spaceRight - 8 - 16 + triggerCenter}px` };
    }

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    if (spaceAbove > spaceBelow) {
      verticalStyle = { bottom: '100%', marginBottom: '8px' };
    } else {
      verticalStyle = { top: '100%', marginTop: '8px' };
    }
  });
</script>

{#if open}
  <div
    class="absolute z-50 {className}"
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

  <button
    type="button"
    class="fixed inset-0 z-40 cursor-default border-none bg-transparent"
    style="transform: translate3d(0,0,0)"
    onclick={close}
    aria-label="Close dropdown"
  ></button>
{/if}
