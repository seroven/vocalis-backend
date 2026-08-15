# Vocalis API

Backend de Vocalis, un entrenador vocal. Express + TypeScript + MySQL.

## Cómo arrancar

```bash
npm install
cp .env.example .env
npm run dev
```

La API queda en `http://localhost:4000`. Endpoints actuales:

- `GET /api/health`
- `GET /api/example`

Crea la base `vocalis` con `scripts/init.sql` cuando tengas MySQL listo. El servidor arranca aunque la base aún no responda.

## Organización

El código se agrupa por **módulo** (una feature), no por tipo de archivo suelto. Cada módulo es dueño de sus rutas y su lógica. Las carpetas transversales solo existen cuando hay código real que poner ahí.

```
src/
  index.ts              Arranca el servidor
  app.ts                Express: CORS, JSON, /api, errores
  routes.ts             Registra los módulos (como un urls.py central)
  config/               Entorno y pool de MySQL
  middlewares/          404 y errores
  utils/                Respuestas { status, detail, data }
  modules/
    health/
      health.routes.ts  URLs del módulo
      views/            Qué hace cada endpoint
```

| Carpeta | Para qué |
|---|---|
| `config/` | Variables de entorno y conexión a MySQL |
| `middlewares/` | Cosas que aplican a todas las peticiones |
| `utils/` | Helpers compartidos (hoy, el formato de respuesta) |
| `modules/` | Una carpeta por feature |
| `modules/<nombre>/views/` | Handlers del endpoint |
| `modules/<nombre>/*.routes.ts` | Declara las URLs del módulo |

No hay `repositories/` todavía: no hay tablas ni persistencia. Esa carpeta nace dentro del módulo el día que un endpoint lea o escriba en MySQL.

## Contrato de respuesta

Todas las respuestas siguen la misma forma:

```json
{
  "status": 200,
  "detail": "Successful operation",
  "data": {}
}
```

Usa `sendSuccess` y `sendError` de `src/utils/responses.ts`.

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>/` con sus `*.routes.ts` y `views/`.
2. Si el módulo habla con MySQL, agrega `repositories/`.
3. Regístralo en `src/routes.ts`.

Ejemplo cuando exista práctica:

```
modules/practice/
  practice.routes.ts
  views/practice.view.ts
  repositories/practice.repository.ts
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga |
| `npm run build` | Compila a `dist/` |
| `npm start` | Corre el build |
