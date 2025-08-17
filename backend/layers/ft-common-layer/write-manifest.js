const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'nodejs', 'node_modules', 'ft-common-layer');
const pkgPath = path.join(dir, 'package.json');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(pkgPath, JSON.stringify({
  name: "ft-common-layer",
  version: "1.0.0",
  main: "index.js",
  types: "index.d.ts"
}, null, 2));
console.log('Wrote layer module manifest:', pkgPath);