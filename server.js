const { spawn } = require('child_process');

// Start FastAPI server
const startFastAPI = () => {
    const fastapi = spawn('python', ['ml_backend/main.py'], {
        stdio: 'inherit',
        shell: true
    });

    fastapi.on('error', (err) => {
        console.error('Failed to start FastAPI server:', err);
    });

    return fastapi;
};

// Start Next.js
const startNextJS = () => {
    const nextjs = spawn('npm', ['run', 'next-dev'], {
        stdio: 'inherit',
        shell: true
    });

    nextjs.on('error', (err) => {
        console.error('Failed to start Next.js:', err);
    });

    return nextjs;
};

// Start both servers
const fastapi = startFastAPI();
const nextjs = startNextJS();

// Handle process termination
process.on('SIGINT', () => {
    fastapi.kill();
    nextjs.kill();
    process.exit();
});
