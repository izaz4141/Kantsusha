export function portal(node: HTMLElement, target?: string) {
  if (!target) return;
  const targetEl = document.getElementById(target);
  if (!targetEl) return;
  targetEl.appendChild(node);
  return { destroy() { node.remove(); } };
}