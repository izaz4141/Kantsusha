<script lang="ts">
  import { searchState, closeSearch, detectEngineFromQuery } from '$lib/stores/search.svelte';
  import { resolveString } from '$lib/utils/substitution';
  import { fetchURL } from '$lib/utils/network';

  let inputEl = $state<HTMLInputElement>();
  let suggestions = $state<string[]>([]);
  let bangTag = $state('');
  let selectedIndex = $state(-1);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  let activeEngine = $derived.by(() => {
    if (bangTag) {
      const entry = Object.entries(searchState.engines).find(([_, eng]) => eng.bang === bangTag);
      if (entry) return entry[0];
    }
    return searchState.selectedEngine || Object.keys(searchState.engines)[0] || '';
  });

  let engineList = $derived(Object.keys(searchState.engines));

  function selectEngine(key: string) {
    searchState.selectedEngine = key;
    if (bangTag) {
      const bangEngine = Object.entries(searchState.engines).find(
        ([_, eng]) => eng.bang === bangTag,
      )?.[0];
      if (bangEngine !== key) bangTag = '';
    }
    if (inputEl) inputEl.focus();
  }

  async function fetchSuggestions(q: string) {
    if (!q.trim()) {
      suggestions = [];
      return;
    }
    try {
      const data = (await fetchURL(
        `/api/v1/search?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(activeEngine)}`,
        { method: 'GET', returnText: false, retry: 0 },
      )) as { suggestions?: string[] };
      suggestions = data?.suggestions ?? [];
    } catch {
      suggestions = [];
    }
  }

  function onInput() {
    selectedIndex = -1;
    const detected = detectEngineFromQuery(searchState.query);
    if (detected) {
      bangTag = searchState.engines[detected.engineKey]?.bang || '';
      searchState.selectedEngine = detected.engineKey;
      searchState.query = detected.cleanQuery;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchSuggestions(searchState.query);
    }, 150);
  }

  function doSearch(query: string) {
    const engine = searchState.engines[activeEngine];
    if (!engine) return;
    const q = query || searchState.query;
    if (!q.trim()) return;
    const url = resolveString(engine.queryUrl.replace('${QUERY}', encodeURIComponent(q)));
    closeSearch();
    window.open(url, searchState.target, 'noopener,noreferrer');
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeSearch();
      return;
    }
    if (e.key === 'Backspace' && searchState.query === '' && bangTag) {
      bangTag = '';
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        doSearch(suggestions[selectedIndex]);
      } else {
        doSearch(searchState.query);
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIdx = engineList.indexOf(activeEngine);
      const next = (nextIdx + 1) % engineList.length;
      selectEngine(engineList[next]);
    }
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeSearch();
    }
  }

  $effect(() => {
    if (searchState.open && inputEl) {
      inputEl.focus();
    }
  });
</script>

{#if searchState.open}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
    style="background-color: rgba(0,0,0,0.5)"
    role="dialog"
    aria-modal="true"
    aria-label="Search"
    tabindex="-1"
    onclick={onBackdropClick}
    onkeydown={(e) => {
      if (e.key === 'Escape') closeSearch();
    }}
  >
    <div class="w-full max-w-xl rounded-xl bg-surface shadow-2xl" role="search">
      <div
        class="flex items-center gap-x-2 rounded-t-xl border
        border-border px-4 py-3 focus-within:border-transparent
        focus-within:shadow-[0_0_0_2px_var(--color-primary),0_0_24px_6px_var(--color-ring)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0 text-text-muted"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {#if bangTag}
          <span
            class="flex shrink-0 items-center gap-1 rounded-md border border-secondary bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary"
          >
            {bangTag}
            <button
              onclick={() => {
                bangTag = '';
                inputEl?.focus();
              }}
              class="ml-0.5 cursor-pointer leading-none text-secondary/70 hover:text-secondary"
              aria-label="Remove bang">✕</button
            >
          </span>
        {/if}
        <input
          bind:this={inputEl}
          type="text"
          bind:value={searchState.query}
          oninput={onInput}
          onkeydown={onKeydown}
          placeholder="Search... (Tab to switch engine)"
          class="min-w-0 flex-1 border-none bg-transparent p-0 text-text outline-none placeholder:text-text-muted focus:ring-0"
        />
        {#if searchState.query}
          <button
            onclick={() => {
              searchState.query = '';
              suggestions = [];
            }}
            class="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-xl text-error/80 transition-colors hover:bg-surface-raised/30 hover:text-error"
            aria-label="Clear">✕</button
          >
        {/if}
      </div>

      {#if suggestions.length > 0}
        <ul class="max-h-64 overflow-y-auto border border-border px-2 py-1" role="listbox">
          {#each suggestions as suggestion, i (suggestion)}
            <li
              role="option"
              aria-selected={i === selectedIndex}
              class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-text transition-colors {i ===
              selectedIndex
                ? 'bg-surface-raised'
                : 'hover:bg-surface-raised'}"
              onmousedown={() => doSearch(suggestion)}
              onmouseenter={() => (selectedIndex = i)}
            >
              <span>{suggestion}</span>
            </li>
          {/each}
        </ul>
      {:else if searchState.query || bangTag}
        <div class="border border-border px-4 py-2 text-xs text-text-muted">
          Press Enter to search with <span class="font-medium text-text">{activeEngine}</span>
        </div>
      {/if}

      {#if engineList.length > 1}
        <div class="flex flex-wrap gap-1 rounded-b-xl border border-border px-4 py-2">
          {#each engineList as key (key)}
            <button
              onclick={() => selectEngine(key)}
              class="cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors {key ===
              activeEngine
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text-muted hover:border-border-strong hover:text-text'}"
              >{key}</button
            >
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
