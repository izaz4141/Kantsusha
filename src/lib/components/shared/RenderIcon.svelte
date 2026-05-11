<script lang="ts">
  import { resolveIcon, shouldInvert } from '$lib/utils/icon';

  interface Props {
    icon?: string;
    name: string;
  }

  let { icon, name }: Props = $props();

  let resolved = $derived(icon ? resolveIcon(icon) : null);
  let shouldInvertDark = $derived(resolved ? shouldInvert(resolved.invert) : false);
</script>

{#if icon}
  {#if resolved}
    <img
      src={resolved.url}
      alt={name}
      class="h-full w-full object-contain"
      class:dark-invert={shouldInvertDark}
    />
  {:else}
    <div class="flex h-full w-full items-center justify-center rounded bg-primary">
      <span class="text-xs font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  {/if}
{:else}
  <div class="h-full w-full rounded bg-border"></div>
{/if}
