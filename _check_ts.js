const { execSync } = require('child_process');
const path = require('path');
const tsc = require.resolve('typescript/bin/tsc');

try {
  const out = execSync(`node "${tsc}" --noEmit --project packages/shared/tsconfig.json`, {
    encoding: 'utf8',
    cwd: __dirname,
  });
  console.log(out || 'SHARED: OK - no TypeScript errors');
} catch (e) {
  console.log('SHARED ERRORS:');
  console.log(e.stdout || e.message);
}

try {
  const out2 = execSync(`node "${tsc}" --noEmit --project packages/backend-core/tsconfig.json`, {
    encoding: 'utf8',
    cwd: __dirname,
  });
  console.log(out2 || 'BACKEND-CORE: OK - no TypeScript errors');
} catch (e) {
  console.log('BACKEND-CORE ERRORS:');
  console.log(e.stdout || e.message);
}
