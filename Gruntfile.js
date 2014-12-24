module.exports = function(grunt) {
  var build = 'build/sms-veiwer/';
  var temp = 'temp/';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    replace: {
      sms: {
        options: {
          patterns: [
            {
              match: /src="..\/bower_components\//g,
              replacement: 'src="',
            },
            {
              match: /href="..\/bower_components\//g,
              replacement: 'href="',
            }
          ]
        },
        files: [
          {
            expand: true, 
            flatten: true, 
            src: ['src/index.html'], 
            dest: temp
          }
        ],
      }
    },
    copy: {
      sms: {
        files: [
          {
            expand: true,
            cwd: "temp/",
            src: [
              '**/*',
              '!**/*.swp'
            ],
            dest: build,
            filter: "isFile"
          },
          {
            expand: true,
            cwd: "bower_components/",
            src: [
              '**/*',
            ],
            dest: build,
          }
        ]
      }
    },
    'gh-pages': {
        sms: {
          options: {
            base: build,
            branch: 'gh-pages',
            message: 'Grunt deploy <%= grunt.template.today() %>'
          },
          src: ['**']
        }
    }
  });
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.registerTask('default', ['replace', 'copy']);
  grunt.registerTask('deploy', ['default', 'gh-pages']);
};
