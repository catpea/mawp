#!/usr/bin/env node

import Services from './src/Services.js';
const services = new Services();
await services.start();

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
