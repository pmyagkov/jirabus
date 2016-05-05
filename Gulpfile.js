'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var csso = require('gulp-csso');
var stylus = require('gulp-stylus');
var merge = require('merge-stream');
var rename = require('gulp-rename');
var sizereport = require('gulp-sizereport');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var exec = require('child_process').exec;

var bundles = require('./build/bundles.json').bundles;
var outputDir = require('./build/bundles.json').output_dir;

/**
 * Возвращает список css-бандлов
 */

function getCssBundles () {
  return bundles
    .map(function (bundle) {
      return {
        name: bundle.name,
        content: bundle.content.filter(function (item) {
          return item.type === 'css';
        })
      };
    })
    .filter(function (bundle) {
      return bundle.content.length > 0;
    })
    .map(function (bundle) {
      return {
        input: bundle.content[0].entry,
        output: {
          file: bundle.name + '.css',
          dir: outputDir.css
        }
      };
    });
}

/**
 * Возвращает список всех output CSS файлов
 */

function getOutputCssFiles () {
  return [
    './static/css/inline.css'
  ];
}

/**
 * Возвращает список всех output JS файлов
 */

function getOutputJsFiles () {
  return [
    'static/js/background.js',
    'static/js/content.js',
    'static/js/inline.js'
  ];
}

/**
 * Возвращает список всех output файлов
 */

function getOutputFiles () {
  return [
    'static/css/cal.css',
    'static/css/cal.min.css',
    'static/js/cal.js',
    'static/js/cal.min.js',
    'static/js/libs.js',
    'static/js/libs.min.js',
    'static/css/tutorial.css',
    'static/css/tutorial.min.css',
    'static/js/tutorial.js',
    'static/js/tutorial.min.js'
  ];
}

/**
 * Сборка стилей
 */

gulp.task('build:css', function() {
  return merge.apply(null, getCssBundles().map(function (bundle) {
    return gulp.src(bundle.input)
      .pipe(sourcemaps.init())
      .pipe(stylus())
      .pipe(sourcemaps.write())
      .pipe(concat(bundle.output.file))
      .pipe(gulp.dest(bundle.output.dir));
  }));
});

/**
 * Сборка скриптов
 */

gulp.task('build:js', function(cb) {
  exec('./node_modules/.bin/webpack --config ./build/webpack.config.js --display-modules', function (err, stdout, stderr) {
    // FIXME
    if (err === null && stdout.indexOf('ERROR') !== -1) {
      err = new Error(stdout);
    }
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

/**
 * Минификация Javascript файлов
 */

gulp.task('minify:js', function () {
  return gulp.src(getOutputJsFiles())
    .pipe(uglify({
      mangle: false,
      preserveComments: 'license'
    }))
    .pipe(rename(function(path) {
      path.basename = path.basename + '.min';
    }))
    .pipe(gulp.dest(outputDir.js));
});

/**
 * Минификация CSS файлов
 */

gulp.task('minify:css', function () {
  return gulp.src(getOutputCssFiles())
    .pipe(csso({
      restructure: false,
      sourceMap: false,
      debug: false
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(outputDir.css));
});

/**
 * Вывод репорта о размерах output файлов
 */

gulp.task('report', function () {
  return gulp.src(getOutputFiles())
    .pipe(sizereport({
      gzip: true,
      total: false
    }));
});

/**
 * Вотчинг изменений в CSS файлах
 */

gulp.task('watch:css', function() {
  gulp.watch([
    '**/*.styl'
  ], ['build:css']);
});

gulp.task('watch:js', function() {
  gulp.watch([
    'background/*.js',
    'content/*.js',
    'inline/*.js',
    'common/*.js'
  ], ['build:js']);
});

gulp.task('copy-assets', function () {
  return gulp.src(['img/*'])
    .pipe(gulp.dest('static/img'));
});

gulp.task('copy-manifest', function () {
  return gulp.src(['manifest.json', 'img'])
    .pipe(gulp.dest('static'));
});

gulp.task('copy', ['copy-manifest', 'copy-assets']);

gulp.task('watch', ['watch:js', 'watch:css']);

// Сборка ассетов
gulp.task('build', ['build:js', 'build:css', 'copy']);

// Минификация ассетов
gulp.task('minify', ['minify:css', 'minify:js']);

// Дефолтный таск
gulp.task('default', ['build']);
