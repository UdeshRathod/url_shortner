import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import path, { join } from "path";
import crypto from "crypto";
import { link } from "fs";

const PORT = 3000;
const DATA_FILE = path.join("data", "links.json");

// Load saved links
const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    if (!data.trim()) return {};
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

// Save links
const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links, null, 2));
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
  if (req.url === "/") {
    const data = await readFile(join("public", "index.html"));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(data);
  } else if (req.url === "/style.css") {
    const data = await readFile(join("public", "style.css"));
    res.writeHead(200, { "content-type": "text/css" });
    res.end(data);
  } else if (req.url === "/links") {
    const links = await loadLinks();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(links));
  } else {
    // ✅ Handle shortCode redirects
    const links = await loadLinks();
    const shortCode = req.url.slice(1);

    if (links[shortCode]) {
      res.writeHead(302, { location: links[shortCode] });
      return res.end();
    }

    res.writeHead(404, { "content-type": "text/html" });
    res.end("404 Page not found");
  }
}

  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadLinks();
    let body = "";

    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { url, shortCode } = JSON.parse(body);

        if (!url) {
          res.writeHead(400, { "content-type": "text/plain" });
          return res.end("URL is required");
        }

        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

        if (links[finalShortCode]) {
          res.writeHead(400, { "content-type": "text/plain" });
          return res.end("Short code already exists. Please choose another.");
        }

        links[finalShortCode] = url;

        await saveLinks(links);

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
      } catch (err) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("Invalid JSON data");
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
