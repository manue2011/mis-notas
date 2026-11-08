# Libreta — app de notas colaborativa estilo cuaderno

> "Libreta" es un nombre provisional.

## Qué es

Una app web tipo Notion para equipos pequeños. El registro es solo por
invitación: el superadmin crea enlaces de registro y gestiona las cuentas.
Cada persona con cuenta crea espacios de trabajo y añade a sus compañeros con
un enlace. Dentro de cada espacio se crean páginas con texto, listas,
pantallazos, notas y código, y varias personas pueden editarlas. Debe poder
funcionar entera con planes gratuitos (Vercel, Neon, Cloudinary, Render).
La app no envía correos.

## Stack (no cambiar sin preguntarme)

- **Framework:** Next.js (App Router) + TypeScript estricto + Tailwind CSS
- **Base de datos:** Neon (Postgres) con Drizzle ORM y migraciones de Drizzle Kit
- **Autenticación:** Better Auth
  - Correo + contraseña, sin verificación por email
  - Sin recuperación por email: el superadmin cambia la contraseña desde `/admin`
  - Login con Google (se activa solo si están las claves `GOOGLE_*`)
  - Plugin `admin` para el superadmin (rol global `superadmin`)
  - Plugin `organization` para los espacios de trabajo, miembros y roles
- **Editor:** BlockNote
- **Imágenes:** Cloudinary con subidas firmadas desde el servidor
- **Animaciones:** Motion (antes Framer Motion)
- **Deploy:** Vercel para la app. En la fase 4, servidor de tiempo real
  (Hocuspocus + Yjs) en Render

## Conceptos

- **Usuario:** persona con cuenta. Solo se crea con un enlace de registro.
- **Superadmin:** el dueño de la app. Es un usuario normal (tiene sus espacios)
  con acceso a `/admin`: crear y anular enlaces de registro, ver usuarios,
  cambiar contraseñas y bloquear cuentas. No ve los espacios de los demás si no
  es miembro. Su cuenta se crea (o se recupera) con `npm run admin:create`.
- **Enlace de registro:** de un solo uso, caduca en 7 días, lo crea solo el
  superadmin. `/invitacion/<token>` guarda el token en una cookie httpOnly y
  lleva a `/registro`.
- **Espacio de trabajo:** una organización de Better Auth. Tiene nombre, icono,
  color de acento, tipografía elegida y, opcionalmente, un dominio de correo
  permitido (por ejemplo `empresa.com`).
- **Miembro:** usuario dentro de un espacio con un rol: `admin`, `editor` o `lector`.
- **Enlace de invitación:** enlace reutilizable con token, rol asignado,
  caducidad, máximo de usos y posibilidad de revocarlo.
- **Página:** pertenece a un espacio, puede tener página padre (anidadas) y
  guarda el contenido de BlockNote en JSON.
- **Recurso:** imagen subida a Cloudinary, ligada a un espacio y a una página.

## Modelo de datos

Además de las tablas que genera Better Auth (user, session, account,
verification, organization, member, invitation):

- `workspace_settings`: organizationId, accentColor, font (`serif` | `sans` | `mono`),
  icon, allowedEmailDomain (nullable)
- `invite_link`: id, organizationId, tokenHash, role, expiresAt, maxUses, uses,
  createdBy, revokedAt, createdAt
- `signup_invite`: id, tokenHash, note, expiresAt, usedAt, usedBy, createdBy,
  revokedAt, createdAt (enlaces de registro a la app)
- El plugin `admin` añade `role`, `banned`, `banReason`, `banExpires` a `user`
  e `impersonatedBy` a `session`.
- `page`: id, organizationId, parentId (nullable), title, icon, coverUrl,
  content (jsonb), position, createdBy, updatedBy, createdAt, updatedAt,
  deletedAt (papelera, borrado suave)
- `asset`: id, organizationId, pageId, cloudinaryPublicId, url, width, height,
  bytes, uploadedBy, createdAt

Los enlaces de invitación de Better Auth son por correo; por eso `invite_link`
es una tabla propia para enlaces compartibles.

## Reglas de autenticación y seguridad

- Registro solo con enlace de registro válido, también con Google. Se comprueba
  en el servidor (`user.validateUserInfo`) y el enlace se marca como usado de
  forma atómica.
- Como los correos no se verifican, Google no se vincula a una cuenta creada
  con contraseña.
- Login y registro pasan por `/api/auth` (no por Server Actions) para que
  aplique el rate limit de Better Auth.
- Al cambiar la contraseña de alguien o bloquearlo, se cierran sus sesiones.
- `/admin` y sus acciones comprueban el rol `superadmin` en el servidor; a los
  demás les da 404.
