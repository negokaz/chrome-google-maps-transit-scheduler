import gulp from 'gulp';
import pipe from 'multipipe'
var $ = require('gulp-load-plugins')();

import { build as config } from '../config.babel';
import polybuild from 'polybuild';
import runSequence from 'run-sequence';
import { argv } from 'yargs';

gulp.task('build', (callback) =>
  runSequence(
    'build-bower-update',
    'build-sources',
  callback)
);

gulp.task('build-bower-update', (callback) =>
  $.bower({
    cmd: 'update',
    directory: `${config.base.sourceDirectory}/bower_components`
  }, callback)
);

gulp.task('build-sources', (callback) =>
  runSequence(
    ['build-manifest', 'build-less', 'build-view', 'build-icon', 'build-assets'],
  callback)
);

gulp.task('build-manifest', ['build-bump-up-version'], () =>
  gulp.src(`${config.manifest.directory}/${config.manifest.fileName}`)
      .pipe(gulp.dest(config.buildDirectory))
);

gulp.task('build-less', () =>
  gulp.src(`${config.less.directory}/**/*.less`)
      .pipe($.less({
          paths: ['.'],
          compress: true
        }))
      .pipe(gulp.dest(`${config.buildDirectory}/style`))
);

gulp.task('build-icon', () =>
  gulp.src(config.icon.filePath)
      .pipe($.mirror(
        pipe($.svg2png({width: 16, height: 16}), $.rename({basename: "icon_16"})),
        pipe($.svg2png({width: 32, height: 32}), $.rename({basename: "icon_32"})),
        pipe($.svg2png({width: 48, height: 48}), $.rename({basename: "icon_48"})),
        pipe($.svg2png({width: 128, height: 128}), $.rename({basename: "icon_128"}))
      ))
      .pipe(gulp.dest(`${config.buildDirectory}/icon`))
);

// FIXME: 相対パスやめる
var manifest = require(`../../${config.manifest.directory}/${config.manifest.fileName}`);

gulp.task('build-bump-up-version', () => {

  let bumpUpVersion = (type, currentVersion) => {
    var version = currentVersion.split('.');
    switch (type) {
      case 'major':
        version[0] = (version[0] - 0) + 1;
        version[1] = 0;
        version[2] = 0;
        break;
      case 'minor':
        version[1] = (version[1] - 0) + 1;
        version[2] = 0;
        break;
      case 'patch':
        version[2] = (version[2] - 0) + 1;
        break;
      default:
        break;
    }
    return version.join('.');
  };

  var bumpedUpVersion = bumpUpVersion(argv.version, manifest.version);
  var versionIsChanged = manifest.version != bumpedUpVersion;

  /*
   * Auto-Reload がかかってしまうのを防ぐために
   * manifest の内容が変更されたときのみ manifest を書き出す
   */
  if (versionIsChanged) {
    gulp.src(`${config.manifest.directory}/${config.manifest.fileName}`)
        .pipe($.jsonEditor({version: bumpedUpVersion}))
        .pipe(gulp.dest(config.manifest.directory));

    $.util.log(`Bumped up version: '${manifest.version}' to '${bumpedUpVersion}'`);
  }
});

gulp.task('build-view', () =>
  gulp.src(`${config.base.sourceDirectory}/view/**/*.html`)
      .pipe(polybuild({maximumCrush: true, suffix: ''}))
      .pipe(gulp.dest(`${config.buildDirectory}/view`))
);

gulp.task('build-assets', ['build-include-assets'], () => {

  var assets = [
    `${config.base.sourceDirectory}/**/*`,
    `!${config.base.sourceDirectory}/view/**/*.html`,
    `!${config.base.sourceDirectory}/**/*.less`,
    `!${config.manifest.directory}/${config.manifest.fileName}`
  ];

  for (var exclude of config.exclude) {
    assets.push(`!${config.base.sourceDirectory}/${exclude}`);
  }

  gulp.src(assets)
      .pipe($.ignore.include({isFile: true}))
      .pipe(gulp.dest(config.buildDirectory));
});

gulp.task('build-include-assets', () => {

  var assets = [];

  for (var include of config.include) {
    assets.push(`${config.base.sourceDirectory}/${include}`);
  }

  gulp.src(assets, {base: config.base.sourceDirectory})
      .pipe(gulp.dest(config.buildDirectory));
});
