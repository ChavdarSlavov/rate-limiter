const gulp = require('gulp')
const mocha = require('gulp-mocha')

gulp.task('test', () => {
  gulp.src('./mocha_test/*.js').pipe(mocha({
    reporter: 'spec',
    bail: true,
    ui: 'bdd',
  }))
})
