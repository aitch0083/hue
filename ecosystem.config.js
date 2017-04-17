module.exports = {
  
  apps : [

    { //Applicarion #1
      name: "HUE",
      script: "./bin/www",
      env: {
        COMMON_VARIABLE: "true"
      },
      env_production: {
        NODE_ENV: "production"
      },
      watch: ["configs", "models", "routes", "views", "bin"],
      ignore_watch: ["node_modules", "public"],
      watch_options: {
        followSymlinks: false
      }
    }, //eo Applicarion #1

  ]
  
}//eo exports
