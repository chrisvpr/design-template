//https://gist.github.com/jeromecoupe/0b807b0c1050647eb340360902c3203a

const { gulp, src, dest, parallel, watch, series } = require('gulp');
const browserSync = require('browser-sync');
const sass        = require('gulp-sass');
const prefix      = require('gulp-autoprefixer');
const cp          = require('child_process');
const sourcemaps  = require('gulp-sourcemaps');

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

function jekyllBuild(){
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'});
}

function browserSyncInit(){
  browserSync({
      server: {
          baseDir: '_site'
      }
  });
}

function browserSyncReload(done) {
  browserSync.reload();
  done();
}

function sassBuild(){
  return src('_scss/main.scss')
      .pipe(sass({
          includePaths: ['scss'],
          onError: browserSync.notify
      }))
      .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
      .pipe(dest('_site/assets/css'))
      .pipe(browserSync.reload({stream:true}))
      .pipe(dest('assets/css'));
}

exports.default = series(parallel(sassBuild, jekyllBuild), browserSyncInit );

watch('./_scss/**/*.scss', sassBuild);
watch(['*.html', '*.md','_layouts/*.html' , '_posts/*', '_data/*'], series(jekyllBuild,browserSyncReload ));
