# Servidor de tiempo real (Render)

Hocuspocus + Yjs: varias personas editan la misma página a la vez. La app
(Vercel) firma un pase de 5 minutos por página; este servidor solo lo
verifica, carga la página de Neon y la guarda al editar.

Sin `REALTIME_URL` y `REALTIME_SECRET` en Vercel la app funciona como antes
(guardado normal, sin edición simultánea), así que se puede publicar el código
antes de tener Render listo.

## Puesta en marcha (una vez)

El orden importa:

1. **Migración en producción** (añade `page.yjs_state`), antes de publicar el
   código:

   ```
   npm run db:migrate:prod
   ```

2. **Publicar el código** (`git push`). Vercel despliega; todo sigue igual.

3. **Generar el secreto compartido** (guárdalo, se usa en Render y en Vercel):

   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

4. **Render** (https://dashboard.render.com):
   - *New* → *Blueprint* → conecta el repositorio de GitHub. Render lee
     `render.yaml` y propone el servicio `libreta-realtime` (plan gratuito,
     Frankfurt).
   - Rellena las variables:
     - `DATABASE_URL`: la misma de producción que tiene Vercel (Neon, rama
       `main`, la *pooled*).
     - `REALTIME_SECRET`: el del paso 3.
     - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`:
       las mismas que en Vercel.
   - Despliega y copia la dirección, p. ej. `https://libreta-realtime.onrender.com`.
   - Comprueba `https://libreta-realtime.onrender.com/health` → `ok`.

5. **Vercel** → *Settings* → *Environment Variables* (Production):
   - `REALTIME_URL` = `wss://libreta-realtime.onrender.com` (la misma
     dirección con `wss://` en vez de `https://`)
   - `REALTIME_SECRET` = el del paso 3
   - Vuelve a desplegar (*Deployments* → *Redeploy*).

6. Abre una página: bajo el título debe poner **«En vivo»**.

## Bueno saber

- El plan gratuito de Render **se duerme tras 15 min** sin uso. La app lo
  despierta al entrar en un espacio, pero la primera conexión puede tardar
  30–60 s; mientras, la página se ve en solo lectura con «Conectando…».
- Quitar a alguien de un espacio corta su acceso al reconectar (como mucho
  5 minutos después).
- Si alguna vez se apaga el tiempo real (se quitan las variables de Vercel),
  las páginas se siguen editando con el guardado normal; al volver a
  encenderlo, el servidor reconstruye cada página desde su último guardado.

## En local

```
npm run realtime:build
REALTIME_SECRET=<secreto> PORT=1234 node --env-file=.env.local realtime/dist/server.mjs
```

y la app con `REALTIME_URL=ws://localhost:1234` y el mismo `REALTIME_SECRET`.
