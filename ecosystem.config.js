module.exports = {
  apps: [
    {
      name: 'love-scrum-api',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      env: {
        PORT: 5005,
      },
    },
    {
      name: 'love-scrum-web',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      env: {
        PORT: 3337,
      },
    },
  ],
};
