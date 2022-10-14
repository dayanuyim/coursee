'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './app/index.ts',
  output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
      fallback: {
          util: require.resolve("util/"),
          path: require.resolve('path-browserify'),
          fs: false,
      },
  },
  plugins: [
      new HtmlWebpackPlugin({
          title: "Coursee",
          favicon: 'app/images/favicon.png',
      }),
      new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          Popper: 'popper.js'
      }),
      new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "[name].css",
          chunkFilename: "[id].css"
      }),
      new CopyPlugin({
          patterns: [
              {from: 'app/data', to: 'data'},
              {from: 'app/data.sh', to: 'data.sh'},
              {from: 'app/data.json', to: 'data.json'},
              {from: 'app/images', to: 'images'},
          ],
      }),
  ],
  module: {
      rules: [{
          test: /\.tsx?$/,
          loader: 'ts-loader',
      }, {
          test: /\.(sa|sc|c)ss$/,
          use: [ MiniCssExtractPlugin.loader, 'css-loader',/* 'postcss-loader', 'sass-loader', */],
      }, {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loader: 'url-loader',
          options: {
              limit: 100000,
          },
      }],
  },
};

