"use strict";

const WebpackDevServer = require("webpack-dev-server");
const server = new WebpackDevServer(require("webpack")(require("../webpack.config.js")), {
    stats: {
        colors: true
    },

    proxy: {
        "/": {
            target: "http://localhost:3000"
        }
    }


});

server.listen(8080, "127.0.0.1", function() {
    console.log("Starting server on http://localhost:8080");
});