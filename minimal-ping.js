/**
 * Sadece test icin: hicbir bagimlilik yok, sadece Node http.
 * Railway'de start = "node minimal-ping.js" yap. 200 donuyorsa sorun bizim uygulamada.
 */
const http = require("http");
const PORT = parseInt(process.env.PORT, 10) || 3006;

const server = http.createServer(function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*"
  });
  res.end("OK");
});

server.listen(PORT, "0.0.0.0", function () {
  console.log("Minimal ping listening on port", PORT);
});
