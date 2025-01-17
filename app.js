const ws = require("ws");
const http = require("http");
const pty = require("node-pty");

const server = http.createServer((req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js"></script>
    <link
      href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="terminal"></div>
    <script>
      const websocket = new WebSocket("/");
      const term = new Terminal();
      term.open(document.getElementById("terminal"));
      term.onData((data) => websocket.send(data));
      websocket.onmessage = (event) => term.write(event.data);
    </script>
  </body>
</html>
  `;
  res.writeHead(200);
  res.end(html);
});

const wss = new ws.Server({ server });

wss.on("connection", (ws) => {
  const ptm = pty.spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });
  ws.on("message", (message) => ptm.write(message));
  ws.on("close", () => ptm.kill());
  ptm.on("data", (data) => ws.send(data));
  ptm.on("close", () => ws.close());
});

server.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
