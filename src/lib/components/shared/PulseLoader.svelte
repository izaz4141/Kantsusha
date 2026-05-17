<script lang="ts">
  interface Props {
    message?: string;
  }

  let { message = '' }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-4">
  <div class="flex gap-1.5">
    <span class="animate-pulse-fast h-2 w-2 rounded-full bg-text-muted"></span>
    <span class="animate-pulse-medium h-2 w-2 rounded-full bg-text-muted"></span>
    <span class="animate-pulse-slow h-2 w-2 rounded-full bg-text-muted"></span>
  </div>
  {#if message != ''}
    <span class="text-sm text-text-muted">{message}</span>
  {/if}
</div>

<style>
  @keyframes pulse-fast {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes pulse-medium {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes pulse-slow {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
  .animate-pulse-fast {
    animation: pulse-fast 1s ease-in-out infinite;
  }
  .animate-pulse-medium {
    animation: pulse-medium 1s ease-in-out infinite;
    animation-delay: 0.15s;
  }
  .animate-pulse-slow {
    animation: pulse-slow 1s ease-in-out infinite;
    animation-delay: 0.3s;
  }
</style>
