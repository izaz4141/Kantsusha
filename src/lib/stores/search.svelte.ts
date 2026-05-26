import type { SearchEngine } from '$lib/types/search';

export const searchState = $state<{
  open: boolean;
  query: string;
  enabled: boolean;
  triggerKey: string;
  target: string;
  selectedEngine: string;
  engines: Record<string, SearchEngine>;
}>({
  open: false,
  query: '',
  enabled: false,
  triggerKey: '/',
  target: '_blank',
  selectedEngine: '',
  engines: {},
});

export function openSearch() {
  searchState.open = true;
  searchState.query = '';
}

export function closeSearch() {
  searchState.open = false;
  searchState.query = '';
}

export function toggleSearch() {
  if (searchState.open) {
    closeSearch();
  } else {
    openSearch();
  }
}

export function detectEngineFromQuery(
  query: string,
): { engineKey: string; cleanQuery: string } | null {
  const bangMatch = query.match(/^!(\S+)\s+/);
  if (!bangMatch) return null;

  const bang = '!' + bangMatch[1];
  const cleanQuery = query.slice(bangMatch[0].length);
  const engineKey = Object.entries(searchState.engines).find(([_, eng]) => eng.bang === bang)?.[0];

  if (engineKey) {
    return { engineKey, cleanQuery };
  }
  return null;
}
