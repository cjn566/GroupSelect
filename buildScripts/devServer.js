"use strict";

const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../webpack.config.js");

const compiler = Webpack(webpackConfig);
const server = new WebpackDevServer(compiler, {
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