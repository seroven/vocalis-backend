# Vocalis API

Backend de Vocalis, un entrenador vocal. Express + TypeScript + MySQL.

## Cómo arrancar

```bash
npm install
cp .env.example .env
```

En `.env` hay que poner `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` y un `SESSION_SECRET`. El Redirect URI de la app en el [Spotify Dashboard](https://developer.spotify.com/dashboard) debe ser exactamente:

```
http://127.0.0.1:5173/auth/callback
```

```bash
npm run dev
```

La API queda en `http://127.0.0.1:4000`. Al arrancar crea la tabla `users` si no existe.

## Auth con Spotify

Flujo [Authorization Code](https://developer.spotify.com/documentation/web-api/tutorials/code-flow):

- `GET /api/auth/spotify` — devuelve la URL de autorización
- `POST /api/auth/spotify/callback` — intercambia el `code`, exige cuenta Premium y guarda el usuario
- `GET /api/auth/me` — sesión actual (cookie httpOnly)
- `POST /api/auth/logout` — cierra sesión

Solo entra quien tenga `product === "premium"` en [`GET /v1/me`](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile).

## Organización

El código se agrupa por **módulo** (una feature). Cada módulo es dueño de sus rutas, views y, si habla con MySQL, repositories.

```
src/
  index.ts              Arranca el servidor y prepara la tabla users
  app.ts                Express: CORS, cookies, JSON, /api, errores
  routes.ts             Registra los módulos
  config/               Entorno y pool de MySQL
  middlewares/          404, errores y requireAuth
  utils/                Respuestas { status, detail, data }
  modules/
    auth/
      auth.routes.ts
      views/
      services/         Spotify + sesión
      repositories/     Tabla users
```

| Carpeta | Para qué |
|---|---|
| `config/` | Variables de entorno y conexión a MySQL |
| `middlewares/` | Cosas que aplican a todas las peticiones |
| `utils/` | Helpers compartidos (formato de respuesta) |
| `modules/` | Una carpeta por feature |
| `modules/<nombre>/views/` | Handlers del endpoint |
| `modules/<nombre>/services/` | Integraciones (Spotify, JWT) |
| `modules/<nombre>/repositories/` | Consultas a MySQL |
| `modules/<nombre>/*.routes.ts` | URLs del módulo |

## Contrato de respuesta

```json
{
  "status": 200,
  "detail": "Successful operation",
  "data": {}
}
```

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>/` con sus `*.routes.ts` y `views/`.
2. Si el módulo habla con MySQL, agrega `repositories/`.
3. Regístralo en `src/routes.ts`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga |
| `npm run build` | Compila a `dist/` |
| `npm start` | Corre el build |
