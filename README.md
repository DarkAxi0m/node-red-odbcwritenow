# node-red-odbcwritenow

Node-RED node for downloading MYOB data from ODBCWriteNow / MYOBSync.

This package provides one node type: `odbcwritenow-get`.

## What It Does

The node builds and calls:

```text
https://myobsync.accede.com.au/download/{what}/json/{page}?apikey={apikey}[&filters=...][&datefrom=...][&dateto=...][&orderby=...]
```

It then:

- sends parsed JSON rows to output 1
- sends "no data" completion messages to output 2

## Prerequisites

- Node-RED `>= 4.0.0`
- Valid ODBCWriteNow / MYOBSync API key

## Install

Install in your Node-RED user directory:

```bash
cd ~/.node-red
npm install @accede/node-red-contrib-odbcwritenow
```

Restart Node-RED after installation.

## Node Configuration

Editor fields:

- `Name` (optional)
- `What` (required): dataset/resource name, for example `sales_invoice_item`
- `OrderBy` (optional): default sort expression
- `APIKey` (required unless provided in `msg.apikey`)

## Runtime Inputs (`msg`)

You can override behavior per message:

- `msg.page` (default `0`)
- `msg.apikey` (overrides configured API key)
- `msg.orderby` (overrides configured order by)
- `msg.filters`
- `msg.datefrom`
- `msg.dateto`

## Outputs

`odbcwritenow-get` has 2 outputs:

1. Data output
- `msg.payload`: parsed JSON array returned by the API
- `msg.rows`: number of rows in `payload`
- `msg.page`, `msg.what`, `msg.retry`

2. No-data output
- emitted when response contains `"no data found"`
- `msg.payload = []`
- `msg.nodata = true`
- `msg.complete = true`

## Status Behavior

- Blue ring: currently fetching
- Green dot: rows returned
- Green ring: no data found
- Red ring: timeout/token error retries or request/parsing error

## Notes

- Base URL is currently fixed to `https://myobsync.accede.com.au`.
- Timeout and token error responses are retried recursively.

## License

ISC. See [LICENSE](LICENSE).
