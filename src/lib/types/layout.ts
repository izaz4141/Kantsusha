import type { Snippet } from 'svelte';

export interface Panel {
  size: string;
  content: Snippet<[number]>;
}

export interface LayoutProps {
  panels: Panel[];
  currentPanel?: number;
}
