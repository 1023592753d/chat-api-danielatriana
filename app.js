import { WS_URL } from "./config.js";

const connectionIndicator = document.querySelector("#connection");
const connectionLabel = document.querySelector("#connection-label");
const messages = document.querySelector("#messages");
const emptyState = document.querySelector("#empty-state");
const usernameInput = document.querySelector("#username");
const messageInput = document.querySelector("#message-input");
const messageForm = document.querySelector("#message-form");
const sendButton = document.querySelector("#send-button");
const composerHint = document.querySelector("#composer-hint");

let socket;
let reconnectTimer;
let reconnectDelay = 1000;
let manuallyClosed = false;
let disconnectNoticeShown = false;

usernameInput.value = localStorage.getItem("chat-username") ?? "";

usernameInput.addEventListener("input", () => {
  localStorage.setItem("chat-username", usernameInput.value.trim());
  updateComposerState();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = usernameInput.value.trim();
  const text = messageInput.value.trim();

  if (!user) {
    usernameInput.focus();
    composerHint.textContent = "Escribe tu nombre para participar.";
    return;
  }

  if (!text || socket?.readyState !== WebSocket.OPEN) return;

  const message = { user, text };
  try {
    socket.send(JSON.stringify(message));
    messageInput.value = "";
    messageInput.focus();
  } catch {
    composerHint.textContent = "No se pudo enviar. Comprueba la conexión.";
  }
});

function setConnectionState(state, label) {
  connectionIndicator.dataset.state = state;
  connectionLabel.textContent = label;
}

function updateComposerState() {
  const connected = socket?.readyState === WebSocket.OPEN;
  messageInput.disabled = !connected;
  sendButton.disabled = !connected;

  if (!connected) {
    composerHint.textContent = "Conectando con el servidor…";
  } else if (!usernameInput.value.trim()) {
    composerHint.textContent = "Añade tu nombre para enviar mensajes.";
  } else {
    composerHint.textContent = "Pulsa Enter para enviar.";
  }
}

function connect() {
  clearTimeout(reconnectTimer);
  setConnectionState("connecting", "Conectando…");

  try {
    socket = new WebSocket(WS_URL);
  } catch {
    setConnectionState("error", "Error de conexión");
    updateComposerState();
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectDelay = 1000;
    disconnectNoticeShown = false;
    setConnectionState("connected", "Conectado");
    updateComposerState();
    addSystemMessage("Conexión establecida");
  };

  socket.onmessage = (event) => {
    let received;
    try {
      received = JSON.parse(event.data);
    } catch {
      received = { user: "Servidor", text: String(event.data) };
    }

    if (typeof received === "string") {
      received = { user: "Servidor", text: received };
    }

    if (received && typeof received === "object" && !Array.isArray(received)) {
      const user = received.user ?? received.username ?? "Anónimo";
      const text = received.text ?? received.message;
      if (typeof text === "string" && text.trim()) {
        const sender = String(user);
        renderMessage({ user: sender, text }, sender === usernameInput.value.trim());
      }
    }
  };

  socket.onerror = () => {
    setConnectionState("error", "Error de conexión");
    composerHint.textContent = "No se pudo conectar con el servidor.";
  };

  socket.onclose = () => {
    setConnectionState("disconnected", "Desconectado");
    updateComposerState();
    if (!manuallyClosed) {
      if (!disconnectNoticeShown) {
        addSystemMessage("Conexión perdida. Intentando reconectar…");
        disconnectNoticeShown = true;
      }
      scheduleReconnect();
    }
  };

  updateComposerState();
}

function scheduleReconnect() {
  if (manuallyClosed || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 30000);
}

function renderMessage(message, own = false) {
  emptyState?.remove();

  const item = document.createElement("li");
  item.className = `message${own ? " own" : ""}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  const name = document.createElement("span");
  name.className = "message-name";
  name.textContent = message.user;
  const time = document.createElement("time");
  time.dateTime = new Date().toISOString();
  time.textContent = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  meta.append(name, time);

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message.text;
  item.append(meta, bubble);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

function addSystemMessage(text) {
  const item = document.createElement("li");
  item.className = "system-message";
  item.textContent = text;
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

window.addEventListener("beforeunload", () => {
  manuallyClosed = true;
  clearTimeout(reconnectTimer);
  socket?.close();
});

connect();