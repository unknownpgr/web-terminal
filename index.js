const { spawn } = require("child_process");
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const pty = require("node-pty");

const child = pty.spawn("bash", [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env,
});

const server = http.createServer((req, res) => {
  const file = __dirname + "/index.html";
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading index.html");
    }
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`received: ${message}`);
    child.stdin.write(message);
  });
});
child.on("data", (data) => {
  wss.clients.forEach((client) => {
    console.log(data.toString());
    if (client.readyState === WebSocket.OPEN) {
      client.send(data.toString());
    }
  });
});
child.on("close", (code) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`child process exited with code ${code}`);
    }
  });
});

server.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
