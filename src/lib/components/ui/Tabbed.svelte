<script lang="ts">
  import { onMount } from 'svelte';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import PulseLoader from '$lib/components/shared/PulseLoader.svelte';
  import { fetchURL } from '$lib/utils/network';
  import type { WrapperWidgetData, AnyWidgetInfo } from '$lib/types/widget.data';
  import {
    type TabbedParams,
    type WrapperWidgetEntry,
    type BaseWidgetParams,
    type WrapperWidgetParams,
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
  let tabData = $state<WrapperWidgetData | null>(null);
  let tabParams = $state<TabbedParams | null>(null);
  let widgets = $derived(tabParams?.widgets as WrapperWidgetEntry[]);
  let active = $state(0);
  let reloading = $state(false);
  let childRefreshSignal = $state(0);
  let tabErrors = $state<string[]>([]);
  let errorTrigger = $state<HTMLElement>();
  let errorOpen = $state(false);
  let childErrors: Record<string, string[]> = $state({});
  let activeErrTrigger = $state<Record<number, HTMLElement>>({});
  let activeErrOpen = $state<Record<number, boolean>>({});

  function onChildErrors(childId: string, errors: string[]) {
    childErrors[childId] = errors;
  }

  $effect(() => {
    if (refreshSignal === 0) return;
    childRefreshSignal = Date.now();
  });

  async function fetchTabbedData(isInitial = false) {
    if (isInitial) {
      loading = true;
    }
    error = null;
    try {
      const result = (await fetchURL(`/api/v1/widgets/${id}`, {
        returnText: false,
      })) as AnyWidgetInfo;
      tabData = result.data as WrapperWidgetData;
      tabParams = result.params as TabbedParams;
      tabErrors = result.errors ?? [];
      for (let i = 0; i < tabParams.widgets.length; i++) {
        activeErrOpen[i] = false;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load tabs';
    } finally {
      loading = false;
    }
  }

  async function reload() {
    reloading = true;
    await fetchTabbedData();
    reloading = false;
    childRefreshSignal = Date.now();
  }

  onMount(async () => {
    await fetchTabbedData(true);
  });
</script>

{#if loading}
  <div class="flex items-center justify-center rounded-lg border border-border bg-surface">
    <PulseLoader message="Loading tabs..." />
  </div>
{:else if error}
  <div
    class="flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 p-4"
  >
    <span class="text-error">⚠</span>
    <span class="text-sm text-error">{error}</span>
  </div>
{:else if tabParams && tabData}
  <div class="mx-2 flex flex-row items-center justify-between">
    <div class="flex flex-1 flex-row gap-4 overflow-x-scroll">
      {#each widgets as widget, i (`${widget.type}_${i}`)}
        {@const childId = tabData?.ids[i]}
        {@const errs = childId ? (childErrors[childId] ?? []) : []}
        <button
          type="button"
          class="flex shrink-0 items-center gap-1 text-sm font-medium uppercase {active === i
            ? 'border-b border-dotted border-text-muted text-text'
            : 'text-text-muted'} hover:text-text"
          onclick={() => (active = i)}
        >
          {widget.title ?? `Tab ${i + 1}`}
          {#if errs.length}
            <div
              bind:this={activeErrTrigger[i]}
              class="inline-flex text-error"
              role="status"
              aria-label="tabChildren Warning"
              onmouseenter={() => (activeErrOpen[i] = true)}
              onmouseleave={() => (activeErrOpen[i] = false)}
            >
              ⚠
            </div>
            <Dropdown
              bind:open={activeErrOpen[i]}
              trigger={activeErrTrigger[i]!}
              targetPortal="portal-root"
            >
              {#each errs as err (err)}
                <div class="px-2 py-1 text-xs whitespace-nowrap text-error">{err}</div>
              {/each}
            </Dropdown>
          {/if}
        </button>
      {/each}
    </div>
    <button
      onclick={reload}
      class="text-text-muted transition-colors hover:text-text"
      disabled={reloading}
      aria-label="Reload tabs"
    >
      <span class:animate-spin={reloading}>↻</span>
    </button>
    {#if tabErrors.length}
      <span
        bind:this={errorTrigger}
        class="ml-2 inline-flex text-error"
        role="button"
        tabindex="-1"
        onmouseenter={() => (errorOpen = true)}
        onmouseleave={() => (errorOpen = false)}
      >
        ⚠
      </span>
      <Dropdown bind:open={errorOpen} trigger={errorTrigger} targetPortal="portal-root">
        {#each tabErrors as err (err)}
          <div class="px-2 py-1 text-xs whitespace-nowrap text-error">{err}</div>
        {/each}
      </Dropdown>
    {/if}
  </div>
  {#each tabData.ids as _, i (i)}
    <div class:hidden={active !== i}>
      {#if WrapperWidgetParamsSchema.options.some((o) => o.shape.type.value == widgets[i].type)}
        <WrapperWidgetRenderer
          id={tabData.ids[i]}
          type={widgets[i].type as WrapperWidgetParams['type']}
          refreshSignal={childRefreshSignal}
        />
      {:else}
        <WidgetRenderer
          id={tabData.ids[i]}
          type={widgets[i].type as BaseWidgetParams['type']}
          showTitle={false}
          refreshSignal={childRefreshSignal}
          onErrors={(e) => onChildErrors(tabData!.ids[i], e)}
        />
      {/if}
    </div>
  {/each}
{/if}
