# Auditoría LinkedIn / My Business en Resumen 30D (Privados)

## Diagnóstico
- **LinkedIn**: la vista `v_kpi_canal_30d` sólo devuelve 5 grupos privados con datos (Quirónsalud 127, Sanitas 212, Vithas 97, Hospiten 79, Viamed 42). Los términos `"HM Hospitales"` (114 posts), `"Ribera Salud"` (107) y `"HLA Hospitales"` (42) sí existen en `linkedin_gh_filtradas` pero **no están mapeados a su grupo hospitalario en la tabla `keywords` de Tasklet**, por eso no se agregan. No hay ruido de seguros: el término "Sanitas" no aparece en LinkedIn (Sanitas se cuenta vía Teknon, La Moraleja, La Zarzuela, Virgen del Mar, CIMA, La Luz) → no está entrando Sanitas Seguros.
- **My Business**: el panel mide reseñas y comentarios de las fichas de Google Maps de cada hospital. El usuario quería que se etiquete claramente.
- En ambos canales confirmado que Quirón Prevención / Sanitas Seguros no se cuelan.

## Cambios de UI (sólo `src/pages/dashboard/privados/PrivadosResumen.tsx`)
1. Añadir a `ChannelConfig` los campos opcionales `subtitulo` y `nota`.
2. LinkedIn → subtítulo "Publicaciones corporativas" + nota: cobertura parcial, HM/Ribera/HLA pendientes de mapeo en Tasklet, Sanitas no incluye seguros, Quirónsalud no incluye Quirón Prevención.
3. My Business → subtítulo "Reseñas y comentarios de Google" + nota explicando que sólo recoge reseñas/comentarios de fichas de Google Maps, no aseguradoras.
4. Renderizar `subtitulo` debajo del nombre del canal en la tira de KPIs superior (texto pequeño gris).
5. Renderizar `nota` como aviso amber con `AlertTriangle` dentro del `<ChannelSection>` (sólo si está definida).
6. No tocar lógica de agregación ni filtros — el bug real (keywords sin mapear) es backend y queda en el wishlist de Tasklet.

---

# Alta de usuarios con código numérico por email

## Objetivo
- Tú, como superadmin, das de alta usuarios desde la pantalla **Sistema → Usuarios** introduciendo email + rol (lector / superadmin).
- El usuario recibe un **código numérico de 6 dígitos** en su correo y lo introduce en el login para entrar.
- Para el superadmin `datos@hablamosde.com`, el código se rellena solo automáticamente en el login (sin email).
- Solo los superadmin pueden dar de alta o eliminar usuarios.

## Cambios en el login
La pantalla actual de "magic link" pasa a ser un flujo de **2 pasos**:
1. **Paso 1 – Email**: el usuario introduce su email y pulsa "Enviar código".
   - Si es `datos@hablamosde.com` → entra directo como superadmin (sin código), igual que hoy.
   - Si está dado de alta → se genera un código de 6 dígitos, se guarda en BD (hash + caducidad 10 min) y se envía por correo.
   - Si no está dado de alta → mensaje "Tu email no tiene acceso a este panel".
2. **Paso 2 – Código**: input de 6 dígitos. Al validar, se crea sesión y se redirige al dashboard.

La sesión se guarda en `localStorage` (mismo patrón que ya hay con `mr_user_email` / `mr_is_superadmin`), añadiendo el rol y un token de sesión con caducidad.

## Pantalla "Sistema → Usuarios"
Solo visible/accesible para superadmin. Contiene:
- **Tabla** de usuarios: email, rol, fecha de alta, último acceso, acciones (eliminar, cambiar rol).
- **Botón "Añadir usuario"** → modal con email + selector de rol (lector / superadmin). Al guardar se crea en BD; el usuario podrá entrar la próxima vez que solicite código.
- El propio superadmin no puede borrarse a sí mismo.

## Datos (Lovable Cloud)
Dos tablas nuevas en el backend de la app (no en la BD externa de menciones):

- **`app_users`**: `email` (único, en minúsculas), `role` ('lector' | 'superadmin'), `created_by`, `last_login_at`.
- **`login_codes`**: `email`, `code_hash`, `expires_at`, `consumed_at`, `attempts`. Caducidad 10 min, máximo 5 intentos, un solo uso.

Semilla inicial: insertar `datos@hablamosde.com` como `superadmin`.

Acceso: las tablas se consultan/modifican vía edge functions con la service role; el cliente nunca lee directamente `login_codes`.

## Envío del código por correo
Email del propio Lovable (sin servicios externos). Plantilla simple con el código grande, el nombre del panel y aviso de caducidad de 10 minutos. Asunto: "Tu código de acceso · Monitor Reputacional".

## Edge functions
Tres funciones backend:
- `request-login-code`: recibe email, comprueba que existe en `app_users`, genera código, guarda hash y envía email.
- `verify-login-code`: recibe email + código, valida (hash, caducidad, intentos, no consumido), marca consumido, devuelve `{ email, role }` y actualiza `last_login_at`.
- `admin-users`: CRUD de usuarios (listar, crear, borrar, cambiar rol). Solo acepta peticiones cuando el llamante es superadmin (verificado por email + token de sesión).

## Protección de rutas
- `DashboardLayout` comprueba al montar que existe sesión válida (email + rol + no caducada); si no, redirige a `/login`.
- La ruta `sistema/usuarios` se oculta del sidebar y se bloquea si el rol no es `superadmin`.
- Se añade un botón de "Cerrar sesión" en el header.

## Ficheros afectados
- `src/pages/Login.tsx` (rehecho con flujo email → código).
- `src/pages/dashboard/sistema/Usuarios.tsx` (tabla + alta + borrado).
- `src/layouts/DashboardLayout.tsx` (guardia de sesión + logout).
- `src/components/AppSidebar.tsx` (ocultar "Usuarios" para no superadmin).
- `src/lib/auth.ts` *(nuevo)*: helpers `getSession`, `setSession`, `clearSession`, `isSuperadmin`.
- `src/hooks/useAdminUsers.ts` *(nuevo)*: invoca la edge function `admin-users`.
- Edge functions: `request-login-code`, `verify-login-code`, `admin-users`.
- Migración para crear `app_users` y `login_codes`, con GRANTs, RLS bloqueada al cliente (solo service role) y seed del superadmin.

## Notas
- El código es siempre de 6 dígitos, generado en servidor con aleatoriedad criptográfica.
- El "auto-rellenado" del superadmin se hace en el frontend: si el email es `datos@hablamosde.com`, se salta el paso del código (como ya hace hoy), sin enviar correo.
- Modelo simple, sin Supabase Auth: encaja con el patrón actual del proyecto que ya usa `localStorage` para identificar al superadmin.
