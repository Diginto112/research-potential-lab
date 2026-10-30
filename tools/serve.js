import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const port = Number(process.env.PORT || 8000);
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) || relative.split(/[\\/]/).some((x) => x.startsWith(".")) || /^(backend|tests|tools)[\\/]/.test(relative)) throw Error("Forbidden");
    const content = await readFile(target);
    res.writeHead(200, { "Content-Type": `${mime[path.extname(target)] || "text/plain"}; charset=utf-8`, "Cache-Control": "no-store" });
    res.end(content);
  } catch { res.writeHead(404); res.end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Research lab: http://localhost:${port}`));
