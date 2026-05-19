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

### Interpolation

Access fetch results with `${fetched.id.path}`:

## Example

```yaml
- type: custom-api
  fetch:
    weather:
      url: https://api.weather.com/current?city=Tokyo
      headers:
        X-API-Key: 'your-key'
  template: |
    <style>
      .weather {
        color: var(--color-text);
      }
      .temp { font-size: 2rem; }
    </style>

    template: |
    <script>
      const greeting = 'Temperature';
    </script>

    <style>
      .weather { color: var(--color-text); }
      .temp { font-size: 2rem; }
    </style>

    <template>
      <div class="weather">
        <p>{greeting}: <span class="temp">${fetched.weather.temp}°C</span></p>
        <p>${fetched.weather.condition}</p>
      </div>
    </template>
```

### Key Points

- Data fetching happens **server-side**
- `<script>`, `<style>`, and `<template>` blocks are all rendered **client-side**
- `<script>` block for JavaScript (optional, root level only)
- `<style>` block for CSS (optional, root level only)
- `<template>` block for HTML structure (required)
- `<template>` can contain nested `<style>` and `<link>` tags
- `<template>` **cannot** contain `<script>` tags
- Use `${fetched.id.path}` for interpolation

## Use Cases

- Custom integrations
- Internal APIs
- Complex data visualization
