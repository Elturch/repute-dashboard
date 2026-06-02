
## Objetivo

Dejar **explícito y para no especialistas** quién gana o pierde en cada métrica IA, en **todas** las páginas que usan `PerfilReputacionalIA` (FJD, Privados Resumen, SERMAS, CATSALUT y cualquier futura). Cambio único en el componente compartido.

## Cambios en `src/components/PerfilReputacionalIA.tsx`

### 1. Flecha de dirección pegada a cada nombre de métrica

En la definición de `POSITIVAS` y `NEGATIVAS`, generar un label con sufijo direccional que se reutilice en radar y tabla:

- Positivas → `"INFLUENCIA ↑"`, `"FIABILIDAD ↑"`, etc. (verde tenue en el símbolo ↑)
- Negativas → `"RECHAZO ↓"`, `"PREOCUPACIÓN ↓"`, `"DESCRÉDITO ↓"` (rojo tenue en el símbolo ↓)

La flecha se pinta dentro del `ColoredAxisTick` del radar como un `<tspan>` adicional con color fijo (verde/rojo según `positive`), y se añade también en la columna "Métrica" del `NumericTable` con el mismo color.

### 2. Mini-leyenda direccional sobre el radar

Justo encima del radar (donde ya están las leyendas de colores), añadir una segunda línea más pequeña:

```text
↑ más alto = mejor   ·   ↓ más bajo = mejor
```

Con ↑ en verde y ↓ en rojo. Tipografía pequeña, en línea con la estética actual.

### 3. Glosario plegable "¿Qué significa cada término?"

Justo después de `NumericTable`, antes del bloque final de iconos ★ ● ⚠, añadir un `<Collapsible>` (ya disponible en `src/components/ui/collapsible.tsx`) cerrado por defecto. Al abrirlo muestra dos columnas:

**Positivas (más alto = mejor)**
- **Influencia**: alcance y capacidad de la mención para llegar a audiencia relevante.
- **Fiabilidad**: grado en que la fuente o el contenido se percibe como creíble y riguroso.
- **Afinidad**: cercanía emocional o identificación que la mención genera hacia el hospital.
- **Admiración**: reconocimiento positivo del trabajo, logros o profesionales.
- **Impacto**: repercusión potencial de la mención en la opinión pública.

**Negativas (más bajo = mejor)**
- **Rechazo**: oposición, crítica abierta o sentimiento contrario.
- **Preocupación**: inquietud o alarma que transmite el contenido.
- **Descrédito**: daño reputacional explícito: acusaciones, pérdida de confianza, escándalo.

Cabecera del Collapsible: `"¿Qué significa cada término?"` con icono `HelpCircle` de lucide y caret rotando.

### 4. Mantener todo lo que ya funciona

- La inversión interna para el radar (10 − valor en negativas) se queda igual.
- La lógica de `statusFor` (★ lidera / ● en línea / ⚠ por debajo) ya invierte correctamente; no se toca.
- Colores, dimensiones y resto del layout sin cambios.

## Archivos tocados

- **`src/components/PerfilReputacionalIA.tsx`** (único archivo modificado).
- **No** hay que tocar las páginas que lo consumen (FJD, PrivadosResumen, SermasResumen, CatsalutResumen, etc.): heredan el cambio automáticamente.

## Verificación

1. `/dashboard/fjd` → radar muestra `RECHAZO ↓` con flecha roja, `INFLUENCIA ↑` con flecha verde, y el valor crudo del eje sigue siendo legible.
2. Encima del radar aparece la mini-leyenda `↑ más alto = mejor · ↓ más bajo = mejor`.
3. En la tabla, la columna "Métrica" también muestra las flechas.
4. Click en "¿Qué significa cada término?" despliega las 8 definiciones.
5. Ir a `/dashboard/privados` y `/dashboard/sermas` → el mismo bloque mejorado aparece sin tocar esas páginas.
6. Las páginas de canal específico (Instagram, TikTok…) que usan `PerfilReputacionalIA` también heredan los cambios.
