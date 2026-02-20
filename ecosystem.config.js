module.exports = {
  apps: [
    {
      name: 'love-scrum-api',
      script: 'npm',
      args: 'run start',
      cwd: './backend',
    },
    {
      name: 'love-scrum-web',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend',
    },
  ],
};
