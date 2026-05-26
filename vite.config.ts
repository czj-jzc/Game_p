import { cp, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), assetsBridgePlugin()],
  server: {
    port: 5173,
    host: "127.0.0.1"
  },
  build: {
    outDir: "dist"
  }
});

function assetsBridgePlugin() {
  const projectRoot = process.cwd();
  const assetsRoot = path.join(projectRoot, "assets");
  const distAssetsRoot = path.join(projectRoot, "dist", "assets");

  return {
    name: "assets-bridge",
    configureServer(server: {
      middlewares: { use: (route: string, handler: (req: { url?: string }, res: NodeJS.WritableStream & { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void };
    }) {
      server.middlewares.use("/assets", async (req, res, next) => {
        const relativePath = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/^\/+/, "");
        const targetPath = path.join(assetsRoot, relativePath);
        try {
          const targetStat = await stat(targetPath);
          if (!targetStat.isFile()) {
            next();
            return;
          }
          res.setHeader("Content-Type", getContentType(targetPath));
          createReadStream(targetPath).pipe(res);
        } catch {
          next();
        }
      });
    },
    async closeBundle() {
      await cp(assetsRoot, distAssetsRoot, { recursive: true, force: true });
    }
  };
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".ogg") return "audio/ogg";
  return "application/octet-stream";
}
