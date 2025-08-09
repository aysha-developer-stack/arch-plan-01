import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
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

  // Resolve the async vite config
  const resolvedViteConfig = typeof viteConfig === 'function' ? await viteConfig({ command: 'serve', mode: 'development' }) : viteConfig;
  
  const vite = await createViteServer({
    ...resolvedViteConfig,
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
  const distPath = path.join(__dirname, 'public');

  // Serve all static files (CSS, JS, images, etc.)
  app.use(express.static(distPath));

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
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

