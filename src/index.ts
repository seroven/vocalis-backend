import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Vocalis API escuchando en http://localhost:${env.port}`);
  console.log(`Ejemplo: http://localhost:${env.port}/api/example`);
});
