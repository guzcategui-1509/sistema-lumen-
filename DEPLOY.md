# Deploy de Lumen Workspace en Vercel

Este proyecto ya esta listo para publicarse como app estatica en Vercel.

## Que se publica ya

- Dashboard general.
- Ordenes de trabajo en modo prototipo.
- Equipo.
- Notificaciones/digest en modo prototipo.
- Sistema con checklist de lanzamiento.
- Datos guardados en `localStorage` por navegador.

Importante: este primer deploy sirve para tener una URL y probar la experiencia. Para que varios usuarios compartan las mismas OTs, hay que conectar el frontend a Supabase.

## Opcion recomendada: GitHub + Vercel

1. Crea un repositorio en GitHub, por ejemplo `lumen-workspace`.
2. Sube estos archivos al repo.
3. Entra a Vercel.
4. Click en `Add New...` -> `Project`.
5. Importa el repo de GitHub.
6. Framework Preset: `Other`.
7. Build Command: dejar vacio.
8. Output Directory: dejar vacio.
9. Deploy.

Vercel detecta `index.html` y publica la app estatica.

## Opcion rapida: Vercel CLI

Desde esta carpeta:

```bash
npx vercel
```

Para produccion:

```bash
npx vercel --prod
```

Nota: este metodo requiere login de Vercel y acceso a internet.

## Cuando conectemos Supabase real

En Vercel, agrega variables en `Project Settings` -> `Environment Variables`:

```text
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

No agregues `SUPABASE_SERVICE_ROLE_KEY` al frontend. Esa llave solo debe vivir en Supabase Edge Functions o backend seguro.

## Checklist antes de compartir con el equipo

- Ejecutar `supabase/launch_mvp.sql` en Supabase.
- Cargar `clients`, `brands`, `profiles` y `brand_memberships`.
- Probar que el usuario admin entra.
- Conectar OTs reales a Supabase.
- Subir archivos a `work-order-files`.
- Configurar emails con `email-worker` y `weekly-digest`.
