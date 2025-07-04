export default {
apps: [
    {
      name: 'hk-movie-helper',                 // Application name
      script: './dist/main.js',        // Entry script to run
      instances: 'max',             // 'max' to use all available CPU cores (cluster mode)
      exec_mode: 'cluster',        // Cluster mode to run multiple instances
      env: {
        NODE_ENV: 'development',   // Environment variables for development
        PORT: 3033,
      },
      env_production: {
        NODE_ENV: 'production',    // Environment variables for production
        PORT: 3033,
      },
      env_test: {
        NODE_ENV: 'test',          // Environment variables for testing
        PORT: 4000,
      },
    },
  ],
}