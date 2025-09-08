async function DoImport(msg, url, node) {
    console.log('>', url)
    msg.nodata = false
    delete msg.complete
    node.status({ fill: "blue", shape: "ring", text: `Fetching #${msg.page}: ${msg.what}` })
    var datastr = ""
    try {
        const response = await fetch(url);

        datastr = await response.text();
        if (datastr.toLowerCase().includes("no data found")) {
            msg.nodata = true
            msg.complete = true
            msg.payload = []
            node.status({ fill: "green", shape: "ring", text: `#${msg.page}: No data found` })
            return node.send([null, msg]);
        }

        //Errors and retrys etc
        if (datastr.toLowerCase().includes("timeout")) {
            node.status({ fill: "red", shape: "ring", text: `#${msg.page}: MYOB Gateway Timeout` })
            console.error("******* MYOB Gateway Timeout", msg.retry, msg.page, url)
            msg.retry = msg.retry + 1
            return await DoImport(msg, url, node)
        }
        if (datastr.toLowerCase().includes("token error")) {
            node.status({ fill: "red", shape: "ring", text: `#${msg.page}: MYOB Token Error` })
            console.error("******* MYOB Token Error", msg.retry, msg.page, url)
            msg.retry = msg.retry + 1
            return await DoImport(msg, url, node)
        }
        //---------------------------------
        //Everything looks good
        const data = JSON.parse(datastr);
        msg.rows = data.length
        node.status({ fill: "green", shape: "dot", text: `#${msg.page}: ${msg.rows} Rows` })
        msg.payload = data;
        node.send([msg, null]);
    } catch (error) {
        node.status({ fill: "red", shape: "ring", text: error.message })
        console.error(error.message)
        console.log(datastr)
    }

}


module.exports = function(RED) {
    function ODBCWriteNowGet(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({ text: `` })
        node.on('input', async function(msg) {
            const page = parseInt(encodeURIComponent(msg.page || 0));
            const apikey = encodeURIComponent(msg.apikey || config.apikey);
            const what = encodeURIComponent(config.what)

            msg.page = page
            msg.what = what
            msg.retry = 0

            var filtersstr = "";
            const filters = encodeURIComponent(msg.filters || "")
            if (filters.length > 0) {
                filtersstr += `&filters=${filters}`
            }

            const datefrom = encodeURIComponent(msg.datefrom || "")
            if (datefrom.length > 0) {
                filtersstr += `&datefrom=${datefrom}`
            }

            const url = `https://myobsync.accede.com.au/download/${what}/json/${page}?apikey=${apikey}${filtersstr}`;
            DoImport(msg, url, node)

        });
    }
    RED.nodes.registerType("odbcwritenow-get", ODBCWriteNowGet);

}

