<script lang="ts">
  import type { BaseWidgetInfo, CustomApiData } from '$lib/types/widget.data';
  // import type { CustomApiParams } from '$lib/types/widget.params';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let data = $derived(result.data as CustomApiData);
  // let params = $derived(result.params as CustomApiParams);
</script>

<svelte:head>
  {#if data.css}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html `<style>${data.css}</style>`}
  {/if}
</svelte:head>

<div class={className}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html data.html}
</div>
