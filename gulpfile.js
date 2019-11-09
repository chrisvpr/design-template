"use strict";

const browsersync = require("browser-sync").create();

const gulp   = require("gulp");

const babel  = require('gulp-babel');
const minify = require("gulp-minify");

const cp     = require("child_process");
const del    = require("del");
const eslint = require("gulp-eslint");

const newer    = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');

const sass         = require("gulp-sass");
const rename       = require("gulp-rename");
const plumber      = require("gulp-plumber");
const postcss      = require("gulp-postcss");
const cssnano      = require("cssnano");
const autoprefixer = require("autoprefixer");

function browserSync(done) {
  browsersync.init({
    server: {baseDir: "./_site/"}
  });
  done();
}

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function clean() {
  return del(["./_site/assets/css", "./_site/assets/fonts"]);
}

/*
{quality: '70-90', speed: 1, floyd: 1}
*/

// Optimize Images
function images() {
  return gulp
    .src("./assets/images/**/*")
    .pipe(newer("./_site/assets/images"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        mozjpeg({quality: 80}),
        pngquant({quality: [0.7,0.90], speed: 1, floyd: 1}),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./_site/assets/images"));
}

// CSS task
function css() {
  return gulp
    .src("./assets/scss/*.scss")
    .pipe(plumber())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./_site/assets/css/"))
    .pipe(browsersync.stream());
}

// Lint scripts
function scriptsLint() {
  return gulp
    .src(["./assets/js/**/*", "./gulpfile.js"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src(["./assets/js/**/*"])
      .pipe(newer("./_site/assets/js"))
      .pipe(babel({presets: ['@babel/preset-env']}))
      .pipe(minify({noSource: true, ext: {min: '.min.js'}}))
      .pipe(gulp.dest("./_site/assets/js/"))
  );
}

// Jekyll
function jekyll() {
  return cp.spawn("bundle", ["exec", "jekyll", "build"], { stdio: "inherit" });
}

// Watch files
function watchFiles() {
  gulp.watch("./assets/scss/**/*", css);
  gulp.watch("./assets/js/**/*", gulp.series(scriptsLint, scripts));
  gulp.watch("./assets/images/**/*", images);
  gulp.watch(["./_includes/**/*","./_layouts/**/*","./_pages/**/*"], gulp.series(jekyll, browserSyncReload));
}

// Tasks that will run in parallel
const watch = gulp.parallel(watchFiles, browserSync);

// Task that will run in serie
const js    = gulp.series(scriptsLint, scripts);
const build = gulp.series(clean, gulp.parallel(css, images, jekyll, js));
const dev   = gulp.series(build, watch);

// export tasks; This will make tasks visible in the command line as well
exports.images = images;
exports.css = css;
exports.js = js;
exports.jekyll = jekyll;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = dev;
