const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin(
    {
        template: './client/index.html',
        filename: 'index.html',
        inject: 'body'
    }
)

module.exports = {
    devtool: '',
    entry: './client/index.js',
    output: {
        path: path.resolve('dist'),
        filename: 'index_bundle.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, loaders: ['babel-loader'], exclude: /node_modules/ },
            { test: /\.jsx$/, loaders: ['babel-loader'], exclude: /node_modules/ }
        ]
    },

    plugins: [HtmlWebpackPluginConfig],
}