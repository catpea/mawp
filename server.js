#!/usr/bin/env node

import fs from 'fs';
import Branch from 'branch';

const services = new Branch('services');

const main = new Branch('main');
main.onStart = async () => console.log('ASYNC START GRRR')
main.once('stop', ()=>console.log('Main scene node got stoppppp...'))

services.watch('create', '/services/main/*', (x)=>console.info('[CREATE] new node in main scene', x))

const uppercase = new Branch('uppercase');
const tee = new Branch('tee');

services.create(main);
services.create(uppercase);
services.create(tee);

const mainInput = new Branch('mainInput');
main.create(mainInput)

await services.load();
await services.start();

setTimeout(() => { },3_000) // TEST CTRL-C

// Example of cleanup task
const cleanup = () => {
    console.log('Cleaning up resources...');
    services.stop();
    fs.appendFileSync('shutdown.log', `Shutting down at ${new Date().toISOString()}\n`);
};

// Listen for the exit signals
process.on('SIGINT', () => {
    console.log('Received SIGINT (Ctrl+C). Graceful shutdown...');
    cleanup();
    process.exit(0);  // Exit the process after cleanup
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    cleanup();
    process.exit(0);  // Exit the process after cleanup
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
    console.error('Unhandled exception:', err);
    cleanup();
    process.exit(1);  // Exit with a non-zero status on uncaught exceptions
});

// Handle unhandled promise rejections (important for async tasks)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at', promise, 'reason:', reason);
    cleanup();
    process.exit(1);  // Exit with a non-zero status on unhandled promise rejections
});
