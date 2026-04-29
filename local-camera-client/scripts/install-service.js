import { Service } from 'node-windows';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPath = resolve(__dirname, '..');

// Create a new service object
const svc = new Service({
  name: 'GHOST Local Camera Agent',
  description: 'GHOST Local Camera Agent for provisioning and streaming to GHOST Server.',
  script: resolve(rootPath, 'dist/index.js'),
  nodeOptions: [
    '--max-old-space-size=4096'
  ],
  workingDirectory: rootPath
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('GHOST Service Installed successfully.');
  svc.start();
});

// Just in case this is already installed.
svc.on('alreadyinstalled', function() {
  console.log('GHOST Service is already installed.');
});

// Listen for the "start" event and let us know when things start...
svc.on('start', function() {
  console.log(svc.name + ' service started.');
});

// Install the service
svc.install();
