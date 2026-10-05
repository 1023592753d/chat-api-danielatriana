# Chat en tiempo real: backend

Backend Node.js con WebSockets para recibir y difundir mensajes de chat. Incluye un endpoint HTTP de salud en `/healthz`.

## Desarrollo local

Requiere Node.js 18 o superior.

```sh
npm install
npm start
```

El servidor escucha en el puerto `3000` por defecto. Puedes definir `PORT` para cambiarlo y `ALLOWED_ORIGINS` para permitir los orígenes del frontend, separados por comas. Por ejemplo:

```sh
PORT=3000 ALLOWED_ORIGINS=https://mi-chat.netlify.app npm start
```

Si `ALLOWED_ORIGINS` no se define, se aceptan todos los orígenes para facilitar pruebas. En producción, configúralo con el dominio HTTPS exacto del frontend. Las conexiones WebSocket desde páginas HTTPS deben usar `wss://`.

El cliente debe enviar mensajes de texto JSON con esta forma:

```json
{"user":"Nombre","text":"Hola"}
```

El servidor retransmite el mensaje a todos los clientes conectados con los campos `user`, `text` y `timestamp`.

## Despliegue en Render con Docker

1. Sube el repositorio a GitHub y crea un **New Web Service** en [Render](https://render.com/) conectado a ese repositorio.
2. Selecciona el entorno **Docker**. Render detectará el `Dockerfile` de la raíz; no hace falta configurar un comando de build ni de inicio.
3. En las variables de entorno del servicio, define `ALLOWED_ORIGINS` con el origen público del frontend, por ejemplo `https://mi-chat.netlify.app`. Render proporciona `PORT` automáticamente.
4. Crea el servicio y espera a que finalice el despliegue. Render asignará una URL HTTPS como `https://mi-chat-api.onrender.com`.
5. Usa `wss://mi-chat-api.onrender.com` como URL WebSocket del frontend. Puedes comprobar el estado HTTP en `https://mi-chat-api.onrender.com/healthz`.

También puedes desplegar el mismo `Dockerfile` en Railway o Fly.io. Configura `ALLOWED_ORIGINS` en el panel del proveedor y usa el dominio público con `wss://` desde el cliente.