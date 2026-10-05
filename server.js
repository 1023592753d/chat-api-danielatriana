require("dotenv").config();

const { createServer } = require("node:http");
const { WebSocket, WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  return !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

const server = createServer((request, response) => {
  const origin = request.headers.origin;

  if (!isOriginAllowed(origin)) {
    response.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Origin not allowed" }));
    return;
  }

  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin);
    response.setHeader("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Methods": "GET, OPTIONS" });
    response.end();
    return;
  }

  if (request.method === "GET" && request.url?.split("?")[0] === "/healthz") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not found" }));
});

const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

server.on("upgrade", (request, socket, head) => {
  const path = request.url?.split("?")[0];

  if (path !== "/" || !isOriginAllowed(request.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
    webSocketServer.emit("connection", webSocket, request);
  });
});

webSocketServer.on("connection", (webSocket) => {
  console.log(`Cliente conectado (${webSocketServer.clients.size} conectados)`);

  webSocket.on("message", (rawMessage, isBinary) => {
    if (isBinary) {
      webSocket.send(JSON.stringify({ type: "error", error: "Only JSON text messages are supported" }));
      return;
    }

    let message;
    try {
      message = JSON.parse(rawMessage.toString());
    } catch {
      webSocket.send(JSON.stringify({ type: "error", error: "Message must be valid JSON" }));
      return;
    }

    if (
      !message ||
      typeof message !== "object" ||
      Array.isArray(message) ||
      typeof message.user !== "string" ||
      typeof message.text !== "string"
    ) {
      webSocket.send(JSON.stringify({ type: "error", error: "Message requires string user and text fields" }));
      return;
    }

    const user = message.user.trim().slice(0, 40);
    const text = message.text.trim().slice(0, 2000);
    if (!user || !text) return;

    const chatMessage = JSON.stringify({
      user,
      text,
      timestamp: new Date().toISOString(),
    });

    for (const client of webSocketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chatMessage);
      }
    }
  });

  webSocket.on("close", () => {
    console.log(`Cliente desconectado (${webSocketServer.clients.size} conectados)`);
  });

  webSocket.on("error", (error) => {
    console.error("Error de WebSocket:", error.message);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor HTTP y WebSocket escuchando en el puerto ${PORT}`);
});