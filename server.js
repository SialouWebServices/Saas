const http = require('http');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const port = 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
  
  // Sécurité : empêcher l'accès en dehors du dossier public
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Accès interdit');
    return;
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Page non trouvée');
      return;
    }
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.css': contentType = 'text/css'; break;
      case '.js': contentType = 'text/javascript'; break;
      case '.json': contentType = 'application/json'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`🚀 SaaS RH CI MVP - Serveur démarré sur http://localhost:${port}`);
  console.log('✅ Application fonctionnelle et accessible!');
  console.log('📱 Interface optimisée mobile-first avec taille de police réduite');
});