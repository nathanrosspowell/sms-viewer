module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'gh-pages': {
        sms: {
          options: {
            base: 'sms/build/',
            branch: 'gh-pages',
            message: 'Grunt deploy <%= grunt.template.today() %>'
          },
          src: ['**']
        }
    }
  });
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.registerTask('default', ['']);
  grunt.registerTask('deploy', ['default', 'gh-pages']);
};
