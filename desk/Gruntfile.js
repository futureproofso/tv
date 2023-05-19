module.exports = function (grunt) {
  grunt.initConfig({
    concat: {
      options: {
        separator: "\n\n"
      },
      dist: {
        src: ['src/pages/*.html'],
        dest: 'src/pages/bundle/index.html',
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat']);
};
