# routewatch

A lightweight CLI tool that monitors REST API endpoints and alerts on response time regressions or schema drift.

---

## Installation

```bash
npm install -g routewatch
```

Or use it directly with npx:

```bash
npx routewatch
```

---

## Usage

Define your endpoints in a `routewatch.config.json` file:

```json
{
  "endpoints": [
    {
      "name": "Get Users",
      "url": "https://api.example.com/users",
      "method": "GET",
      "thresholds": {
        "responseTime": 300
      }
    }
  ]
}
```

Then run the watcher:

```bash
routewatch monitor --config routewatch.config.json
```

routewatch will poll each endpoint, compare response times against your defined thresholds, and flag any unexpected changes in the response schema.

**Example output:**

```
✔  GET /users          187ms   OK
⚠  GET /products       412ms   SLOW  (threshold: 300ms)
✖  GET /orders         200ms   SCHEMA DRIFT  (missing field: "status")
```

### Options

| Flag | Description |
|------|-------------|
| `--config` | Path to config file (default: `routewatch.config.json`) |
| `--interval` | Polling interval in seconds (default: `60`) |
| `--output` | Output format: `pretty`, `json` (default: `pretty`) |

---

## License

[MIT](LICENSE)