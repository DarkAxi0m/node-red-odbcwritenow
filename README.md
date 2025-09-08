# node-red-odbcwritenow

Node-RED node for accessing MYOB data via **ODBCWriteNow**. Useful when you want AccountRight-style ODBC-style reads/writes in Node-RED without wrangling the raw HTTP yourself.

## Features
- Node-RED palette node that talks to ODBC WriteNow
- Read/write operations against MYOB AccountRight via the ODBC WriteNow API
- Simple config for credentials and endpoint base URL

## Prerequisites
- Node-RED ≥ 4.x installed and running
- An active **ODBC WriteNow** account + API key

## Install

```bash
# install into your Node-RED user dir
cd ~/.node-red
npm install DarkAxi0m/node-red-odbcwritenow
```

Restart Node-RED.

If you manage Node-RED as a service:
```bash
sudo systemctl restart nodered
```

## Usage

1. In the Node-RED editor, open the palette and drag **ODBC WriteNow** onto your flow.
2. Double-click the node and set:
   - **Base URL**: your ODBC WriteNow endpoint (e.g. `https://myobsync.accede.com.au/`)
   - **API Key**: your issued key
   - **Operation/Path**: API route you need (e.g. download/upload endpoints per docs)
   - **Params/Body**: any query/body fields required for your action

Refer to the ODBC WriteNow developer docs for the exact routes and parameters.

Example (generic pattern):
```text
GET /api/download?table=Customers&updatedSince=2024-01-01
POST /api/upload  (JSON body with rows)
```

## License
ISC © Accede Holdings PTY LTD. See `LICENSE`.

## Links
- Repo: [DarkAxi0m/node-red-odbcwritenow](https://github.com/DarkAxi0m/node-red-odbcwritenow)
- [ODBC WriteNow – Overview & pricing](https://odbcwritenow.com/)
- [ODBC WriteNow – Developer docs](https://odbcwritenow.com/developers/)
