import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "..", "dist");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? "4173");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".wasm", "application/wasm"],
  [".txt", "text/plain; charset=utf-8"],
  [".ico", "image/x-icon"]
]);

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes.get(ext) ?? "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000"
  });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
  const normalizedPath = decodeURIComponent(requestUrl.pathname);
  const requested = path.normalize(path.join(distDir, normalizedPath));

  if (!requested.startsWith(distDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let filePath = requested;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(response, filePath);
    return;
  }

  sendFile(response, path.join(distDir, "index.html"));
});

server.listen(port, host, () => {
  console.log(`SPA preview server running at http://${host}:${port}`);
});
