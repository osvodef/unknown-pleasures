const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = function(env = {}) {
    return {
        mode: env.production ? 'production' : 'development',
        devServer: {
            port: 3000,
            host: '0.0.0.0',
            stats: {
                children: false,
            },
        },
        entry: './src/index.ts',
        output: {
            path: path.join(__dirname, 'dist'),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {test: /\.ts$/, loader: 'ts-loader'},
                {test: /\.glsl$/, loader: 'webpack-glsl-loader'},
            ],
        },
        resolve: {
            extensions: ['.ts', '.js', '.glsl'],
        },
        plugins: [
            new CopyWebpackPlugin(['assets']),
        ],
        stats: {
            children: false,
        },
        performance: {
            hints: false,
        },
    };
};
