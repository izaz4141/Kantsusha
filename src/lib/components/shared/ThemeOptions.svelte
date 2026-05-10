<script lang="ts">
  import { themeState } from '$lib/theme/store.svelte';
  import Dropside from '$lib/components/ui/Dropside.svelte';

  let isOpen = $state(false);
  let triggerEl = $state<HTMLButtonElement>();
  const themeNames: string[] = $derived(Object.keys(themeState.presets));

  function toggle() {
    isOpen = !isOpen;
  }

  function selectTheme(key: string) {
    themeState.current = key;
  }
</script>

<div class="relative flex items-center">
  <button
    type="button"
    bind:this={triggerEl}
    class="flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-2 text-text transition-colors hover:bg-surface-raised"
    onclick={toggle}
    aria-label="Theme Settings"
    aria-expanded={isOpen}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="transition-transform duration-300 {isOpen ? 'rotate-90' : ''}"
    >
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path
        d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.09 1.08 1.2 2.74 2.78 2.79 2.79 1.27 1.27 3.35 1.28 4.63.01.95-.95 1.41-1.83 1.36-2.83-.06-1.21-1.18-2.11-2.29-2.48a3.03 3.03 0 0 0-2.49.19z"
      />
    </svg>
  </button>

  <Dropside bind:open={isOpen} trigger={triggerEl} direction="left" class="w-auto min-w-44">
    <div class="p-2">
      <span class="mb-2 block text-xs tracking-wider text-text-muted uppercase">Theme</span>
      <div class="grid grid-cols-3 gap-1">
        {#each themeNames as name (name)}
          {@const preset = themeState.presets[name]}
          <div data-theme={name} data-color-scheme={preset.colorScheme}>
            <button
              class="flex min-h-6 cursor-pointer items-center justify-center rounded-md border-2 border-transparent p-1 transition-all hover:scale-105 hover:border-border"
              class:border-primary={themeState.current === name}
              style="background-color: var(--color-background)"
              title={preset.name}
              onclick={() => selectTheme(name)}
            >
              <div class="flex gap-0.5">
                <span
                  class="h-2.5 w-2.5 rounded border border-black/10"
                  style="background-color: var(--color-primary)"
                ></span>
                <span
                  class="h-2.5 w-2.5 rounded border border-black/10"
                  style="background-color: var(--color-secondary)"
                ></span>
                <span
                  class="h-2.5 w-2.5 rounded border border-black/10"
                  style="background-color: var(--color-text-muted)"
                ></span>
              </div>
            </button>
          </div>
        {/each}
      </div>
    </div>
  </Dropside>
</div>
