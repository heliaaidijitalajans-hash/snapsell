/** PM2 ile production çalıştırma: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "snapsell",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      time: true,
    },
  ],
};
