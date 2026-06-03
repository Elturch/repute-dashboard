## Añadir selector Claro / Oscuro

Actualmente la app está fijada en tema oscuro (variables HSL en `:root` de `src/index.css`, sin clase `.dark`). Vamos a introducir un tema claro paralelo y un selector accesible desde la navegación.

### Cambios

1. **Tokens de color**
   - En `src/index.css` mover la paleta actual de `:root` a `.dark` (mantener exactamente los mismos HSL para no romper nada).
   - Añadir nueva paleta `:root` (claro): fondo blanco/gris muy claro, texto oscuro, primary azul equivalente, sidebar claro, bordes suaves. Mantener los mismos nombres de variables (`--background`, `--foreground`, `--card`, `--sidebar-background`, etc.) para que todos los componentes hereden sin tocarse.
   - `tailwind.config.ts` ya tiene `darkMode: ["class"]`, así que basta con alternar la clase `dark` en `<html>`.

2. **Proveedor de tema**
   - Nuevo `src/components/ThemeProvider.tsx` ligero (sin dependencias nuevas): lee `localStorage.mr_theme` (`light` | `dark`, por defecto `dark` para no cambiar la experiencia actual), aplica/quita la clase `dark` en `document.documentElement` y expone `useTheme()`.
   - Montar `<ThemeProvider>` en `src/App.tsx` envolviendo el árbol.

3. **Toggle en la navegación**
   - Nuevo `src/components/ThemeToggle.tsx`: botón icono (Sun/Moon de `lucide-react`) usando `Button` variante `outline` `size="sm"`, mismo estilo que los botones del header.
   - Colocarlo en el header de `src/layouts/DashboardLayout.tsx`, a la izquierda de `NotificationBell` (visible siempre que no esté en modo TV).
   - Tooltip "Cambiar a claro / Cambiar a oscuro".

4. **Ajustes visuales mínimos**
   - Revisar usos de `bg-white/[0.02]`, `border-white/10`, `text-white` codificados en componentes clave (`PerfilReputacionalIA.tsx`, tarjetas de FJD) y, donde sea necesario, sustituir por tokens semánticos (`bg-muted/30`, `border-border`, `text-foreground`) para que el modo claro se vea bien. Solo retoques visuales, sin tocar lógica.
   - Los colores fijos de marca (verde `#22c55e`, rojo `#ef4444`, gráficos) se mantienen.

### Alcance
- Global: el selector aparece en todo el dashboard.
- Persistente entre sesiones via `localStorage`.
- Por defecto: oscuro (estado actual), así nadie nota un cambio salvo al pulsar.

### Archivos
- `src/index.css` (paleta clara + mover oscura a `.dark`)
- `src/components/ThemeProvider.tsx` (nuevo)
- `src/components/ThemeToggle.tsx` (nuevo)
- `src/App.tsx` (envolver con ThemeProvider)
- `src/layouts/DashboardLayout.tsx` (añadir toggle al header)
- Retoques puntuales en componentes con colores hardcodeados que se vean mal en claro.
