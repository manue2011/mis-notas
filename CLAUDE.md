# Libreta — app de notas colaborativa estilo cuaderno

> "Libreta" es un nombre provisional.

## Qué es

Una app web tipo Notion para equipos pequeños. Cada persona se registra, crea
espacios de trabajo e invita a sus compañeros con un enlace. Dentro de cada
espacio se crean páginas con texto, listas, pantallazos, notas y código, y
varias personas pueden editarlas. Debe poder funcionar entera con planes
gratuitos (Vercel, Neon, Cloudinary, Render, Resend).

## Stack (no cambiar sin preguntarme)

- **Framework:** Next.js (App Router) + TypeScript estricto + Tailwind CSS
- **Base de datos:** Neon (Postgres) con Drizzle ORM y migraciones de Drizzle Kit
- **Autenticación:** Better Auth
  - Correo + contraseña con verificación de email obligatoria
  - Recuperación de contraseña por email
  - Login con Google
  - Plugin `organization` para los espacios de trabajo, miembros y roles
- **Emails:** Resend (verificación, recuperar contraseña, invitaciones)
- **Editor:** BlockNote
- **Imágenes:** Cloudinary con subidas firmadas desde el servidor
- **Animaciones:** Motion (antes Framer Motion)
- **Deploy:** Vercel para la app. En la fase 4, servidor de tiempo real
  (Hocuspocus + Yjs) en Render

## Conceptos

- **Usuario:** persona con cuenta verificada.
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
- `page`: id, organizationId, parentId (nullable), title, icon, coverUrl,
  content (jsonb), position, createdBy, updatedBy, createdAt, updatedAt,
  deletedAt (papelera, borrado suave)
- `asset`: id, organizationId, pageId, cloudinaryPublicId, url, width, height,
  bytes, uploadedBy, createdAt

Los enlaces de invitación de Better Auth son por correo; por eso `invite_link`
es una tabla propia para enlaces compartibles.

## Reglas de autenticación y seguridad

- Una cuenta no puede entrar hasta verificar su correo.
- Bloquear correos temporales con una lista de dominios desechables.
- Recuperar contraseña: el enlace caduca en 1 hora y es de un solo uso.
- Al pedir recuperación, responder siempre igual: "Si el correo está
  registrado, te hemos enviado un enlace". Nunca revelar si un correo existe.
- Limitar intentos de login, registro, recuperación y reenvío de verificación
  (rate limit de Better Auth).
- Contraseñas de mínimo 8 caracteres.
- Guardar solo el hash del token de invitación, nunca el token en claro.
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
RESEND_API_KEY=
EMAIL_FROM=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Mantener un `.env.example` actualizado con estas claves vacías.

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
grafito `#3A342D`. Todos permiten texto blanco encima.

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

1. **Iniciar sesión:** Google, correo y contraseña (con botón para mostrarla),
   enlace "¿La has olvidado?". A la derecha, panel decorativo con pantallazo
   pegado y nota adhesiva.
2. **Crear cuenta:** si viene de una invitación, muestra quién invita y a qué
   espacio. Valida el correo mientras se escribe (formato y correos temporales).
3. **Olvidé mi contraseña:** pide el correo y muestra el mensaje neutro.
4. **Nueva contraseña:** a la que llega el enlace del email.
5. **Confirma tu correo:** cuenta pendiente, botón de reenviar con espera.
6. **Pantalla principal:** barra lateral (logo, espacios, selector de color,
   buscador Ctrl K, páginas, tarjeta "Copiar enlace de invitación") y la página
   abierta con barra superior (ruta, avatares de quién está, botón Compartir).
7. **Ajustes del espacio:** nombre, icono, color, tipografía, dominio
   permitido, miembros y roles, enlaces de invitación.

## Fases

1. **Base:** proyecto, base de datos, autenticación completa (verificación,
   recuperación, Google), crear espacios, enlaces de invitación, crear, editar y
   borrar páginas con BlockNote e imágenes en Cloudinary, color de acento y el
   sistema de diseño. Permisos por rol aplicados en el servidor desde ya.
2. **Organización:** páginas anidadas, arrastrar en la barra lateral, paleta
   Ctrl K, búsqueda, papelera.
3. **Gestión:** pantalla de ajustes, gestión de miembros y roles, dominio
   permitido, modo oscuro, tipografía por espacio.
4. **Tiempo real:** edición simultánea con Yjs y Hocuspocus en Render, avatares
   de presencia y cursores de colores.

## Reglas de trabajo

- Trabaja solo en la fase actual. Si algo pertenece a otra fase, anótalo y sigue.
- Antes de escribir mucho código, propón el plan y espera mi aprobación.
- No añadas librerías fuera del stack sin preguntarme.
- Código, nombres de variables y commits en inglés; textos de la interfaz en español.
- Componentes pequeños y reutilizables. Nada de archivos gigantes.
- Valida todas las entradas del servidor con Zod.
- Cuando termines una tarea, explícame brevemente qué has hecho y cómo probarlo.
- Si algo no está claro en este archivo, pregúntame antes de suponer.