- Contraseñas de mínimo 8 caracteres.
- Guardar solo el hash de los tokens de invitación y de registro, nunca en claro.
- Al aceptar una invitación: comprobar caducidad, usos y revocación, y si el
  espacio tiene `allowedEmailDomain`, que el correo del usuario coincida.
- **Toda** consulta o mutación de páginas, recursos o ajustes comprueba que el
  usuario es miembro del espacio y que su rol lo permite. Se comprueba en el
  servidor, nunca solo en la interfaz.
  - `lector`: solo ver
  - `editor`: crear, editar y borrar páginas
  - `admin`: además, ajustes del espacio, miembros e invitaciones
- Subidas a Cloudinary firmadas en el servidor, solo imágenes (png, jpg, webp,
  gif), máximo 10 MB, en la carpeta `libreta/<organizationId>/`. Convertir a WebP.
- Secretos solo en `.env.local` (y en Vercel). Nunca en el código ni en el repo.

## Variables de entorno

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Mantener un `.env.example` actualizado con estas claves vacías.

Bases de datos: en local, `DATABASE_URL` apunta a la rama `dev` de Neon;
producción (Vercel) usa la rama `main`. En `.env.local` hay además
`PRODUCTION_DATABASE_URL(_UNPOOLED)` (solo local, nunca en Vercel) para:

- `npm run db:migrate:prod`: aplicar migraciones a producción (pide confirmación).
- `npm run admin:create:prod`: crear o recuperar el superadmin en producción.

## Diseño: estilo cuaderno

La app NO debe parecer hecha por una IA. Prohibido: degradados decorativos,
efecto cristal, emojis como iconos, tarjetas con borde lateral de color, la
fuente Inter, todo centrado y simétrico. La idea es un cuaderno de papel cálido
con detalles hechos a mano, pero rápido y tranquilo de usar.

### Tipografía (Google Fonts)

- **Newsreader** (serifa): títulos de página y cuerpo del texto de las notas
- **Instrument Sans**: interfaz (menús, botones, etiquetas, formularios)
- **Caveat** (a mano): solo para detalles: anotaciones al margen, pies de
  pantallazos, notas adhesivas, etiquetas con cinta. Nunca para texto largo.

### Colores (modo claro)

| Uso | Color |
|---|---|
| Papel (fondo principal) | `#F5EFE3` |
| Barra lateral y paneles | `#EDE5D4` |
| Superficie elevada (menús, tarjetas) | `#FBF8F1` |
| Tinta (texto) | `#2A251F` |
| Texto secundario | `#6B6156` |
| Bordes | `#DCD2BF` |
| Renglones del papel | `#E3D9C6` |
| Línea de los campos de formulario | `#CFC4AE` |
| Nota adhesiva | `#F2DE8F` |
| Error | `#A33A26` |

Modo oscuro: papel `#1E1A16`, paneles `#27221D`, superficie `#2F2923`,
tinta `#EDE5D4`, texto secundario `#A89C8C`, bordes `#3A332B`. Ajustar si
algún contraste no llega a 4.5:1.

### Color de acento por espacio

Cada espacio elige un acento de esta paleta: azul tinta `#2F5D8A`, teja
`#B5432E`, musgo `#4E6E2F`, mostaza tostada `#8F5A0B`, ciruela `#6B4C8A`,
grafito `#3A342D`, frambuesa `#A8396A`, verde bosque `#2D6A4F`, petróleo
`#1D6A72`, granate `#8C2F39`, calabaza `#A84A14`, índigo `#4B4FA0`. Todos
permiten texto blanco encima (contraste ≥ 4.5:1).

- Se aplica con variables CSS (`--accent`, `--accent-soft`, `--accent-tape`)
  en el contenedor del espacio.
- `--accent-soft` = acento mezclado con el papel al ~84% (fondos de elementos
  activos). `--accent-tape` = acento con 30% de opacidad (cinta adhesiva).
  Calcularlos con `color-mix()` en OKLCH.
- Al cambiar de espacio o de color, transición suave de ~450 ms.

### Detalles característicos

- Renglones sutiles detrás del texto de las notas.
- Título de página con un subrayado dibujado a mano (SVG) en el color de acento.
- Pantallazos como fotos pegadas: fondo blanco, ligeramente girados (~-0.8°),
  sombra suave y dos tiras de cinta adhesiva en `--accent-tape`.
- Notas adhesivas amarillas, algo giradas, con una chincheta en el acento.
- Casillas de tareas con borde del acento; al marcarlas, texto tachado.
- Campos de formulario como una línea de cuaderno (solo borde inferior).
- Fondo de puntos en paneles decorativos (pantallas de acceso).
- Iconos de trazo fino (lucide-react), nunca emojis.

