<script lang="ts">
  import type { BaseWidgetInfo, CustomApiData } from '$lib/types/widget.data';
  import type { CustomApiParams } from '$lib/types/widget.params';
  import { evaluateScript, compileTemplate } from '$lib/utils/extension';

  interface Props {
    result: BaseWidgetInfo;
    class?: string;
  }

  let { result, class: className = '' }: Props = $props();

  let data = $derived(result.data as CustomApiData);
  let params = $derived(result.params as CustomApiParams);

  let scriptVars = $derived.by(() => {
    if (!data.html || !data.script) return {};

    const fetchedVars: Record<string, unknown> = {};
    for (const [id, fd] of Object.entries(data.fetched)) {
      fetchedVars[id] = fd.data;
    }

    const scriptContext = {
      fetched: fetchedVars,
      options: params.options ?? {},
    };

    return evaluateScript(data.script, scriptContext);
  });

  let evaluatedHtml = $derived.by(() => {
    if (!data.html || !data.script) return data.html;

    const fetchedVars: Record<string, unknown> = {};
    for (const [id, fd] of Object.entries(data.fetched)) {
      fetchedVars[id] = fd.data;
    }

    const parsed = {
      script: data.script,
      css: data.style,
      html: data.html,
    };

    const additionalContext = {
      ...scriptVars,
      fetched: fetchedVars,
      options: params.options ?? {},
    };

    return compileTemplate(parsed, additionalContext);
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      window.__customApi = window.__customApi || {};
      for (const [key, value] of Object.entries(scriptVars)) {
        if (typeof value === 'function') {
          window.__customApi[key] = value;
        }
      }
    }
  });
</script>

<svelte:head>
  {#if data.style}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html `<style>${data.style}</style>`}
  {/if}
</svelte:head>

<div class={className}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html evaluatedHtml}
</div>
