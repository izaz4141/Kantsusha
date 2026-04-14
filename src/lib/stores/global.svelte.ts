import { browser } from '$app/environment';

const MD_BREAKPOINT = 768;

export const uiState = $state<{
  layoutType: string;
  numPanel: number;
  isMobile: boolean;
}>({
  layoutType: 'default',
  numPanel: 1,
  isMobile: false,
});

if (browser) {
  const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);

  uiState.isMobile = mql.matches;

  mql.addEventListener('change', (e) => {
    uiState.isMobile = e.matches;
  });
}
