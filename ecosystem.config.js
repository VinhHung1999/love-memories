module.exports = {
  apps: [
    // ── Production ────────────────────────────────────────────────────────────
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
    // ── Development ───────────────────────────────────────────────────────────
    {
      name: 'love-scrum-dev-api',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
    },
    {
      name: 'love-scrum-dev-web',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
    },
  ],
};
