'use strict';

var path = require('path');

module.exports = {
  context: path.resolve(__dirname, '..'),
  devtool: '#cheap-module-source-map',
  resolve: {
    root: path.resolve(__dirname, '..')
  },
  entry: {
    background: './background/index.js',
    content: './content/index.js',
    inline: './inline/index.js'
  },
  output: {
    path: path.resolve('static/js'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|static|test)/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          "plugins": [
            ["transform-es2015-classes", {
              "loose": true
            }]
          ],
          cacheDirectory: true,
          compact: false
        }
      }
    ]
  }
};