### Interacción

- Paleta de comandos con Ctrl/Cmd + K (buscar, crear página, cambiar de espacio).
- Menú "/" en el editor: Texto, Lista de tareas, Pantallazo, Nota adhesiva, Código.
- Pegar un pantallazo con Ctrl+V lo sube directamente, con barra de progreso
  dentro del bloque.
- Arrastrar y soltar bloques y páginas de la barra lateral.
- Vista previa al pasar el ratón por un enlace a otra página.
- Estados vacíos con un mensaje con personalidad, no un texto gris.
- Animaciones cortas y discretas. Respetar `prefers-reduced-motion`.
- Zonas táctiles de al menos 44 px. Todo usable con teclado.
- Responsive: en móvil la barra lateral se convierte en menú desplegable.

### Pantallas

Hay maquetas de referencia en `refencias/` (solo en local, fuera del repo; las de "Olvidé mi contraseña" y
"Verifica tu correo" ya no aplican).

Permisos de los espacios: todo pasa por `src/lib/workspace/access.ts`
(`requireWorkspaceBySlug` / `requireWorkspaceById`); a quien no es miembro, 404.

0. **Página principal** (`/`, pública): qué es Libreta, qué se puede hacer y
   cómo se entra (solo por invitación). Arriba, "Iniciar sesión" o, con
   sesión, "Mis libretas", "Administración" (superadmin) y "Cerrar sesión".
   La app empieza en `/libretas`, que lleva al último espacio abierto (o a
   crear el primero); es adonde se va tras iniciar sesión. El logo siempre
   lleva a `/`.
1. **Iniciar sesión** (`/iniciar-sesion`): Google, correo y contraseña (con
   botón para mostrarla), "¿La has olvidado?" muestra "Pídele al administrador
   que te la cambie". A la derecha, panel decorativo con pantallazo pegado y
   nota adhesiva.
2. **Crear cuenta** (`/registro`): solo con un enlace de registro válido; si no,
   un mensaje explicándolo. Valida el formato del correo mientras se escribe.
3. **Administración** (`/admin`, solo superadmin): crear enlaces de registro,
   enlaces pendientes, personas (cambiar contraseña, bloquear).
4. **Nuevo espacio** (`/nuevo-espacio`): nombre y color, con vista previa del
   color en toda la página. `/` lleva al último espacio abierto o aquí si no hay.
5. **Pantalla principal** (`/espacio/[slug]`): barra lateral (logo, espacios, selector de color,
   buscador Ctrl K, páginas, tarjeta "Copiar enlace de invitación") y la página
   abierta con barra superior (ruta, avatares de quién está, botón Compartir).
6. **Ajustes del espacio:** nombre, icono, color, tipografía, dominio
   permitido, miembros y roles, enlaces de invitación.

## Fases

1. **Base:** proyecto, base de datos, autenticación (registro por invitación,
   superadmin y `/admin`, Google), crear espacios, enlaces de invitación, crear, editar y
   borrar páginas con BlockNote e imágenes en Cloudinary, color de acento y el
   sistema de diseño. Permisos por rol aplicados en el servidor desde ya.
2. **Organización:** páginas anidadas, arrastrar en la barra lateral, paleta
   Ctrl K, búsqueda, papelera.
3. **Gestión:** pantalla de ajustes, gestión de miembros y roles, dominio
   permitido, modo oscuro, tipografía por espacio.
4. **Tiempo real:** edición simultánea con Yjs y Hocuspocus en Render, avatares
   de presencia y cursores de colores.
5. **Importar y legal:** color del espacio en un desplegable, páginas de
   privacidad y condiciones (RGPD), descargar mis datos y eliminar mi cuenta,
   importar un PDF como nota (texto e imágenes en su orden, con `unpdf`) e
   importar desde Notion (zip «Markdown & CSV», con `fflate`).

## Reglas de trabajo

- Trabaja solo en la fase actual. Si algo pertenece a otra fase, anótalo y sigue.
- Antes de escribir mucho código, propón el plan y espera mi aprobación.
- No añadas librerías fuera del stack sin preguntarme.
- Código, nombres de variables y commits en inglés; textos de la interfaz en español.
- Componentes pequeños y reutilizables. Nada de archivos gigantes.
- Valida todas las entradas del servidor con Zod.
- Cuando termines una tarea, explícame brevemente qué has hecho y cómo probarlo.
- Si algo no está claro en este archivo, pregúntame antes de suponer.
