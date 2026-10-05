# Chat en tiempo real

Cliente web estático para un servidor WebSocket. No requiere proceso de compilación.

## Configuración

Edita `config.js` y reemplaza la URL de ejemplo por la URL pública de tu servidor WebSocket. En producción, una página servida por HTTPS debe conectarse mediante `wss://`.

El cliente envía JSON con esta forma:

```json
{"user":"Nombre","text":"Hola"}
```

Se espera que el servidor difunda los mensajes con los campos `user` y `text`.

## Publicación gratuita en Netlify

1. Actualiza `WS_URL` en `config.js` y sube estos archivos a un repositorio Git.
2. En [Netlify](https://www.netlify.com/), crea un sitio nuevo desde ese repositorio.
3. Deja vacío el comando de build y configura el directorio de publicación como `.` (la raíz del repositorio).
4. Pulsa **Deploy**. Netlify te dará una URL pública HTTPS para compartir.

También puedes importar el repositorio en Vercel o habilitar GitHub Pages desde **Settings → Pages**, seleccionando la rama y la carpeta raíz. En todos los casos, el servidor WebSocket debe permitir conexiones desde el dominio publicado (CORS/origin según la configuración del backend).