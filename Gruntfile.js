/**
 * Created by meathill on 14-1-24.
 */
module.exports = function (grunt) {
  var isSingle = this.cli.tasks.length === 1 && this.cli.tasks[0] === 'single'
    , config = grunt.file.readJSON('grunt-config.json')
    , BUILD =  config[isSingle ?  'single': 'build']
    , TEMP = config.temp
    , target = isSingle ? 'single.html' : 'index.html'
    , CSS_REG = /<link rel="stylesheet" href="(\S+)">/g
    , JS_REG = /<script src="(\S+)"><\/script>/g
    , csses = []
    , libs = []
    , jses = [];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      start: [BUILD, '../popo.<%= pkg.version %>.zip', '../single.<%= pkg.version %>.zip'],
      end: [TEMP]
    },
    index: {
      index: 'index.html',
      single: 'single.html'
    },
    copy: {
      font: {
        files: [{
          expand: true,
          cwd: 'bower_components/font-awesome/fonts/',
          src: ['*.{ttf,otf}'],
          dest: BUILD + 'fonts/'
        }]
      }
    },
    sass: {
      css: {
        options: {
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: 'css/',
          src: ['*.sass'],
          dest: 'css/',
          ext: '.css'
        }]
      }

    },
    imagemin: {
      img: {
        files: [{
          expand: true,
          cwd: 'img/',
          src: ['**/*.{png,jpg}'],
          dest: BUILD + 'img/'
        }]
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        compress: {
          global_defs: {
            'DEBUG': false,
            'PHONEGAP': false
          },
          dead_code: true,
          unused: true,
          drop_console: true
        },
        report: 'gzip'
      },
      js: {
        files: [{
          src: jses,
          dest: TEMP + (isSingle ? 'single' : 'index') + '.js'
        }]
      }
    },
    replace: {
      version: {
        options: {
          patterns: [{
            match: 'version',
            replacement: '<%= pkg.version %>'
          }]
        },
        files: [{
          src: [TEMP + 'index.js'],
          dest: TEMP + 'index.js'
        }]
      }
    },
    concat: {
      js: {
        options: {
          separator: ';\n'
        },
        src: libs,
        dest: BUILD + 'js/' + (isSingle ? 'single' : 'index') + '.js'
      },
      css: {
        src: csses,
        dest: BUILD + 'css/style.css'
      }
    },
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeEmptyAttributes: true
      },
      index: {
        files: [{
          src: TEMP + target,
          dest: BUILD + target
        }]
      },
      template: {
        files: [{
          expand: true,
          cwd: 'template/',
          src: ['all.html', 'offline.html'],
          dest: BUILD + 'template/'
        }]
      }
    },
    compress: {
      app: {
        options: {
          archive: '../' + (isSingle ? 'single' : 'popo') + '.<%= pkg.version %>.zip',
          mode: 'zip',
          pretty: true
        },
        files: [{
          expand: true,
          cwd: BUILD,
          src: ['**'],
          dest: ''
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-replace');

  grunt.registerMultiTask('index', 'make index html', function () {
    var html = grunt.file.read(this.data);
    // 取CSS
    html = html.replace(CSS_REG, function (match, src) {
      csses.push(src);
      return '';
    });
    html = html.replace(JS_REG, function (match, src) {
      var isLib = src.substr(0, 2) !== 'js';
      if (src.indexOf('define.js') !== -1) {
        return '';
      }
      isLib ? libs.push(src) : jses.push(src);
      return /index|single\.js/.test(src) ? match : '';
    });
    libs.push(TEMP + grunt.cli.tasks[0] + '.js');
    html = html.replace('<title>', '<link rel="stylesheet" href="css/style.css"><title>');
    grunt.file.write(TEMP + this.data, html);
  });
  grunt.registerTask('version', 'create a version file', function () {
    var version = {
      version: grunt.config.get('pkg').version,
      build: grunt.template.today('yyyy-mm-dd hh:MM:ss')
    };
    grunt.file.write(config.version, JSON.stringify(version));
  });

  grunt.registerTask('default', [
    'clean:start',
    'index:index',
    'copy',
    'sass',
    'imagemin',
    'uglify',
    'replace',
    'concat',
    'htmlmin',
    'compress',
    'version',
    'clean:end'
  ]);
  grunt.registerTask('single', [
    'clean:start',
    'index:single',
    'copy',
    'sass',
    'imagemin',
    'uglify',
    'replace',
    'concat',
    'htmlmin',
    'compress',
    'version',
    'clean:end'
  ]);
};