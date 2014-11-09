
module.exports = function(grunt){

    var banner = grunt.template.process(
        grunt.file.read("src/banner.js"),
        {data: grunt.file.readJSON("package.json")}
    );

    console.log(banner);

    grunt.initConfig({

        less: {
            dev: {
                files: {
                    "src/style.css": "src/style.less"
                }
            }
        },

        watch: {
            less: {
                files: ["src/style.less"],
                tasks: ["less:dev"]
            }
        },

        connect: {
            dev: {
                options: {
                    base: ".",
                    keepalive: false,
                    port: 8080
                }
            }
        },

        concat: {
            dist: {
                options: {banner: banner},
                files: {
                    "dist/tonegrid.js": ["src/tonegrid.js"]
                }
            }
        },

        uglify: {
            dist: {
                options: {banner: banner},
                files: {
                    "dist/tonegrid.min.js": ["src/tonegrid.js"]
                }
            }
        },

        copy: {
            dist: {
                files: {
                    "dist/style.css": "src/style.css"
                }
            }
        }

    });

    grunt.registerTask("dev", ["connect", "watch"]);
    grunt.registerTask("build", ["concat", "uglify", "copy"])

    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");

};

