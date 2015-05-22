module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    bower: {
      install: {
        options: {
          targetDir: './lib',
          layout: 'byComponent'
        }
      }
    }
  });

  // Prep tasks
  grunt.registerTask("installDeps", ["bower"]);

  // Default task
  grunt.registerTask("default", [ "installDeps" ]);
};
