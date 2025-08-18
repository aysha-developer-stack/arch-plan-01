import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
export default defineConfig(async () => {
    const plugins = [
        react(),
        runtimeErrorOverlay(),
    ];
    // Add cartographer plugin conditionally for Replit environment
    if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
        try {
            const cartographerModule = await import("@replit/vite-plugin-cartographer");
            plugins.push(cartographerModule.cartographer());
        }
        catch (error) {
            console.warn("Failed to load cartographer plugin:", error);
        }
    }
    return {
        plugins,
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./client/src", import.meta.url)),
                "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
                "@assets": fileURLToPath(new URL("./attached_assets", import.meta.url)),
            },
        },
        root: fileURLToPath(new URL("./client", import.meta.url)),
        server: {
            port: 3001,
            fs: {
                strict: true,
                deny: ["**/.*"],
            },
        },
        build: {
            outDir: fileURLToPath(new URL("./dist/public", import.meta.url)),
            emptyOutDir: true,
            manifest: true,
        },
    };
});
//# sourceMappingURL=vite.config.js.map