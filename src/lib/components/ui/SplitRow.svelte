<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import PulseLoader from '$lib/components/shared/PulseLoader.svelte';
  import { fetchURL } from '$lib/utils/network';
  import type { WrapperWidgetData, AnyWidgetInfo } from '$lib/types/widget.data';
  import {
    type SplitRowParams,
    type WrapperWidgetEntry,
    type WrapperWidgetParams,
    type BaseWidgetParams,
    WrapperWidgetParamsSchema,
  } from '$lib/types/widget.params';
  import WrapperWidgetRenderer from './WrapperWidgetRenderer.svelte';
  import Dropdown from '$lib/components/ui/Dropdown.svelte';

  interface Props {
    id: string;
    refreshSignal?: number;
  }

  let { id, refreshSignal = 0 }: Props = $props();

  let loading = $state(true);
  let error = $state<string | null>(null);
  let splitData = $state<WrapperWidgetData | null>(null);
  let splitParams = $state<SplitRowParams | null>(null);
  let widgets = $derived(splitParams?.widgets as WrapperWidgetEntry[]);
  let reloading = $state(false);
  let childRefreshSignal = $state(0);
  let splitErrors = $state<string[]>([]);
  let wrapperErrTrigger = $state<HTMLElement>();
  let wrapperErrOpen = $state(false);
  let childErrTrigger = $state<HTMLElement>();
  let childErrOpen = $state(false);
  let childErrors: Record<string, string[]> = $state({});

  function onChildErrors(childId: string, errors: string[]) {
    childErrors[childId] = errors;
  }

  let allChildErrors = $derived(Object.values(childErrors).flat());

  $effect(() => {
    if (refreshSignal === 0) return;
    childRefreshSignal = Date.now();
  });

  async function fetchSplitData(isInitial = false) {
    if (isInitial) {
      loading = true;
    }
    error = null;
    try {
      const result = (await fetchURL(`/api/v1/widgets/${id}`, {
        returnText: false,
      })) as AnyWidgetInfo;
      splitData = result.data as WrapperWidgetData;
      splitParams = result.params as SplitRowParams;
      splitErrors = result.errors ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load rows';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    reloading = true;
    await fetchSplitData();
    reloading = false;
    childRefreshSignal = Date.now();
  }

  onMount(async () => {
    await fetchSplitData(true);
  });
</script>

{#if loading}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface">
    <PulseLoader message="Loading rows..." />
  </div>
{:else if error}
  <div
    class="flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 p-4"
  >
    <span class="text-error">⚠</span>
    <span class="text-sm text-error">{error}</span>
  </div>
{:else if splitData && splitParams}
  {#if splitParams?.title}
    <div class="mx-2 flex items-center justify-between">
      <span class="text-sm font-medium text-text uppercase">
        {splitParams.title}
        {#if allChildErrors.length}
          <div
            bind:this={childErrTrigger}
            class="inline-flex text-error"
            role="status"
            aria-label="splitChildren Warning"
            onmouseenter={() => (childErrOpen = true)}
            onmouseleave={() => (childErrOpen = false)}
          >
            ⚠
          </div>
          <Dropdown bind:open={childErrOpen} trigger={childErrTrigger} targetPortal="portal-root">
            {#each allChildErrors as err (err)}
              <div class="px-2 py-1 text-xs whitespace-nowrap text-error">{err}</div>
            {/each}
          </Dropdown>
        {/if}
      </span>
      <div class="flex items-center gap-2">
        {#if splitErrors.length}
          <span
            bind:this={wrapperErrTrigger}
            class="inline-flex text-error"
            role="button"
            tabindex="-1"
            onmouseenter={() => (wrapperErrOpen = true)}
            onmouseleave={() => (wrapperErrOpen = false)}
          >
            ⚠
          </span>
          <Dropdown
            bind:open={wrapperErrOpen}
            trigger={wrapperErrTrigger}
            targetPortal="portal-root"
          >
            {#each splitErrors as err (err)}
              <div class="px-2 py-1 text-xs whitespace-nowrap text-error">{err}</div>
            {/each}
          </Dropdown>
        {/if}
        <button
          onclick={reload}
          class="text-text-muted transition-colors hover:text-text"
          disabled={reloading}
          aria-label="Reload rows"
        >
          <span class:animate-spin={reloading}>↻</span>
        </button>
      </div>
    </div>
  {/if}
  <div class="flex flex-col gap-y-4">
    {#each splitData.ids as _, i (i)}
      {#if WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == widgets[i].type)}
        <WrapperWidgetRenderer
          id={splitData.ids[i]}
          type={widgets[i].type as WrapperWidgetParams['type']}
          refreshSignal={childRefreshSignal}
        />
      {:else}
        <WidgetRenderer
          id={splitData.ids[i]}
          type={widgets[i].type as BaseWidgetParams['type']}
          showTitle={false}
          refreshSignal={childRefreshSignal}
          onErrors={(e) => onChildErrors(splitData!.ids[i], e)}
        />
      {/if}
    {/each}
  </div>
{/if}
