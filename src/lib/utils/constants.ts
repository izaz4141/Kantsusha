export const EXTERNAL_CONFIG_PATH = './config/config.yaml';

export const DEFAULT_THEME = 'light';

export const VALID_SIZES = ['small', 'full'] as const;

export const TIME_REGEX = /^(\d+)(s|m|h|d|w|mo|y)$/;
export const REDDIT_SORT_REGEX = /^(top|hot|new|controversial)$/;
export const REDDIT_TIME_REGEX = /^(hour|day|week|month|year|all)$/;
export const TARGET_REGEX = /^(_blank|_self|_parent|_top)$/;
export const CSS_UNIT_REGEX =
  /^\d+(\.\d+)?(px|rem|em|ex|ch|lh|pt|pc|cm|mm|in|Q|%|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax)$/;
export const CSS_PERCENT_REGEX = /^(\d+(\.\d+)?)%$/;
