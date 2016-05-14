import gulp from 'gulp';
import del from 'del';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync_module from 'browser-sync';

let browserSync = browserSync_module.create();

const $ = gulpLoadPlugins({
  pattern: ['gulp-*', 'gulp.*']
});

var paths = {
  styles: 'app/styles/**/*.scss',
  vendor: 'app/partials/_scripts.html',
  html: 'app/templates/pages/**/*.+(html|nunjucks)',
  scripts: 'app/scripts/**/*.js',
  images: ['app/images/**/*.svg', 'app/images/**/*.gif', 'app/images/**/*.png', 'app/images/**/*.jpg'],
  fonts: 'app/webfonts/**/*',
  icons: 'app/images/icons/**/*.svg'
};


// =======================================================================
// Styles: compiles sass, autoprefixes, and combines media queries
// =======================================================================
gulp.task('styles', () => {
  return gulp.src(paths.styles)
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 6,
      includePaths: [
        './node_modules/susy/sass',
        './bower_components/scut/dist',
        './bower_components/megatype'
      ]
    })
    .on('error', $.sass.logError))
    .pipe($.postcss([
      require('autoprefixer')({browsers: ['last 3 versions', '> 5%', 'IE >= 9']})
    ]))
    .pipe($.combineMediaQueries({
      log: true
    }))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size())
    .pipe(browserSync.stream());
});


// =======================================================================
// Lint: checks javascript for errors
// =======================================================================
function lint(files, options) {
  return () => {
  return gulp.src(files)
    .pipe($.eslint(options))
    .pipe($.eslint.format())
  };
}
const testLintOptions = {
  env: {
  mocha: true
  }
};

gulp.task('lint', lint(paths.scripts));


// =======================================================================
// Scripts: lint & concatenate scripts
// =======================================================================
gulp.task('scripts', ['lint'], () => {
  return gulp.src(paths.scripts)
    .pipe($.concat('main.js'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size());
});

// =======================================================================
// Vendor: concatenate external scripts
// =======================================================================
gulp.task('vendor', () => {
  return gulp.src([
      './bower_components/jquery/dist/jquery.js'
    ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size());
});

// =======================================================================
// Modernizr: custom build
// =======================================================================
gulp.task('modernizr', () => {
  return gulp.src([paths.scripts, paths.styles])
    .pipe($.modernizr({
      options: [
        "setClasses",
        "addTest",
        "html5printshiv",
        "testProp"
      ]
    }))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size());
});


// =======================================================================
// Images: minification
// =======================================================================
gulp.task('images', () => {
  return gulp.src(paths.images)
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});


// =======================================================================
// Process html partials
// =======================================================================
gulp.task('html', ['icons'], () => {
  $.nunjucksRender.nunjucks.configure(['app/templates/']);

  // Gets .html and .nunjucks files in pages
  return gulp.src(paths.html)
    // Renders template with nunjucks
    .pipe($.nunjucksRender())
    // output files in app folder
    .pipe(gulp.dest('.tmp'))
    .pipe($.size());
});


// =======================================================================
// Minify html, css, and js, and move all files to dist
// =======================================================================
gulp.task('fonts', () => {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('.tmp/webfonts'))
    .pipe($.size());
});

// =======================================================================
// Generate SVG sprites
// =======================================================================
var iconConfig = {
    shape                 : {
      id                : {                         // SVG shape ID related options
        generator   : "icon-%s",        // prefix id with 'icon-'
          whitespace    : '_'                       // Whitespace replacement for shape IDs
      },
        dimension         : {         // Set maximum dimensions
            maxWidth      : 64,
            maxHeight     : 64
        }
    },
    svg           : {
      namespaceClassnames : false
    },
    mode                  : {
      css         : false,
        symbol            : {
          dest      : '.',
          sprite        : "iconsprite.svg",
          prefix      : "icon-",
          inline      : true
        }
    }
};

gulp.task('icons', (done) => {
  var stream = gulp.src('**/*.svg', {cwd: 'app/images/icons'})
      .pipe($.svgSprite(iconConfig))
      .pipe(gulp.dest('app/templates/partials'));

  stream.on('end', function() {
      done();
  });
});

// =======================================================================
// Minify html, css, and js, and move all files to dist
// =======================================================================
gulp.task('minify', () => {
  return gulp.src('.tmp/**/*')
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.html', $.prettify({indent_size: 4})))
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});


// =======================================================================
// Build task: builds all files and minifies into 'dist'
// =======================================================================
gulp.task('build', ['html', 'fonts', 'images', 'styles', 'vendor', 'scripts', 'modernizr'], () => {
  gulp.start('minify');
});


// =======================================================================
// Default build
// =======================================================================
gulp.task('default', ['build'], () => {});
// alias
gulp.task('dist', ['build'], () => {});

// =======================================================================
// Development watch task.  Does not build anything initially
// =======================================================================
gulp.task('watch', (done) => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    },
    ghostMode: false
  });

  // store the timeout
  var timeout;

  // watch for changes on built files
  gulp.watch([
    '.tmp/*.html',
    '.tmp/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', function() {
    // throttle the reload to 500ms
    clearTimeout(timeout);

    if (!timeout) {
      // reload the browser
      browserSync.reload();
    }

    timeout = setTimeout(function() {
      // reset the timeout
      timeout = false;
    }, 500);
  });

  // watch the source files, and build relevant files
  gulp.watch('app/styles/**/*.scss', ['styles', 'modernizr']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('bower.json', ['vendor']);
  gulp.watch('app/templates/**/*', ['html']);
  gulp.watch('app/images/icons/**/*.svg', ['icons']);
  gulp.watch('app/fonts/**/*', ['fonts']);
});
// alias
gulp.task('develop', ['watch'], () => {});



// =======================================================================
// Development serve task.  Builds everything initially
// =======================================================================
gulp.task('serve', ['html', 'styles', 'vendor', 'scripts', 'modernizr'], () => {
  gulp.start('watch');
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', 'app/templates/partials/iconsprite.svg']));


