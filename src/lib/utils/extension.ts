export const DANGEROUS_GLOBALS = [
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

export const SAFE_GLOBALS: Record<string, unknown> = {
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

export function evaluateValue(expr: string, context: Record<string, unknown>): unknown {
  const keys = Object.keys(context);
  const values = Object.values(context);
  const func = new Function(...keys, `"use strict"; return (${expr});`);
  try {
    return func(...values);
  } catch {
    return undefined;
  }
}

export function evaluateExpression(expr: string, context: Record<string, unknown>): string {
  const result = evaluateValue(expr, context);
  if (result === null || result === undefined) return '';
  if (typeof result === 'object') return JSON.stringify(result);
  return String(result);
}

export function substituteVariables(content: string, context: Record<string, unknown>): string {
  const exprPattern = /\{(?!\/?#|\{|\/|:)([^{}]+)\}/g;
  return content.replace(exprPattern, (match, expr, offset) => {
    const before = content.slice(0, offset);
    if (/on\w+=/i.test(before)) {
      const transformed = expr.replace(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/, 'window.__customApi.$1');
      return match.replace(expr, transformed);
    }
    return evaluateExpression(expr, context);
  });
}

export function evaluateScript(
  script: string,
  context: Record<string, unknown>,
): Record<string, unknown> {
  const safeContext: Record<string, unknown> = {
    ...SAFE_GLOBALS,
    ...context,
  };

  if (!script.trim()) return {};

  const names: string[] = [];
  let depth = 0;
  let i = 0;

  while (i < script.length) {
    const char = script[i];

    if (char === '{') {
      depth++;
      i++;
      continue;
    }
    if (char === '}') {
      depth--;
      i++;
      continue;
    }

    if (depth === 0) {
      if (script.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)) {
        const match = script.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (match) {
          names.push(match[2]);
          i += match[0].length;
          continue;
        }
      }

      if (script.slice(i).match(/^(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)) {
        const match = script.slice(i).match(/^(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (match) {
          names.push(match[2]);
          i += match[0].length;
          continue;
        }
      }
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      i++;
      while (i < script.length) {
        if (script[i] === quote && script[i - 1] !== '\\') break;
        i++;
      }
    }
    i++;
  }

  const uniqueNames = [...new Set(names)];

  const returnStmt = uniqueNames.length > 0 ? `return { ${uniqueNames.join(', ')} };` : '';
  const wrappedScript = `"use strict"; ${script}; ${returnStmt}`;

  const func = new Function(...Object.keys(safeContext), wrappedScript);
  const result = func(...Object.values(safeContext));

  let vars: Record<string, unknown> = {};
  if (result && typeof result === 'object') {
    vars = result as Record<string, unknown>;
  }

  for (const name of DANGEROUS_GLOBALS) {
    if (name in vars) {
      delete vars[name];
    }
  }
  return vars;
}

export interface ParsedTemplate {
  script: string;
  css: string;
  html: string;
}

export interface ParsedBlock {
  type: 'text' | 'each' | 'if' | 'unless' | 'const';
  content: string;
  condition?: string;
  eachExpr?: string;
  eachVar?: string;
  eachIndex?: string;
  constName?: string;
  constExpr?: string;
}

export function tokenizeTemplate(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let remaining = html;

  while (remaining.length > 0) {
    const eachMatch = remaining.match(/^\s*\{#each\s+(.+?)\s+as\s+(\w+)(?:,\s*(\w+))?\}/);
    if (eachMatch) {
      const matchIndex = eachMatch.index ?? 0;
      blocks.push({ type: 'text', content: remaining.slice(0, matchIndex) });
      const expr = eachMatch[1].trim();
      const varName = eachMatch[2];
      const idxName = eachMatch[3] || '';
      remaining = remaining.slice(matchIndex + eachMatch[0].length);
      const { inner, rest } = extractBlock(remaining, 'each');
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

    const constMatch = remaining.match(/^\s*\{@const\s+(\w+)\s*=\s*(.+?)\}/);
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

  return blocks;
}

function extractBlock(
  html: string,
  _blockType: 'each' | 'if' | 'unless',
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
  let match;

  const elseIfPattern = /\{:else\s+if\s+(.+?)\}/g;
  while ((match = elseIfPattern.exec(content)) !== null) {
    elseIfMatches.push({ condition: match[1].trim(), content: '', index: match.index });
  }

  const elseMatch = content.match(/\{:else\}/);
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

function processBlocks(
  blocks: ParsedBlock[],
  context: Record<string, unknown>,
  evaluate = false,
): string {
  let result = '';
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'text') {
      result += evaluate ? substituteVariables(block.content, context) : block.content;
      i++;
      continue;
    }

    if (block.type === 'const') {
      try {
        const value = evaluateExpression(block.constExpr!, context);
        context[block.constName!] = value;
      } catch (e) {
        console.error(e);
      }
      i++;
      continue;
    }

    if (block.type === 'each') {
      const innerBlocks = tokenizeTemplate(block.content);
      let items: unknown;

      try {
        items = evaluateValue(block.eachExpr!, context);
      } catch (e) {
        console.error(e);
        items = [];
      }

      if (!Array.isArray(items) || items.length === 0) {
        i++;
        continue;
      }

      for (let idx = 0; idx < items.length; idx++) {
        const iterContext: Record<string, unknown> = { ...context };
        iterContext[block.eachVar!] = items[idx];
        if (block.eachIndex) {
          iterContext[block.eachIndex] = idx;
        }

        if (innerBlocks.length > 0) {
          result += processBlocks(innerBlocks, iterContext, evaluate);
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
      } catch (e) {
        console.error(e);
      }

      if (!selectedBlocks) {
        for (const elseIf of elseIfs) {
          try {
            const result2 = evaluateExpression(elseIf.condition, context);
            if (result2) {
              selectedBlocks = tokenizeTemplate(elseIf.content);
              break;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (!selectedBlocks && elseContent) {
        selectedBlocks = tokenizeTemplate(elseContent);
      }

      if (selectedBlocks) {
        result += processBlocks(selectedBlocks, context, evaluate);
      }

      i++;
      continue;
    }

    if (block.type === 'unless') {
      const { ifContent, elseIfs: _elseIfs, elseContent } = parseIfContent(block.content);
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
        result += processBlocks(unlessBlocks, context, evaluate);
      } else if (elseContent) {
        const elseBlocks = tokenizeTemplate(elseContent);
        result += processBlocks(elseBlocks, context, evaluate);
      }

      i++;
      continue;
    }

    i++;
  }

  return result;
}

function processTemplate(html: string, context: Record<string, unknown>, evaluate = false): string {
  const scripts: string[] = [];
  const styles: string[] = [];

  let processed = html;

  processed = processed.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
    scripts.push(match);
    return `__SCRIPT_${scripts.length - 1}__`;
  });

  processed = processed.replace(/<style[\s\S]*?<\/style>/gi, (match) => {
    styles.push(match);
    return `__STYLE_${styles.length - 1}__`;
  });

  const blocks = tokenizeTemplate(processed);
  let result = processBlocks(blocks, context, evaluate);

  for (let i = styles.length - 1; i >= 0; i--) {
    result = result.replace(`__STYLE_${i}__`, styles[i]);
  }

  for (let i = scripts.length - 1; i >= 0; i--) {
    result = result.replace(`__SCRIPT_${i}__`, scripts[i]);
  }

  return result;
}

export function compileTemplate(
  parsed: ParsedTemplate,
  additionalContext: Record<string, unknown> = {},
): string {
  const context: Record<string, unknown> = {
    ...SAFE_GLOBALS,
    ...additionalContext,
  };

  return processTemplate(parsed.html, context, true);
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
