module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
 
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    config: {
      src: 'src',
      dist: 'dist/sms-viewer',
      temp: 'temp'
    },

    watch: {
      build: {
        files: ['<%= config.src %>/**/*.{html,css,js}'],
        tasks: ['build']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          // Not looking for jQuery changes for optim
          '<%= config.dist %>/{,*/}*.html',
          '<%= config.dist %>/css/{,*/}*.css'
        ]
      }
    },

    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          open: true,
          base: [
            '<%= config.dist %>'
          ]
        }
      }
    },

    replace: {
      sms: {
        options: {
          patterns: [
            {
              match: /..\/bower_components\//g,
              replacement: '',
            }
          ]
        },
        files: [
          {
            expand: true, 
            cwd: "src/",
            src: [
                '**/*',
                '!**/*.swp'
            ],
            dest: '<%= config.temp %>'
          }
        ]
        ,
      }
    },

    copy: {
      sms: {
        files: [
          {
            expand: true,
            cwd: '<%= config.temp %>/',
            src: [
              '**/*',
              '!**/*.swp'
            ],
            dest: '<%= config.dist %>',
            filter: "isFile"
          },
          {
            expand: true,
            cwd: 'bower_components/',
            src: [
              '**/*',
            ],
            dest: '<%= config.dist %>'
          }
        ]
      }
    },

    'gh-pages': {
        sms: {
          options: {
            base: '<%= config.dist %>',
            branch: 'gh-pages',
            message: 'Grunt deploy <%= grunt.template.today() %>'
          },
          src: ['**']
        }
    },

    clean: [
      '<%= config.dist %>/**/*.*',
      '<%= config.temp %>/**/*.*',
    ]

  });

  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('build', [
      'clean',
      'replace', 
      'copy'
  ]);

  grunt.registerTask('deploy', [
      'default', 
      'gh-pages' 
  ]);

  grunt.registerTask('server', [
    'build',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

};
