import type { CustomApiParams } from '$lib/types/widget.params';
import type { CustomApiData } from '$lib/types/widget.data';
import { fetchURL } from '$lib/utils/network';

interface FetchContext {
  [fetchId: string]: unknown;
}

interface ParsedTemplate {
  script: string;
  css: string;
  html: string;
}

const DANGEROUS_GLOBALS = [
  'XMLHttpRequest',
  'WebSocket',
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'setNodeTimer',
  'setNodeCallback',
  'document',
  'window',
  'globalThis',
  'global',
  'process',
  'require',
  'module',
  'exports',
  'Buffer',
  'SafeBuffer',
  '__dirname',
  '__filename',
  'import',
  'import.meta',
];

const SAFE_GLOBALS: Record<string, unknown> = {
  Math,
  Date,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Map,
  Set,
  RegExp,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  Infinity,
  NaN,
  undefined,
  console: {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
  },
};

function interpolateUrl(
  url: string,
  context: FetchContext,
  options?: Record<string, unknown>,
): string {
  const getFetched = (id: string): unknown => {
    const data = context[id];
    if (data === undefined) throw new Error(`Unknown fetch id: ${id}`);
    return data;
  };

  const evalContext = {
    getFetched,
    ...SAFE_GLOBALS,
    options: options ?? {},
  };

  const pattern = /\$\{([^}]+)\}/g;
  return url.replace(pattern, (_match, expr) => {
    try {
      const func = new Function(...Object.keys(evalContext), `"use strict"; return (${expr});`);
      const result = func(...Object.values(evalContext));
      if (result === undefined || result === null)
        throw new Error(`Expression evaluated to undefined/null: ${expr}`);
      return String(result);
    } catch (err) {
      throw new Error(
        `Failed to interpolate URL expression "${expr}": ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  });
}

export async function fetchChain(
  fetches?: Record<
    string,
    {
      method?: 'get' | 'post';
      url: string;
      type?: 'text' | 'json';
      headers?: Record<string, string>;
      body?: string;
    }
  >,
  options?: Record<string, unknown>,
): Promise<FetchContext> {
  if (!fetches) return {};

  const context: FetchContext = {};

  for (const [id, request] of Object.entries(fetches ?? {})) {
    const url = interpolateUrl(request.url, context, options);

    let data: unknown;
    if (request.type === 'text') {
      data = await fetchURL(url, {
        method: request.method,
        customHeaders: request.headers,
        body: request.body,
        returnText: true,
      });
    } else {
      data = await fetchURL(url, {
        method: request.method,
        customHeaders: request.headers,
        body: request.body,
        returnText: false,
      });
    }

    context[id] = data;
  }

  return context;
}

export function parseTemplate(template: string): ParsedTemplate {
  const scriptMatch = template.match(/<script>([\s\S]*?)<\/script>/i);
  const styleMatch = template.match(/<style>([\s\S]*?)<\/style>/i);
  const templateMatch = template.match(/<template>([\s\S]*?)<\/template>/i);

  if (!templateMatch) {
    throw new Error('Template must contain a <template> block');
  }

  return {
    script: scriptMatch ? scriptMatch[1].trim() : '',
    css: styleMatch ? styleMatch[1].trim() : '',
    html: templateMatch[1],
  };
}

export function evaluateScript(
  script: string,
  context: FetchContext,
  options?: Record<string, unknown>,
): Record<string, unknown> {
  const getFetched = (id: string): unknown => {
    const data = context[id];
    if (data === undefined) {
      throw new Error(`Unknown fetch id: ${id}`);
    }
    return data;
  };

  const safeContext: Record<string, unknown> = {
    getFetched,
    ...SAFE_GLOBALS,
    options: options ?? {},
  };

  if (!script.trim()) return {};

  const varNames: string[] = [];
  const varPattern = /\b(const|let|var)\s+(\w+)\s*=/g;
  let match;
  while ((match = varPattern.exec(script)) !== null) {
    varNames.push(match[2]);
  }

  const wrappedScript =
    varNames.length > 0
      ? `"use strict"; ${script}; return { ${varNames.join(', ')} };`
      : `"use strict"; ${script};`;

  const func = new Function(...Object.keys(safeContext), wrappedScript);
  const result = func(...Object.values(safeContext));

  if (varNames.length === 0) return {};

  const vars: Record<string, unknown> = {};
  if (result && typeof result === 'object') {
    for (const name of varNames) {
      if (name in result) {
        vars[name] = (result as Record<string, unknown>)[name];
      }
    }
  }

  for (const name of DANGEROUS_GLOBALS) {
    if (name in vars) {
      delete vars[name];
    }
  }

  return vars;
}

function evaluateValue(expr: string, context: Record<string, unknown>): unknown {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const func = new Function(...keys, `"use strict"; return (${expr});`);
  try {
    return func(...values);
  } catch {
    return undefined;
  }
}

function evaluateExpression(expr: string, context: Record<string, unknown>): string {
  console.log('[evaluateExpression] expr:', expr);
  console.log('[evaluateExpression] context keys:', Object.keys(context));
  const result = evaluateValue(expr, context);
  console.log('[evaluateExpression] result:', result);
  if (result === null || result === undefined) return '';
  if (typeof result === 'object') return JSON.stringify(result);
  return String(result);
}

interface ParsedBlock {
  type: 'text' | 'each' | 'if' | 'unless' | 'const';
  content: string;
  condition?: string;
  eachExpr?: string;
  eachVar?: string;
  eachIndex?: string;
  constName?: string;
  constExpr?: string;
}

function tokenizeTemplate(html: string): ParsedBlock[] {
  console.log('[tokenizeTemplate] Input HTML:', html);
  const blocks: ParsedBlock[] = [];
  let remaining = html;

  while (remaining.length > 0) {
    const eachMatch = remaining.match(/^\s*\{#each\s+(.+?)\s+as\s+(\w+)(?:,\s*(\w+))?\}/);
    if (eachMatch) {
      console.log('[tokenizeTemplate] Found EACH block:', eachMatch[0]);
      const matchIndex = eachMatch.index ?? 0;
      blocks.push({ type: 'text', content: remaining.slice(0, matchIndex) });
      const expr = eachMatch[1].trim();
      const varName = eachMatch[2];
      const idxName = eachMatch[3] || '';
      remaining = remaining.slice(matchIndex + eachMatch[0].length);
      const { inner, rest } = extractBlock(remaining, 'each');
      console.log('[tokenizeTemplate] EACH inner content:', inner);
      blocks.push({
        type: 'each',
        content: inner,
        eachExpr: expr,
        eachVar: varName,
        eachIndex: idxName,
      });
      remaining = rest;
      continue;
    }

    const ifMatch = remaining.match(/^\s*\{#if\s+(.+?)\}/);
    if (ifMatch) {
      console.log('[tokenizeTemplate] Found IF block:', ifMatch[0]);
      const matchIndex = ifMatch.index ?? 0;
      blocks.push({ type: 'text', content: remaining.slice(0, matchIndex) });
      const condition = ifMatch[1].trim();
      remaining = remaining.slice(matchIndex + ifMatch[0].length);
      const { inner, rest } = extractBlock(remaining, 'if');
      blocks.push({ type: 'if', content: inner, condition });
      remaining = rest;
      continue;
    }

    const unlessMatch = remaining.match(/^\s*\{#unless\s+(.+?)\}/);
    if (unlessMatch) {
      const matchIndex = unlessMatch.index ?? 0;
      blocks.push({ type: 'text', content: remaining.slice(0, matchIndex) });
      const condition = unlessMatch[1].trim();
      remaining = remaining.slice(matchIndex + unlessMatch[0].length);
      const { inner, rest } = extractBlock(remaining, 'unless');
      blocks.push({ type: 'unless', content: inner, condition });
      remaining = rest;
      continue;
    }

    const constMatch = remaining.match(/^\s*\{\@const\s+(\w+)\s*=\s*(.+?)\}/);
    if (constMatch) {
      const matchIndex = constMatch.index ?? 0;
      blocks.push({ type: 'text', content: remaining.slice(0, matchIndex) });
      blocks.push({
        type: 'const',
        content: '',
        constName: constMatch[1].trim(),
        constExpr: constMatch[2].trim(),
      });
      remaining = remaining.slice(matchIndex + constMatch[0].length);
      continue;
    }

    const nextBlock = remaining.search(/\{#|\{@/);
    if (nextBlock === -1) {
      blocks.push({ type: 'text', content: remaining });
      break;
    }
    blocks.push({ type: 'text', content: remaining.slice(0, nextBlock) });
    remaining = remaining.slice(nextBlock);
  }

  console.log(
    '[tokenizeTemplate] Total blocks:',
    blocks.length,
    blocks.map((b) => b.type),
  );
  return blocks;
}

function extractBlock(
  html: string,
  blockType: 'each' | 'if' | 'unless',
): { inner: string; rest: string } {
  let depth = 1;
  let i = 0;
  let inString = false;
  let stringChar = '';

  while (i < html.length && depth > 0) {
    const char = html[i];

    if (inString) {
      if (char === stringChar && html[i - 1] !== '\\') {
        inString = false;
      }
    } else if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
    } else if (char === '{' && i + 1 < html.length && html[i + 1] === '#') {
      depth++;
    } else if (char === '{' && i + 1 < html.length && html[i + 1] === '/') {
      const closeMatch = html.slice(i).match(/^\{\/(?:each|if|unless)\}/);
      if (closeMatch) {
        if (depth === 1) {
          const inner = html.slice(0, i).trim();
          const rest = html.slice(i + closeMatch[0].length);
          return { inner, rest };
        }
        depth--;
      }
    }
    i++;
  }

  return { inner: html, rest: '' };
}

function parseIfContent(content: string): {
  ifContent: string;
  elseIfs: { condition: string; content: string }[];
  elseContent: string;
} {
  const elseIfMatches: { condition: string; content: string; index: number }[] = [];
  let searchFrom = 0;
  let match;

  const elseIfPattern = /\{\:else\s+if\s+(.+?)\}/g;
  while ((match = elseIfPattern.exec(content)) !== null) {
    elseIfMatches.push({ condition: match[1].trim(), content: '', index: match.index });
  }

  const elseMatch = content.match(/\{\:else\}/);
  const elseIndex: number = elseMatch?.index ?? -1;

  if (elseIndex !== -1 && elseIfMatches.some((m) => m.index > elseIndex)) {
    return { ifContent: content, elseIfs: [], elseContent: content };
  }

  const sortedElseIfs = elseIfMatches.sort((a, b) => a.index - b.index);

  let ifContent = content;
  const parsedElseIfs: { condition: string; content: string }[] = [];
  let elseContent = '';

  if (elseIndex !== -1) {
    ifContent = content.slice(0, elseIndex);
    elseContent = content.slice(elseIndex + 7);
  } else if (sortedElseIfs.length > 0) {
    const lastElseIf = sortedElseIfs[sortedElseIfs.length - 1];
    ifContent = content.slice(0, lastElseIf.index);
  }

  const effectiveElseIndex = elseIndex;
  for (let i = 0; i < sortedElseIfs.length; i++) {
    const curr = sortedElseIfs[i];
    const next = sortedElseIfs[i + 1];
    const start = curr.index + curr.condition.length + 10;
    const end = next ? next.index : effectiveElseIndex !== -1 ? effectiveElseIndex : content.length;
    parsedElseIfs.push({ condition: curr.condition, content: content.slice(start, end).trim() });
  }

  return { ifContent: ifContent.trim(), elseIfs: parsedElseIfs, elseContent: elseContent.trim() };
}

function processBlocks(blocks: ParsedBlock[], context: Record<string, unknown>): string {
  console.log('[processBlocks] Processing', blocks.length, 'blocks');
  let result = '';
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    console.log(
      '[processBlocks] Block',
      i,
      block.type,
      block.type === 'each' ? `expr: ${block.eachExpr}, var: ${block.eachVar}` : '',
    );

    if (block.type === 'text') {
      console.log('[processBlocks] Processing TEXT block');
      result += processExpressionsInText(block.content, context);
      i++;
      continue;
    }

    if (block.type === 'const') {
      try {
        const value = evaluateExpression(block.constExpr!, context);
        context[block.constName!] = value;
      } catch {
        // skip on error
      }
      i++;
      continue;
    }

    if (block.type === 'each') {
      console.log('[processBlocks] Processing EACH block');
      const innerBlocks = tokenizeTemplate(block.content);
      console.log(
        '[processBlocks] EACH innerBlocks:',
        innerBlocks.length,
        innerBlocks.map((b) => b.type),
      );
      let items: unknown;

      try {
        console.log('[processBlocks] Evaluating eachExpr:', block.eachExpr);
        items = evaluateValue(block.eachExpr!, context);
        console.log(
          '[processBlocks] Got items:',
          Array.isArray(items) ? items.length : 'not array',
        );
      } catch (e) {
        console.log('[processBlocks] Failed to evaluate eachExpr:', e);
        items = [];
      }

      if (!Array.isArray(items) || items.length === 0) {
        console.log('[processBlocks] Items empty or not array, skipping');
        i++;
        continue;
      }

      for (let idx = 0; idx < items.length; idx++) {
        const iterContext: Record<string, unknown> = { ...context };
        iterContext[block.eachVar!] = items[idx];
        if (block.eachIndex) {
          iterContext[block.eachIndex] = idx;
        }
        console.log('[processBlocks] EACH iteration', idx, 'var:', block.eachVar, '=', items[idx]);

        if (innerBlocks.length > 0) {
          result += processBlocks(innerBlocks, iterContext);
        }
      }

      i++;
      continue;
    }

    if (block.type === 'if') {
      const { ifContent, elseIfs, elseContent } = parseIfContent(block.content);
      const ifBlocks = tokenizeTemplate(ifContent);
      let selectedBlocks: ParsedBlock[] | null = null;

      try {
        const conditionResult = evaluateExpression(block.condition!, context);
        if (conditionResult) {
          selectedBlocks = ifBlocks;
        }
      } catch {
        // continue
      }

      if (!selectedBlocks) {
        for (const elseIf of elseIfs) {
          try {
            const result2 = evaluateExpression(elseIf.condition, context);
            if (result2) {
              selectedBlocks = tokenizeTemplate(elseIf.content);
              break;
            }
          } catch {
            // continue
          }
        }
      }

      if (!selectedBlocks && elseContent) {
        selectedBlocks = tokenizeTemplate(elseContent);
      }

      if (selectedBlocks) {
        result += processBlocks(selectedBlocks, context);
      }

      i++;
      continue;
    }

    if (block.type === 'unless') {
      const { ifContent, elseIfs, elseContent } = parseIfContent(block.content);
      const unlessBlocks = tokenizeTemplate(ifContent);

      let showUnless = false;
      try {
        const conditionResult = evaluateExpression(block.condition!, context);
        if (!conditionResult) {
          showUnless = true;
        }
      } catch {
        showUnless = true;
      }

      if (showUnless) {
        result += processBlocks(unlessBlocks, context);
      } else if (elseContent) {
        const elseBlocks = tokenizeTemplate(elseContent);
        result += processBlocks(elseBlocks, context);
      }

      i++;
      continue;
    }

    i++;
  }

  return result;
}

function processExpressionsInText(content: string, context: Record<string, unknown>): string {
  const exprPattern = /\{(?!\/?#|\{|\/|\:)([^}]+)\}/g;
  return content.replace(exprPattern, (_match, expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return '';
    return evaluateExpression(trimmed, context);
  });
}

function processTemplate(html: string, context: Record<string, unknown>): string {
  const blocks = tokenizeTemplate(html);
  return processBlocks(blocks, context);
}

export function compileTemplate(
  parsed: ParsedTemplate,
  scriptVars: Record<string, unknown>,
  options?: Record<string, unknown>,
): string {
  const context: Record<string, unknown> = {
    ...SAFE_GLOBALS,
    options: options ?? {},
    ...scriptVars,
  };

  return processTemplate(parsed.html, context);
}

export async function renderCustomTemplate(params: CustomApiParams): Promise<CustomApiData> {
  const context = await fetchChain(params.fetch, params.options);

  const parsed = parseTemplate(params.template);
  console.log('Script:', parsed.script);
  console.log('HTML:', parsed.html);
  console.log('Context (fetched):', Object.keys(context));

  const scriptVars = evaluateScript(parsed.script, context, params.options);
  console.log('Script vars:', scriptVars);

  const html = compileTemplate(parsed, scriptVars, params.options);
  console.log('Final HTML:', html);

  return {
    html,
    css: parsed.css,
    fetched: Object.fromEntries(
      Object.entries(context).map(([id, data]) => [
        id,
        { id, type: typeof data === 'string' ? 'text' : 'json', data },
      ]),
    ),
  };
}
