# Astro + Firebase (Auth + Firestore + Storage + Roles)

Incluye:
- Login/Signup por email/contraseña con cookie de sesión segura (`/api/auth/session`)
- Custom claims de rol (`admin` | `usuario`)
- Firestore: `events/` (id = `YYYY-MM-DD_ciudad-slug`) y `users/`
- Storage: `event-images/{eventId}/...` y `user-avatars/{uid}/...`
- Reglas + Índices
- Endpoints admin: `POST /api/users/set-role` (para asignar roles)
- Scripts de migración: `scripts/migrate-events.mjs`, `scripts/migrate-users.mjs`

## Pasos
1) `npm i firebase firebase-admin`
2) Copiar `.env.example` -> `.env` y completar claves.
3) Activar en Firebase Console: **Authentication (Email/Password)**, **Firestore**, **Storage**.
4) Reglas/índices:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   firebase firestore:indexes -r firebase/firestore.indexes.json
   ```
5) Datos:
   ```bash
   node scripts/migrate-events.mjs
   node scripts/migrate-users.mjs
   ```
6) Dar/quitar rol:
   ```bash
   node scripts/set-admin-claim.mjs admin@trescolores.com admin
   ```
7) Páginas:
   - `/signup` crea cuenta (rol por defecto `usuario`)
   - `/login` inicia sesión
   - `/admin` requiere rol `admin`

## Adapter para deploy
- **Vercel**: usa `@astrojs/vercel/serverless` (Node). Evita Edge para endpoints con Admin SDK.
  ```bash
  npm i -D @astrojs/vercel
  ```
  `astro.config.mjs`:
  ```js
  import vercel from '@astrojs/vercel/serverless';
  export default {
    output: 'server',
    adapter: vercel(),
  };
  ```

## Notas
- Tras asignar un rol via claim, el usuario debe re-autenticarse o refrescar el token para ver el cambio en el front.
- Lectura de eventos es pública; escritura solo `admin`.
- El endpoint `/api/users/profile` crea/actualiza el documento `users/{uid}` con rol fijo `usuario`. Para promover a admin usa `/api/users/set-role` o el script.
