import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
// Remove the vite config import as we'll use inline config
import { nanoid } from "nanoid";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Use inline config instead of importing from parent directory
  const viteConfig = {
    plugins: [
      // Import react plugin
      (await import('@vitejs/plugin-react')).default({
        jsxRuntime: 'automatic'
      })
    ],
    root: path.join(__dirname, '..', 'client'),
    resolve: {
      alias: {
        '@': path.join(__dirname, '..', 'client', 'src'),
        '@shared': path.join(__dirname, '..', 'shared'),
        '@assets': path.join(__dirname, '..', 'attached_assets'),
      },
    },
    build: {
      outDir: '../server/public',
    },
    server: {
      middlewareMode: true,
    }
  };
  
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by Express routes
    if (url.startsWith('/api/')) {
      console.log(`🔄 Vite middleware: Skipping API route ${url}`);
      return next();
    }

    console.log(`📄 Vite middleware: Serving SPA for ${url}`);

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Path to your built frontend (Vite output folder)
  // Check multiple possible paths for the built files
  const possiblePaths = [
    path.join(__dirname, '..', 'dist', 'public'),  // From server/dist to dist/public
    path.join(__dirname, 'public'),                // Direct public folder
    path.join(__dirname, '..', 'public'),          // Parent public folder
  ];
  
  let distPath = '';
  let indexHtmlPath = '';
  
  // Find the correct path that contains the built files
  for (const testPath of possiblePaths) {
    const indexPath = path.join(testPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      distPath = testPath;
      indexHtmlPath = indexPath;
      break;
    }
  }
  
  console.log(`📦 Attempting to serve static files from: ${distPath}`);
  console.log(`📄 Index.html path: ${indexHtmlPath}`);
  console.log(`📁 Directory exists: ${fs.existsSync(distPath)}`);
  console.log(`📄 Index.html exists: ${fs.existsSync(indexHtmlPath)}`);
  
  if (!distPath || !fs.existsSync(indexHtmlPath)) {
    console.error('❌ Could not find built frontend files!');
    console.error('   Checked paths:', possiblePaths);
    console.error('   Make sure to run the build process before starting the server.');
    
    // Serve a basic error page for all non-API routes
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      res.status(500).send(`
        <html>
          <body>
            <h1>Build Error</h1>
            <p>Frontend build files not found. Please run the build process.</p>
            <p>Checked paths: ${possiblePaths.join(', ')}</p>
          </body>
        </html>
      `);
    });
    return;
  }

  // Serve all static files (CSS, JS, images, etc.)
  app.use(express.static(distPath, {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
  }));

  // Serve index.html for any other route (SPA fallback)
  // But skip API routes - let them be handled by Express routes
  app.get('*', (req, res) => {
    const url = req.originalUrl;
    
    // Skip API routes - let them be handled by Express routes
    if (url.startsWith('/api/')) {
      console.log(`🔄 Production static: Skipping API route ${url}`);
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    console.log(`📄 Production static: Serving SPA for ${url}`);
    
    // Add error handling for sendFile
    res.sendFile(indexHtmlPath, (err) => {
      if (err) {
        console.error(`❌ Error serving index.html for ${url}:`, err);
        res.status(500).send('Error loading application');
      }
    });
  });
}

