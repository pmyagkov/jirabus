'use strict';

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config.js');

var compiler = webpack(webpackConfig);

var devServer = new WebpackDevServer(compiler, {
  hot: false,
  https: true,
  quiet: false,
  noInfo: false,
  lazy: false,
  stats  : {
    colors : true
  },
  historyApiFallback: true
});

var port = 9448;

devServer.listen(port, 'localhost', function () {
  console.log('Webpack dev server running at localhost:' + port);
});
