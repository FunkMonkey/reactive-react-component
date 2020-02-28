const path = require( 'path' );
const gulp = require( 'gulp' );
const sourcemaps = require( 'gulp-sourcemaps' );
const typescript = require( 'gulp-typescript' );
const package = require( './package.json' );

function watchTask( task ) {
  const watcher = gulp.watch( [task.SRC_GLOB], { cwd: __dirname }, task);
  watcher.on( 'add', path => { console.log('File ' + path + ' was added, running tasks...'); });
  watcher.on( 'change', path => { console.log('File ' + path + ' was changed, running tasks...'); });
}

// build task
const SCRIPTS_SRC_GLOB =  './src/**/*.ts*';
const SCRIPTS_DEST = './build';

const CONFIGPATH = path.join( __dirname, 'tsconfig.json' );

const tsProject = typescript.createProject( CONFIGPATH );
tsProject.options.configFilePath = CONFIGPATH; // due to bug in gulp-typescript

const buildScripts = () =>
  gulp.src( SCRIPTS_SRC_GLOB, { cwd: __dirname } )
      .pipe( sourcemaps.init() )
      .pipe( tsProject() )
      .pipe( sourcemaps.write( '.' ) )
      .pipe( gulp.dest( SCRIPTS_DEST, { cwd: __dirname } ) );

buildScripts.displayName = 'build:scripts';
buildScripts.SRC_GLOB = SCRIPTS_SRC_GLOB;

// watch:build task
const watchBuildScripts = () => watchTask( buildScripts );
watchBuildScripts.displayName = package.name + ' watch:build';

// exports
module.exports['build'] = buildScripts;
module.exports['watch:build'] = watchBuildScripts;
