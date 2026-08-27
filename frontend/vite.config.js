import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn, execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Helper to find the correct Python executable with Flask installed
function getPythonCommand() {
  // 1. Try py launcher directly
  try {
    execSync('py -c "import flask"', { stdio: 'ignore' });
    console.log('\x1b[32m[FreshScan] Detected Flask via py launcher\x1b[0m');
    return { cmd: 'py', args: ['app.py'] };
  } catch (e) {}

  // 2. Try py -3.8 (runs python 3.8 where dependencies are installed)
  try {
    execSync('py -3.8 -c "import flask"', { stdio: 'ignore' });
    console.log('\x1b[32m[FreshScan] Detected Python 3.8 via launcher (py -3.8)\x1b[0m');
    return { cmd: 'py', args: ['-3.8', 'app.py'] };
  } catch (e) {}

  // 3. Try the exact global path for Python38 if it exists
  const globalPath = 'C:\\Program Files\\Python38\\python.exe';
  if (fs.existsSync(globalPath)) {
    try {
      execSync(`"${globalPath}" -c "import flask"`, { stdio: 'ignore' });
      console.log('\x1b[32m[FreshScan] Detected Python 3.8 at C:\\Program Files\\Python38\\python.exe\x1b[0m');
      return { cmd: globalPath, args: ['app.py'] };
    } catch (e) {}
  }

  // 4. Fallback to default python
  console.log('\x1b[33m[FreshScan] Falling back to default "python" command\x1b[0m');
  return { cmd: 'python', args: ['app.py'] };
}

// Vite plugin to auto-start the Flask backend server during development
function flaskBackendPlugin() {
  let backendProcess = null;
  return {
    name: 'flask-backend',
    configureServer(server) {
      console.log('\x1b[36m[FreshScan] Starting Flask backend server...\x1b[0m');
      const backendDir = path.resolve(__dirname, '../backend');
      
      const pyConfig = getPythonCommand();
      
      // Spawn python app.py
      backendProcess = spawn(pyConfig.cmd, pyConfig.args, {
        cwd: backendDir,
        stdio: 'inherit',
        shell: true
      });

      backendProcess.on('error', (err) => {
        console.error('\x1b[31m[FreshScan] Failed to start Flask backend:\x1b[0m', err);
      });


      // Ensure cleanup of the child process on Vite exit
      const cleanup = () => {
        if (backendProcess) {
          console.log('\x1b[33m[FreshScan] Stopping Flask backend server...\x1b[0m');
          backendProcess.kill();
          backendProcess = null;
        }
      };

      process.on('exit', cleanup);
      process.on('SIGINT', () => {
        cleanup();
        process.exit();
      });
      process.on('SIGTERM', () => {
        cleanup();
        process.exit();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), flaskBackendPlugin()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
})

