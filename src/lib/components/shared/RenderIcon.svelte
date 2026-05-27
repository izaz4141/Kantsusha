<script lang="ts">
  import { resolveIcon, shouldInvert } from '$lib/utils/icon';
  import brokenIcon from '$lib/assets/broken-icon.svg';

  interface Props {
    icon?: string;
    name: string;
  }

  let { icon, name }: Props = $props();

  let resolved = $derived(icon ? resolveIcon(icon) : null);
  let shouldInvertDark = $derived(resolved ? shouldInvert(resolved.invert) : false);

  let imgError = $state(false);
  let src = $derived(!icon || !resolved || imgError ? brokenIcon : resolved.url);
</script>

<img
  {src}
  alt={name}
  class="h-full w-full object-contain"
  style={shouldInvertDark ? 'filter: invert(1)' : ''}
  onerror={() => (imgError = true)}
/>
