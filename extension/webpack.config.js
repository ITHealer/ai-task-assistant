const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './background/service-worker.ts',
    'content/content-script': './content/content-script.ts',
    'popup/popup': './popup/App.tsx',
    'options/options': './options/options.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
        { from: 'styles', to: 'styles' },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './popup/index.html',
      filename: 'popup/index.html',
      chunks: ['popup/popup'],
    }),
    new HtmlWebpackPlugin({
      template: './options/index.html',
      filename: 'options/index.html',
      chunks: ['options/options'],
    }),
  ],
};