function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function DoImport(msg, url, node, maxRetries, baseBackoffMs) {
    console.log('>', url)
    msg.nodata = false
    delete msg.complete
    let datastr = ""
    let attempt = 0

    while (attempt <= maxRetries) {
        msg.retry = attempt
        node.status({ fill: "blue", shape: "ring", text: `Fetching #${msg.page}: ${msg.what} (try ${attempt + 1}/${maxRetries + 1})` })

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`)
            }
            datastr = await response.text();

            if (datastr.toLowerCase().includes("no data found")) {
                console.log("no data found");
                msg.nodata = true
                msg.complete = true
                msg.payload = []
                node.status({ fill: "green", shape: "ring", text: `#${msg.page}: No data found` })
                return node.send([null, msg]);
            }

            // Retry only for gateway timeout and token error responses.
            if (datastr.toLowerCase().includes("timeout") || datastr.toLowerCase().includes("token error")) {
                const isLastTry = attempt >= maxRetries
                const kind = datastr.toLowerCase().includes("timeout") ? "MYOB Gateway Timeout" : "MYOB Token Error"

                if (isLastTry) {
                    node.status({ fill: "red", shape: "ring", text: `#${msg.page}: ${kind} (max retries reached)` })
                    return node.error(`${kind} after ${maxRetries + 1} attempts`, msg)
                }

                const delayMs = Math.max(0, baseBackoffMs) * Math.pow(2, attempt)
                node.status({ fill: "red", shape: "ring", text: `#${msg.page}: ${kind}, retrying in ${delayMs}ms` })
                console.error("*******", kind, attempt, msg.page, `retry in ${delayMs}ms`)
                attempt += 1
                await sleep(delayMs)
                continue
            }

            //---------------------------------
            // Everything looks good.
            const data = JSON.parse(datastr);
            msg.rows = data.length
            console.log("Page:", msg.page, "Rows:", data.length)

            node.status({ fill: "green", shape: "dot", text: `#${msg.page}: ${msg.rows} Rows` })
            msg.payload = data;
            return node.send([{ "rows": msg.rows }, null]);
        } catch (error) {
            node.status({ fill: "red", shape: "ring", text: error.message })
            console.error(error.message)
            console.log(datastr)
            return
        }
    }

}


module.exports = function(RED) {
    function ODBCWriteNowGet(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({ text: `` })
        node.on('input', async function(msg) {
            const pageRaw = msg.page === undefined || msg.page === null || msg.page === "" ? 0 : msg.page
            const page = parseInt(pageRaw, 10)
            const apikeyRaw = msg.apikey || config.apikey
            const whatRaw = config.what
            const orderby = encodeURIComponent(msg.orderby || config.orderby);

            if (!whatRaw || String(whatRaw).trim().length === 0) {
                node.status({ fill: "red", shape: "ring", text: "Invalid config: 'what' is required" })
                node.error("Invalid config: 'what' is required", msg)
                return
            }

            if (!apikeyRaw || String(apikeyRaw).trim().length === 0) {
                node.status({ fill: "red", shape: "ring", text: "Missing API key" })
                node.error("Missing API key: set config.apikey or msg.apikey", msg)
                return
            }

            if (Number.isNaN(page) || page < 0) {
                node.status({ fill: "red", shape: "ring", text: "Invalid page: must be >= 0" })
                node.error(`Invalid page '${pageRaw}': must be a non-negative integer`, msg)
                return
            }

            const apikey = encodeURIComponent(apikeyRaw);
            const what = encodeURIComponent(whatRaw)



            msg.page = page
            msg.what = whatRaw
            const maxRetries = Number.isInteger(parseInt(config.maxRetries, 10))
                ? Math.max(0, parseInt(config.maxRetries, 10))
                : 3
            const backoffMs = Number.isInteger(parseInt(config.retryBackoffMs, 10))
                ? Math.max(0, parseInt(config.retryBackoffMs, 10))
                : 500

            var orderbystr = "";
            var filtersstr = "";
            const filters = encodeURIComponent(msg.filters || "")
            if (filters.length > 0) {
                filtersstr += `&filters=${filters}`
            }

            const datefrom = encodeURIComponent(msg.datefrom || "")
            if (datefrom.length > 0) {
                filtersstr += `&datefrom=${datefrom}`
            }

            const dateto = encodeURIComponent(msg.dateto || "")
            if (dateto.length > 0) {
                filtersstr += `&dateto=${dateto}`
            }

            if (orderby.length > 0) {
                orderbystr += `&orderby=${orderby}`
            }

            const url = `https://myobsync.accede.com.au/download/${what}/json/${page}?apikey=${apikey}${filtersstr}${orderbystr}`;
            DoImport(msg, url, node, maxRetries, backoffMs)

        });
    }
    RED.nodes.registerType("odbcwritenow-get", ODBCWriteNowGet);

}
