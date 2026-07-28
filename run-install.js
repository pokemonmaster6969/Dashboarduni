
const cp = require('child_process');
const path = require('path');
const cwd = path.join(__dirname);

const child = cp.spawn('npx', ['pnpm', 'install'], {
  stdio: 'inherit',
  cwd,
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
