const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Текстовые типы, подлежащие gzip/deflate сжатию
const COMPRESSIBLE_EXTS = new Set(['.html', '.css', '.js', '.json', '.svg']);

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.normalize(path.join(__dirname, reqPath));

  // Защита от выхода за пределы директории
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const lastModified = stats.mtime.toUTCString();

    // 1. Проверка условного запроса If-Modified-Since (HTTP 304 Not Modified)
    if (req.headers['if-modified-since'] === lastModified) {
      res.writeHead(304);
      res.end();
      return;
    }

    // 2. Установка заголовков кэширования
    const headers = {
      'Content-Type': contentType,
      'Last-Modified': lastModified,
      'X-Content-Type-Options': 'nosniff',
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else {
      // Кэш на 7 дней для статических ассетов
      headers['Cache-Control'] = 'public, max-age=604800, stale-while-revalidate=86400';
    }

    // 3. Сжатие gzip / deflate для поддерживаемых файлов
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldCompress = COMPRESSIBLE_EXTS.has(ext) && stats.size > 256;

    if (shouldCompress && /\bgzip\b/.test(acceptEncoding)) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(filePath)
        .pipe(zlib.createGzip({ level: 6 }))
        .pipe(res);
    } else if (shouldCompress && /\bdeflate\b/.test(acceptEncoding)) {
      headers['Content-Encoding'] = 'deflate';
      res.writeHead(200, headers);
      fs.createReadStream(filePath)
        .pipe(zlib.createDeflate())
        .pipe(res);
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

let port = parseInt(process.env.PORT, 10) || 3000;

function startServer(currentPort) {
  server.listen(currentPort, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Сервер запущен: http://localhost:${currentPort}`);
    console.log(`⚡ Оптимизация: Gzip + HTTP Cache-Control + WebP`);
    console.log(`========================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Порт ${port} занят, пробуем ${port + 1}...`);
    port++;
    startServer(port);
  } else {
    console.error('Ошибка сервера:', err);
  }
});

startServer(port);
