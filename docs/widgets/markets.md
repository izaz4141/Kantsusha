# Markets Widget

Display stock and crypto prices with charts.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | Yes | - | `markets` |
| `markets` | MarketEntry[] | Yes | - | Array of markets (min 1) |
| `title` | string | No | `Markets` | Widget title |
| `frameless` | boolean | No | `true` | Hide header |

### MarketEntry Object

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | - | Trading symbol |
| `range` | duration | No | `30d` | Chart range |
| `interval` | string | No | `1d` | Data interval |

## Symbol Examples

| Type | Symbol | Description |
|------|--------|-------------|
| Stocks | `AAPL`, `MSFT`, `NVDA` | US stocks |
| Crypto | `BTC-USD`, `ETH-USD` | Crypto pairs |
| Forex | `IDR=X`, `EUR=X` | Currency pairs |

## Example

```yaml
- type: markets
  markets:
    - code: BTC-USD
      range: 7d
    - code: ETH-USD
      range: 7d
    - code: MSFT
      range: 30d
    - code: NVDA
      range: 15d
    - code: IDR=X
```

## Use Cases

- Crypto portfolio
- Stock tracking
- Currency monitoring