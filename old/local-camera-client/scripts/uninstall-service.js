import { Service } from 'node-windows';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');

const svc = new Service({
  name: 'GHOST Local Camera Agent',
  script: resolve(rootPath, 'dist/index.js')
});

svc.on('uninstall', function() {
  console.log('GHOST Service Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

svc.uninstall();
