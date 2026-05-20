# Custom API Widget

Fetch data from any API and render with a custom HTML template.

## Parameters

| Parameter  | Type   | Required | Description          |
| ---------- | ------ | -------- | -------------------- |
| `type`     | string | Yes      | `custom-api`         |
| `fetch`    | object | No       | Named fetch requests |
| `template` | string | Yes      | HTML template        |
| `options`  | object | No       | Additional config    |

### ApiRequest Object

| Field     | Type   | Required | Default | Description      |
| --------- | ------ | -------- | ------- | ---------------- |
| `method`  | string | No       | `get`   | `get` or `post`  |
| `url`     | string | Yes      | -       | Request URL      |
| `type`    | string | No       | `json`  | `json` or `text` |
| `headers` | object | No       | -       | HTTP headers     |
| `body`    | string | No       | -       | POST body        |

## Template Structure

Templates use Svelte-like syntax with three blocks:

```html
<script>
  // JavaScript - computed values, helpers
  const name = 'World';
</script>

<style>
  /* CSS styles */
  .card {
    color: var(--color-text);
  }
</style>

<template>
  <!-- HTML content - can include style, link, div, etc. -->
  <!-- Cannot include script blocks inside template -->
  <div class="card">
    <link rel="stylesheet" href="..." />
    <style>
      .inline {
        color: red;
      }
    </style>
    <h2>Hello ${name}</h2>
  </div>
</template>
```

### Block Rules

| Block               | Location   | Allowed Content                          |
| ------------------- | ---------- | ---------------------------------------- |
| `<script>`          | Root level | JavaScript (computed values, helpers)    |
| `<style>`           | Root level | CSS rules                                |
| `<template>`        | Root level | HTML, `<style>`, `<link>`, `<div>`, etc. |
| Inside `<template>` | -          | **NOT** `<script>`                       |

### Interpolation Syntax

There are two interpolation modes with different purposes:

| Syntax          | Location    | Purpose                                                                |
| --------------- | ----------- | ---------------------------------------------------------------------- |
| `${expression}` | URL strings | **Server-side** - used in `fetch.url` to chain requests                |
| `{expression}`  | Template    | **Client-side** - used in `<script>` and `<template>` to render values |

**Server-side (URL interpolation):**

```yaml
fetch:
  geo:
    url: https://api.example.com/search?q=${options.city}
  weather:
    url: https://api.example.com/weather/${fetched.geo.resultId}
```

**Client-side (template interpolation):**

```html
<script>
  const temp = fetched.weather.temp;
  function formatTemp(t) {
    return t + '°C';
  }
</script>

<template>
  <p>Current: {temp}</p>
  <p>Formatted: {formatTemp(temp)}</p>
</template>
```

## How It Works

1. **Server-side**: All `fetch` requests execute first, in order. Subsequent requests can reference previous results using `${fetched.id.path}` in their URLs.
2. **Client-side**: The `<script>` block runs first, then `<template>` renders with all computed values available.

## Options Object

Pass custom configuration accessible in both script and template:

```yaml
options:
  temp_unit: celsius
  location: Tokyo
  theme: dark
```

Access in script:

```javascript
const unit = options.temp_unit;
const display = options.location + ' (' + unit + ')';
```

Access in template:

```html
<p>Location: {options.location}</p>
```

## Svelte-Like Template Syntax

The `<template>` block supports Svelte-style expressions:

### Basic Expression

```html
<p>Temperature: {fetched.weather.temp}°C</p>
<p>Status: {fetched.weather.status || 'unknown'}</p>
```

### {@const} - Define Local Constants

```svelte
{@const temp = fetched.weather.temp}
{@const isHot = temp > 25}
<p>{isHot ? 'Hot!' : 'Nice'}</p>
```

### {#each} - Loop Over Arrays

```svelte
{#each fetched.users as user}
  <li>{user.name}</li>
{/each}

{#each fetched.items as item, i}
  <li>{i + 1}. {item.name}</li>
{/each}
```

### {#if} - Conditional Rendering

```svelte
{#if fetched.weather.temp > 30}
  <p>Hot weather!</p>
{:else if fetched.weather.temp > 20}
  <p>Nice weather</p>
{:else}
  <p>Cold</p>
{/if}
```

### {#unless} - Negative Conditional

```svelte
{#unless options.hideTitle}
  <h1>Weather</h1>
{/unless}
```

## Functions and window.\_\_customApi

### Defining Functions

Define functions in the `<script>` block to create interactive widgets:

```html
<script>
  async function refreshData() {
    const res = await fetch('/api/data');
    const data = await res.json();
    document.getElementById('container').innerHTML = 'Updated: ' + data.value;
  }
</script>

<template>
  <button onclick="refreshData()">Refresh</button>
  <div id="container"></div>
</template>
```

Functions defined in `<script>` are automatically exposed to `window.__customApi`.

### Calling Functions Directly

When you call a function directly in an event handler, the system automatically prefixes it:

```html
<button onclick="refreshData()">Refresh</button>
<!-- Automatically transformed to: onclick="window.__customApi.refreshData()" -->
```

### Calling Functions Within Functions (Important!)

If your function calls another function you defined, you MUST use the `window.__customApi` prefix:

```html
<script>
  function helper() {
    return 'help';
  }

  function main() {
    return helper(); // WRONG - will fail!
    return window.__customApi.helper(); // CORRECT
  }
</script>

<template>
  <button onclick="main()">Call</button>
</template>
```

## Available Globals

These are available in `<script>` without any prefix:

- **Math**: `Math.min()`, `Math.max()`, `Math.round()`, etc.
- **Date**: `new Date()`, `Date.now()`
- **JSON**: `JSON.stringify()`, `JSON.parse()`
- **Array**: `map()`, `filter()`, `reduce()`, etc.
- **Object**: `Object.keys()`, `Object.values()`
- **Utilities**: `parseInt()`, `parseFloat()`, `isNaN()`, `encodeURIComponent()`
- **Console**: Available but muted (no-op)

## Example

```yaml
- type: custom-api
  cache: 5m
  options:
    city: Tokyo
    color: '#46F0F0'
  fetch:
    weather:
      url: https://api.weather.com/v1/forecast?city=${options.city}
      headers:
        X-API-Key: 'your-key'
  template: |
    <script>
      function getEmoji(code) {
        return code === 0 ? '☀️' : code === 1 ? '⛅' : '🌧️';
      }
    </script>

    <style>
      .weather { color: var(--color-text); }
      .temp { font-size: 2rem; color: {options.color}; }
    </style>

    <template>
      {@const current = fetched.weather.current}
      {#if current}
        <div class="weather">
          <span class="temp">{current.temp}°C</span>
          <span>{getEmoji(current.code)}</span>
        </div>
      {:else}
        <p>No data available</p>
      {/if}
    </template>
```

### Key Points

- Data fetching happens **server-side**
- `<script>`, `<style>`, and `<template>` blocks are all rendered **client-side**
- Use `${expression}` in fetch URLs (server-side interpolation)
- Use `{expression}` in template (client-side interpolation)
- Functions calling other functions must use `window.__customApi.funcName()`

## Use Cases

- Custom integrations
- Internal APIs
- Complex data visualization
