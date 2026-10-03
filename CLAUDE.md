# PetBeacon — Documento de Traspaso a Claude Code

**Propósito de este documento:** llevar todas las decisiones de producto, diseño y arquitectura de información validadas en la fase de prototipado (Claude Design + Figma) a la construcción del producto real, sin que se reabran decisiones ya tomadas ni se repitan errores ya corregidos.

**Estado de las fuentes:** este documento se construyó a partir del HTML exportado más reciente de Claude Design (verificado línea por línea, no de memoria) y del archivo de Figma actual (`EBWIYjqaxc3ZoXBU2OhgE5`, "PetBeacon — UI Polish"). Cualquier nota de memoria del proyecto anterior a este documento que mencione una paleta de colores distinta, una clave de archivo de Figma distinta, o menos de 26 pantallas, está desactualizada y debe ignorarse.

---

## 1. Producto y propuesta de valor

**Qué es PetBeacon:** una app móvil que conecta en tiempo real a personas que perdieron una mascota con personas que la vieron, a través de reportes geolocalizados — más un directorio de recursos de apoyo comunitario (despensas de comida, clínicas de esterilización de bajo costo, ayuda veterinaria de emergencia, foster temporal, asesoría legal) para prevenir el abandono de mascotas por causas económicas o de vivienda.

**Diferenciación validada contra competidores reales** (PawBoost, Petco Love Lost, Finding Rover — investigados con datos de mercado, no supuestos):
- Ningún competidor integra recursos de apoyo comunitario dentro del mismo producto de reunificación — es un hallazgo de mercado confirmado, no una intuición.
- PawBoost es el líder de la categoría por alcance de distribución (red de páginas de Facebook), no por tecnología de matching.
- Petco Love Lost y Finding Rover lideran con reconocimiento facial, pero ninguno mantiene una app nativa activa hoy (Finding Rover está congelada desde 2021; Petco Love Lost es solo sitio web).
- **Hallazgo crítico de la auditoría de usabilidad (heurísticas de Nielsen):** la propuesta de "Support and care" está subexpuesta frente a su valor real de diferenciación — se corrigió parcialmente en esta sesión (link en onboarding, banner en Home, sección propia en Help & FAQ), pero **Claude Code debe mantener esa exposición reforzada, no revertirla a un tab secundario sin jerarquía.**

---

## 2. Inventario completo de pantallas (26+)

### Onboarding (6 pantallas, secuencia lineal, saltable en cualquier punto excepto la primera)
1. **Welcome** — "What brings you here today?" con 3 salidas: "I lost my pet" y "I saw a pet" (tarjetas neutras con el color de estado solo en el círculo del ícono — mismo patrón que `ReportSheet`, ver "Nota adicional — colores de estado nunca como fondo de botón"; ya no botones llenos de color), "Just setting up — I'll register my pet now" (link secundario) + **"Struggling to care for your pet right now? See local support"** (link secundario, lleva directo a Support and care sin pasar por registro/permisos).
2. **Signup** — nombre + ciudad únicamente (sin contraseña ni verificación). Headline dinámico según la intención elegida en Welcome, pero **sin interpolar el nombre que el usuario escribe** (ese bug ya se corrigió — el headline es texto fijo).
3. **Location priming** — explica el permiso antes de pedirlo (patrón "soft-ask antes del hard-ask del sistema").
4. **Location manual fallback** — se activa automáticamente si el GPS falla o se rechaza. Campo "City or ZIP code" (label genérico, correcto en este contexto — distinto del label usado dentro de los flujos de Report, ver sección 5).
5. **Notifications priming** — mismo patrón que ubicación.
6. **Done ("You're all set")** — si la intención elegida fue "I lost my pet" o "I see a pet", al tocar "Go to Home" se abre automáticamente el flujo de Report correspondiente, no el feed vacío.

### Shell principal
- **Home — List** (vista por defecto): feed ordenado por prioridad (ver sección 6, lógica de retención), banner de "Possible match" descartable, card de recurso comunitario intercalada, banner de estado offline funcional (ver sección 5).
- **Home — Map**: mismos datos que List, pines por categoría con íconos reales (sirena=Lost, ojo=Sighted, check=Reunited, corazón=recurso comunitario), chip de radio ("5 mi ⌄" — **hoy decorativo, no filtra nada real**, ver sección 5), banner offline también presente.
- **My Reports**: reportes activos propios + avistamientos logueados. Botón "Edit report" abre pantalla de edición (pre-rellenada). Botón "Mark reunited" con diálogo de confirmación.
- **Support and care**: búsqueda + filtro por categoría (All / Emergency food & clinics / Temporary foster / Legal & shelters), 8 recursos reales (Free pet food pantry, Westchester Pet Pantry, Low-Cost Spay/Neuter Clinic, Emergency Vet Aid Fund, Bridge Foster Network, Crisis Boarding Program, Animal Welfare Legal Aid, Riverside Animal Sanctuary) con íconos por categoría corregidos, botón "Contact" por recurso que abre sheet de acciones (Call / WhatsApp / Directions / Website).
- **Profile**: avatar (círculo `slate/200`), nombre + ciudad editable (abre sheet "Edit location"), slider de radio de alerta (1-10 mi), toggles de notificaciones, mascotas registradas (abre "Pet profile"), **"Help and FAQ"** (mismo estilo tipográfico que los headers de sección), "Log out" siempre al final.

### Flujos de reporte
- **Report lost pet** (3 pasos + review + confirmación): foto → nombre/tipo/rasgos → ubicación (con fallback manual, label específico "Street address or nearest cross streets") + **campo de contacto obligatorio** ("Phone or email", con helper text explicando por qué) → Review alert → **Your alert is live** (CTA "Share flyer" genera un artefacto real, ver sección 5; link a Support and care mantenido deliberadamente).
- **Report a sighting** (3 pasos + confirmación): foto → ubicación (con fallback manual) → condición + contacto **opcional** → **Thanks for helping** (mismo link a Support and care agregado por consistencia).

### Pantallas nuevas de gestión (agregadas en esta sesión)
- **Edit report**: mismos componentes que el paso 2 de Report lost pet, pre-rellenados, un solo botón "Save changes".
- **Pet profile**: foto, nombre, tipo, raza (campo nuevo, antes no editable independientemente). Tres acciones: "Report lost" (pre-rellena el flujo de Report), "Save changes", "Remove pet".
- **Help and FAQ**: dos secciones con acordeón — "Reporting a pet" (4 preguntas) y "Support and care" (3 preguntas). La sección de Support and care es deliberada, no decorativa — refuerza el diferenciador.

### Sheets / overlays
- **Pin detail sheet** — varios estados distintos, no uno solo con texto condicional:
  - Lost ajeno → CTA "I've seen this pet" (ícono ojo).
  - Sighted ajeno → CTA "Report to network" + **"Share sighting"** (no "Share flyer" — corregido).
  - **Lost propio (modo dueño)** — misma jerarquía que My Reports (`MyReportStatusCard`, 2026-09-30): principal
    "Review matches" (si hay coincidencias abiertas) o "Share alert" (si no las hay); secundaria "Mark as reunited"
    y "Share flyer" (si `FLYERS_READY`); "Edit report" como acción terciaria (texto subrayado, ya no compite con
    la principal). Requiere `matchCount`/`onReviewMatches` desde quien abre la hoja (Home, My Reports, Pet profile).
  - Reunited/cerrado → caja verde "Great news — this case is closed.", sin botones de acción.
- **Notifications sheet** — el badge del header se limpia al abrirlo (corregido).
- **Edit location sheet**.
- **Contact sheet** (4 acciones).
- **Confirm reunited dialog**.
- **Resource detail sheet** (nuevo) — al tocar el pin o la card del recurso comunitario, ya no navega directo a Support and care. Abre un sheet con foto, horario, ubicación, descripción, "Contact" (reutiliza el sheet de contacto existente, sin apilarse) y link secundario "View all local resources".

---

## 3. Sistema de diseño — tokens reales (fuente de verdad: objeto `C` en el código)

```js
C = {
  sos: "#EC4832", sosDark: "#C43A1F", sosTint: "#FDECE4",       // Lost
  warn: "#0094D8", warnTint: "#EEF7FD",                          // Sighted
  ok: "#429D64", okTint: "#E4F5E9",                              // Reunited
  teal: "#000000", tealTint: "#DDEAE7",                          // Marca/acento (negro deliberado)
  info: "#1D4ED8", infoTint: "#E4EAFB",                          // Recurso comunitario (distinto de Reunited)
  ink: "#0F172A", slate700: "#334155", slate500: "#64748B",
  border: "#E2E8F0", border2: "#CBD5E1", surface: "#F8FAFC", white: "#fff"
}
```

**Tipografía:** Geist (display/headlines), Outfit (headers de pantalla/nombres), Manrope (cuerpo/UI) — las 3 confirmadas disponibles y cargadas sin fallback.

**Componentes base (también documentados en Figma, página "Components"):** Badge (3 variantes de estado), Button (Primary-Lost/Primary-Sighted/Secondary/Ghost/Disabled), TextField (Default/Focus/Disabled), Toggle (con hit-area de 44px separada del track visual de 32px — fix de accesibilidad ya aplicado), ReportCard, TabBar, FAB (73px = 56px base +30%, posición fija esquina inferior derecha — zona de alcance del pulgar, validado con la investigación de Steven Hoober), Icon (32 íconos vectoriales con geometría exacta).

**Logo:** archivo SVG provisto por el usuario, colores fijos propios (no debe recolorearse ni enlazarse a ninguna variable del tema).

---

## 4. Modelo de datos implícito

A partir de los formularios ya construidos, estas son las entidades y campos que el backend real necesita soportar (nombres sugeridos, no impuestos):

**Report** (Lost o Sighted — considerar un solo tipo con campo `status`):
- `id`, `status` (lost | sighted | reunited), `species` (dog | cat | other), `name` (opcional en Sighted), `breed`, `photo_url`, `features_description`, `location` (coordenadas GPS o dirección manual como fallback), `created_at`, `contact_phone_or_email` (**obligatorio si status=lost, opcional si status=sighted**), `matched_report_id` (nullable, para la lógica de "possible match").

**Resource** (recursos de Support and care): `id`, `name`, `category` (food | foster | legal), `description`, `distance` o coordenadas, `phone`, `whatsapp`, `address`/coordenadas para direcciones, `website_url`, `is_featured_event` (para casos como "Free pet food pantry — this Saturday", que aparece también en el feed de Home).

**User**: `id`, `name`, `city`, `alert_radius_mi` (1-10), `push_notifications_enabled`, `email_notifications_enabled`, mascotas registradas (relación 1-a-muchos con **Pet**).

**Pet** (registrado en Profile, independiente de un reporte activo): `id`, `user_id`, `name`, `species`, `breed`, `photo_url`.

---

## 5. Requisitos técnicos explícitos (no dejar a interpretación de Claude Code)

Estos quedaron anotados a lo largo de la sesión como pendientes deliberados para esta etapa — no se resolvieron en el prototipo porque no tenía sentido hacerlo ahí, pero **son requisitos reales, no opcionales**:

1. **Proveedor de mapas real: Mapbox (decisión confirmada).** Hoy el mapa de Home es ilustrativo (rectángulos decorativos, sin geografía real). Se evaluaron 3 opciones — Mapbox, OpenStreetMap/Leaflet, Google Maps — y se eligió **Mapbox** por el mejor balance entre nivel gratuito generoso (50,000 cargas/mes, suficiente para validar tracción sin costo), calidad visual comparable a la competencia (a diferencia de OpenStreetMap, cuyo aspecto "genérico open source" contrastaría con el nivel de pulido ya logrado en el resto de la UI), y precio más predecible al escalar ($5 por cada 1,000 cargas adicionales) frente al modelo de crédito mensual de Google Maps. Mapbox también permite estilos de mapa personalizados, lo que a futuro permitiría mantener la estética minimalista definida en el resto de la app en vez de heredar el estilo visual por defecto de un proveedor genérico.

2. **Geocoding real.** Las direcciones como "near Maple Park" o "Corner of Elm St & Maple Ave" hoy son texto estático — deben convertirse a coordenadas reales vía geocoding para posicionar pines correctamente en el mapa real.

3. **Clustering de pines — implementado (2026-09-30).** `mapHtml.ts`: la fuente "solo" (Lost, avistamientos con
   match, eventos) ahora también agrupa por debajo de `clusterMaxZoom` (14, mismo umbral que la fuente "items" de
   Sighted/Reunited) — antes nunca se agrupaba y a un radio amplio (10 mi) los pines se apilaban ilegibles. A zoom
   alto se mantiene la regla original: Lost, coincidencias y eventos siempre sueltos, nunca escondidos en un cluster.
   El cluster usa `clusterProperties` para contar cuántos Lost contiene (`lost_count`): si tiene al menos uno, se
   pinta en `status.lost.bg` y el número mostrado es ESE conteo (no el total); si no, se pinta neutro
   (`brand.primary`), igual que los clusters de "items". Verificado con datos sintéticos en navegador (Mapbox GL JS
   real, mismo token público): agrupa a zoom bajo, se expande al tocar el cluster o acercar zoom, un Lost aislado
   nunca se agrupa con el resto. Encuadre inicial: al abrir el mapa (o cambiar el radio de alerta), la cámara ahora
   encuadra los REPORTES cercanos (`fitBounds` sobre sus coordenadas, con `maxZoom` para no acercar de más con pocos
   reportes) en vez del círculo completo del radio — antes, con pocos reportes cerca del centro, el círculo
   completo (p. ej. 10 mi) los dejaba diminutos. Sin reportes todavía, se usa el círculo como contexto (mejor eso
   que un mapa vacío sin ninguna referencia de escala).

4. **El selector de radio ("5 mi ⌄") debe volverse funcional** — hoy no filtra nada porque no hay query real detrás. En producción, cambiar el radio debe re-consultar la base de datos con el nuevo radio, no regenerar pines artificialmente.

5. **Safe area para notch / Dynamic Island.** El HTML actual usa `<meta name="viewport" content="width=device-width, initial-scale=1">` **sin `viewport-fit=cover`** — por eso hoy no hay problema de elementos tapados (el navegador reserva el espacio automáticamente). **Si el build final busca sentirse pantalla completa/nativo** (PWA standalone o wrapper nativo), activar `viewport-fit=cover` obliga a manejar explícitamente `env(safe-area-inset-top)` en el header y `env(safe-area-inset-bottom)` en el FAB y el tab bar inferior — de lo contrario, esos elementos quedarán cubiertos por el notch/barra de estado/home indicator.

6. **Banner de estado offline — ya funcional, mantener la lógica real.** Implementado con `navigator.onLine` + eventos `online`/`offline` del navegador (verificado con prueba real de wifi apagado/encendido por el usuario). No reemplazar por un estado simulado o hardcodeado al portar a Claude Code.

7. **Generación de flyers como artefacto real.** El botón "Share flyer" (Lost) y "Share sighting" (Sighted) deben generar una imagen real descargable/compartible (no un share sheet nativo genérico con solo texto) — confirmado como el patrón de valor real por la investigación de reseñas de PawBoost, donde el flyer autogenerado en PDF es una de las funciones más elogiadas espontáneamente por usuarios reales. Dos plantillas visuales distintas ya diseñadas y validadas (ver capturas/Figma):
   - **Plantilla Lost:** header "MISSING" en `C.sos`, foto, nombre + raza, última ubicación + rasgos, bloque de contacto con **teléfono grande y legible** (debe funcionar incluso fotocopiado en blanco y negro, no depender solo de un QR), QR secundario, "Reported via PetBeacon".
   - **Plantilla Sighted:** header "Have you seen this pet?" en `C.warn`, foto, datos del avistamiento, bloque sin teléfono (el contacto es opcional en este flujo y puede no existir) — CTA dirige a notificar al dueño vía QR/app.
   - Ambas deben poblarse automáticamente con los datos reales de cada reporte, no ser imágenes de ejemplo estáticas.
   - **Decisión confirmada:** el artefacto debe ser descargable (PNG o PDF) además de compartible vía share sheet nativo — no basta con compartir un link o abrir el share sheet sin generar el archivo real primero.

8. **Validación de campos de contacto.** Ya se confirmó en el prototipo que un valor claramente inválido (ej. "a") no debería propagarse a un artefacto público como el flyer — mantener o mejorar esa validación en el build real (formato de teléfono/email real, no solo "campo no vacío").

---

## 6. Lógica de negocio ya definida (no re-derivar desde cero)

**Orden y retención del feed de Home** (investigado con datos reales de recuperación de mascotas — estudio de Ohio State, ASPCA, AVMA):
- **Lost**: prioridad máxima en las primeras 72h (ventana donde ocurre el 90%+ de las recuperaciones), nunca expira automáticamente — decae en prioridad de orden pero solo el dueño lo cierra o edita.
- **Sighted**: se retira del feed activo 24-48h después de publicado (la posición de un animal en movimiento pierde valor rápido) — el dato persiste en la base, solo deja de listarse como activo.
- **Reunited**: se retira del feed 24h después (ventana de "buena noticia"/cierre social).

**Matching automático:** cuando un nuevo Sighted coincide con un Lost activo, debe generar el banner "Possible match for [nombre]" en el feed del dueño — descartable sin perder la información (al descartarlo, pasa a badge "1 possible match" sobre la card del reporte en My Reports, no desaparece del todo).

**Criterio de estrictitud (decisión confirmada, con su razonamiento):** el sistema debe empezar del lado estricto del dial, no del laxo, porque en este producto el costo de un falso positivo (esperanza rota en el peor momento emocional del usuario) es más alto que el costo de un falso negativo (una coincidencia real que no se detecta automáticamente, pero que el usuario aún puede encontrar navegando el mapa/lista manualmente). Reglas concretas:
- **Especie exacta, no negociable** — un gato nunca hace match con un perro.
- **Radio ajustado al `alert_radius_mi` que el propio usuario configuró en Profile**, no un valor fijo del sistema.
- **Ventana de tiempo:** solo contra reportes Lost activos — como un Lost no expira automáticamente (ver regla de retención arriba), no hace falta acotar por horas en este cruce.
- **Raza como señal de refuerzo, no como filtro duro:** si coincide, sube la confianza del match (podría justificar un texto más fuerte, ej. "Strong match" vs. "Possible match"); si no coincide exactamente pero especie y zona sí, el match aún debe mostrarse, solo con menor nivel de confianza declarado.

---

## 7. Decisiones de UX ya validadas — no reabrir sin razón nueva

- **(Reemplazado en v1.1 por la tab bar flotante con Report integrado — ver la nota "v1.1" al final.)** ~~FAB en esquina inferior derecha, 73px, flotante~~ — — posición ergonómica validada (zona de alcance del pulgar), no moverlo al header ni cambiar tamaño.
- **Tab bar con 4 ítems, todos en negro/teal cuando activos** — decisión explícita de NO destacar "Support" con un color distinto en el nav, para no cargar el indicador de navegación con un segundo significado (se evaluó y descartó deliberadamente).
- **List como vista por defecto de Home, Map como alternativa de igual jerarquía** — válido en tanto Map use un proveedor real (ver requisito técnico #1); si eso no ocurre, reconsiderar la jerarquía.
- **Registro después del reporte, no antes, en la mayoría de los casos** — el onboarding permite completar Welcome → intención → Signup mínimo (2 campos) → reporte, todo saltable. Es la mejor versión posible dado que Signup sigue precediendo al reporte por estructura del flujo; si se quiere invertir esto del todo, es una decisión de producto pendiente, no un bug.

---

- **Convención de títulos (Fase 6 de la evaluación UX):** *Title Case* para los nombres de pestañas y de pantallas ("My Reports", "Support", "Profile", "Edit Profile", "Report Lost Pet"); *sentence case* para todo lo demás (botones, secciones, etiquetas). El título de cada pestaña coincide con el nombre de su ícono; las tres pestañas con título (My Reports, Support, Profile) usan el mismo componente `ScreenTitle`. Home no lleva título de texto: su cabecera es el logo.

## 8. Decisiones y preguntas abiertas

Ninguna pendiente — las tres preguntas que estaban abiertas en este documento (formato descargable del flyer, estrictitud del matching automático, proveedor de mapas) ya quedaron resueltas y documentadas en las secciones 5 y 6 correspondientes, con su razonamiento completo conservado para referencia futura (incluyendo la preparación de un Case Study de este proyecto).

---

## Archivos de referencia

- **HTML del prototipo funcional:** el adjunto más reciente de Claude Design (verificado contra este documento).
- **Figma:** `https://www.figma.com/design/EBWIYjqaxc3ZoXBU2OhgE5` — foundations, 8 componentes documentados, 26+ pantallas ensambladas.
- **Logo real de la marca:** `assets/logo/petbeacon-logo.svg` — usar ese archivo tal cual, con sus colores propios fijos (no recolorear ni enlazar a ninguna variable del tema, como ya se estableció en la sección 3). El `.pdf` incluido en la misma carpeta es solo la fuente original de diseño, no debe usarse directamente en el producto.

## Nota adicional — logotipo

El logo real de la marca está en `assets/logo/petbeacon-logo.svg` — usar ese archivo tal cual, con sus colores propios fijos (no recolorear ni enlazar a ninguna variable del tema, como ya se estableció en la sección 3). El archivo `.pdf` en la misma carpeta es solo respaldo de la fuente original de diseño, no se usa directamente en el build.

## Nota adicional — herramienta de diseño "Replay onboarding" (quitar antes de publicar)

Se agregó una sección discreta **"Design tools"** al final de Profile, con una fila **"Replay onboarding"**, para poder revisar el flujo de Onboarding completo durante el proceso de diseño sin cerrar sesión ni escribir datos reales. Detalles:

- Se controla con la variable de entorno `EXPO_PUBLIC_SHOW_DESIGN_TOOLS` (no `__DEV__`, a propósito, para poder activarla también en builds publicados con EAS Update mientras dure el proceso de diseño). En `false` o ausente, la sección no existe.
- Al tocar "Replay onboarding" se abre el Onboarding completo en un sandbox aislado (`state/onboardingPreview.tsx`): ninguna pantalla lee ni escribe la cuenta, el radio de alertas, las mascotas o Supabase reales; al terminar o cerrar (badge "Preview" con ✕, visible en cualquier paso) vuelve a Profile con todo exactamente como estaba.
- **Antes del lanzamiento: quitar esta sección de Profile (o dejar `EXPO_PUBLIC_SHOW_DESIGN_TOOLS` siempre en `false`/sin definir en el `.env` de producción).** No es una funcionalidad del producto — es una herramienta temporal de esta etapa de diseño.

**`EXPO_PUBLIC_HIDE_SAMPLE_NOTICE`** (fase de congelación, Fase 6; no existe ningún `EXPO_PUBLIC_SHOW_DEV_TOOLS`): flag separado del anterior — es sobre honestidad de los datos de Support, no sobre una herramienta de QA, así que se controla aparte. Por defecto (`false`/sin definir) el banner "These resources are sample data for testing." SE MUESTRA al principio de la lista de Support mientras existan recursos `is_sample = true`. Se pone en `true` SOLO para tomar capturas del case study — nunca en un build real mientras los recursos de Support sigan siendo de muestra, porque ocultar el aviso sin reemplazar los datos mostraría clínicas/recursos falsos a un usuario real sin explicación. El chip "Sample data" por tarjeta se eliminó por completo (era redundante con el banner, nunca estuvo detrás de ningún flag). Los botones de un recurso de muestra se ven y se tocan como cualquier otro — al tocarlos abren una hoja breve ("Sample resource") en vez de llamar o abrir un mapa falso; nunca se muestran deshabilitados sin explicar por qué (ver `components/ResourceModal.tsx`, modo `"sample"`).

## Nota adicional — escala tipográfica ("Warm Beacon")

15 estilos definidos en Figma a partir del inventario tipográfico de la app, en `theme/typography.ts` (Display/28, Title/24, Heading/20, Heading/18, Heading/16, Body-Lg/16, Body/14, Body-Sm/13, Label/14, Label/13, Button/16, Button/14, Caption/12, Badge/12, Micro/11 — este último solo para badges de conteo y etiquetas de la tab bar). Los componentes usan siempre uno de estos 15 estilos — nunca `fontSize`, `fontFamily` ni `fontWeight` sueltos. El color no forma parte de la escala: se define donde se usa cada texto, con los tokens de `Theme`.

**Tres excepciones documentadas, ninguna más:**
- `components/flyer/FlyerTemplate.tsx` — pieza impresa/exportada como imagen (el flyer descargable), no una pantalla de la app. Conserva su propia escala tipográfica, con alto contraste deliberado para leerse fotocopiada en blanco y negro (ver §5.7).
- `theme/typography.ts` exporta también `weightOff`, un modificador de **peso** (nunca tamaño ni line-height) para pares seleccionado/no-seleccionado que necesitan una señal redundante de accesibilidad además del color — hoy solo lo usa `StatusChips` (Lost/Sighted: activo en Bold, inactivo en Regular, ambos en Button/14 exacto para que el chip no cambie de alto).
- `components/account/Avatar.tsx` — las iniciales del avatar escalan con el tamaño que pide cada pantalla (`fontSize: size * 0.36`, con `size` recibido como prop y usado en 64/96 px según la pantalla), así que no puede fijarse a uno de los 15 pasos de la escala.

**Títulos de pantalla, unificados:** antes había tres tratamientos distintos (un estilo sin usar en `TabScreen.tsx`, `ScreenTitle` con un tamaño y cada pantalla secundaria con su propio bloque "back + título"). Ahora es un solo componente, `components/ScreenTitle.tsx`, con dos variantes (patrón iOS):
- `variant="display"` (Display/28) — las 3 pestañas principales: My Reports, Support, Profile (y Home, con cabecera propia).
- `variant="title"` (Title/24, default) — pantallas secundarias y pasos de flujo.

**Nombre de mascota: el rol manda sobre el contenido.** El mismo texto (el nombre de una mascota) usa un estilo distinto según el lugar que ocupa, no según "qué es":
- Si el nombre ocupa el lugar del **título de pantalla** (back + título de una pantalla secundaria, p. ej. `pet.tsx` al editar una mascota existente) → usa el estilo de título de pantalla (Title/24), igual que cualquier otro título de pantalla secundaria. No es una excepción — es solo que ahí el contenido de esa pantalla es un nombre.
- Dentro del CONTENIDO de una pantalla (no en el rol de título): **Heading/16** en listas y tarjetas (feed de Home, My Reports, lista de mascotas de Profile, selector "Which pet is missing?"), **Heading/20** en fichas de detalle (`PinDetailSheet`, "Review alert" del flujo de reporte).
- Esto es válido en toda la app sin excepción — si aparece un nombre de mascota en un lugar nuevo, se clasifica por su rol (¿es el título de la pantalla, una fila de lista/tarjeta, o una ficha de detalle?) antes de asignarle un estilo.

## Nota adicional — fotos del seed de demostración (2026-09-29)

- **Fotos reales, no hotlinks.** Las fotos nuevas del seed se descargan de Unsplash (enlace de descarga oficial) y se
  re-alojan en Supabase Storage, bucket `report-photos`, carpeta `demo/` — nunca enlazadas directo a
  `images.unsplash.com`. El crédito de cada una (autor + link a su foto) vive en `PHOTO_CREDITS.md`, junto con la lista
  de fotos que siguen como hotlink sin atribuir (pendientes de una sesión futura).
- **Subirlas requiere la service_role key** (RLS de `storage.objects` solo permite subir a `authenticated` dentro de su
  propia carpeta, 0003) — por eso es un script aparte, `app/scripts/upload-seed-photos.mjs`, que el usuario corre él
  mismo pasando la key como variable de entorno (nunca en `.env`, nunca visto por Claude Code). El script también borra
  del bucket cualquier foto vieja de Lazy que ya no esté referenciada.
- **`pets` también tiene punto focal** (`photo_focus_x/y`, migración 0023) — mismo mecanismo que `reports` ya tenía
  desde 0007, extendido para que la miniatura cuadrada de una mascota registrada (Profile, selector "Which pet is
  missing?") también pueda recortarse sin cortar la cara. Ver "Nota adicional — punto focal de fotos" (2026-09-30):
  el mecanismo cambió de implementación, `photo_zoom` quedó sin usar.
- **El seed de demostración vive en dos archivos**: `supabase/seed_demo_reset.sql` y `supabase/seed_edge_cases.sql`
  (este último son reportes propios adicionales para My Reports, no "casos sin foto" — ver su propio encabezado, que
  documenta qué tiene foto y qué no). Ambos comparten el prefijo de ID de demo (`20000000-0000-0000-0000-0000000000__`),
  así que se corren siempre juntos, primero el reset y después el segundo — si se corre el reset solo, las filas del
  segundo desaparecen hasta volver a correrlo.
- **Raza y color van en su propio campo, nunca mezclados en el texto de la raza** (corregido 2026-09-30): el
  avistamiento del gato atigrado tenía `breed = 'Domestic shorthair, gray tabby'` (el color pegado a la raza); ahora
  `breed = 'Domestic Shorthair'` y `color = 'gray'` en su columna. Se revisó el resto de razas del seed (ambos
  archivos) y no había otro caso igual.
- **Ya no queda ningún avistamiento sin foto en el seed de demostración** (ajuste de My Reports, 2026-09-30): `...013`
  (Domestic Shorthair, Simon Lohmann) y `...014` (Siamese, Nirzar Pangarkar) eran los dos últimos casos sin foto
  (probaban la silueta por especie en Past reports) — ahora tienen foto real, mismo criterio que el resto. Si se
  quiere un ejemplo dedicado de la silueta/el aviso "Add a photo" en el futuro, hay que agregarlo de nuevo a propósito.

## Nota adicional — punto focal de fotos, vía expo-image (2026-09-30)

- **`photo_focus_x`/`photo_focus_y`** (0-100, % del ancho/alto donde está la cabeza del animal) existen en `reports`
  (0007) y en `pets` (0023) — no hizo falta una migración nueva para este cambio, las columnas ya alcanzaban.
- **Implementación: `expo-image`, `contentFit="cover"` + `contentPosition`** (`components/FocusImage.tsx`), NO el
  cálculo manual anterior con `Image.getSize()` + posicionamiento absoluto en JS. Ese cálculo manual tenía un bug real
  en dispositivo (la cara quedaba cortada de una forma que no se podía reproducir en el navegador ni diagnosticar a
  distancia) — probablemente una carrera entre las dimensiones que reportaba la red y las que terminaba usando el
  visor nativo al dibujar. `contentPosition` lo resuelve el propio decodificador nativo de la plataforma.
- **`photo_zoom` quedó sin usar** (columna todavía existe en `reports` y `pets`, se puede borrar en una limpieza
  futura). `contentPosition` no tiene concepto de zoom extra más allá de "cover" — solo posición del recorte, igual
  que `object-position` en CSS. Los componentes ya no le pasan `zoom` a `FocusImage`.
- **Dónde se usa** (todos los lugares con foto de mascota recortada): tarjetas del feed (`ReportCard`), carrusel de
  estado (`MyReportStatusCard`/`ReportRow`), listas de My Reports (`MySightingCard`, `PastReports`), Profile (lista de
  mascotas), el selector "Which pet is missing?" (`ReportFlow`), `Pet profile` (`PetPhotoImage`, foto grande 4:3),
  `MatchBanner`/`MatchesSheet`, y la foto grande de `PinDetailSheet`.
- **Fotos subidas desde la app usan el centro por defecto** — no se les asigna punto focal (queda `null`), y
  `FocusImage` usa `50%/50%` cuando no hay valor. Al cambiar la foto de un reporte (`edit-report.tsx`) o de una
  mascota (`lib/pets.ts`) el punto focal anterior se limpia (`null`) — una foto nueva no hereda el foco de la vieja.
- **Los 14 puntos focales del seed de demostración se revisaron uno por uno**, a ojo, contra la foto real de cada
  ficha (no solo las que reportaron el bug) — quedan documentados como comentarios en `seed_demo_reset.sql` y
  `seed_edge_cases.sql`.

## Nota adicional — colores de estado nunca como fondo de botón (2026-09-30)

- **Regla:** `Theme.status.{lost,sighted,reunited}.*` indica ESTADOS — badges, pines del mapa, etiquetas de filtro
  (`StatusChips`), el ícono de una fila de notificación. **Nunca el fondo de un botón de acción.** Un botón de acción
  normal usa `Theme.brand.primary`. Una sola excepción documentada:
  - **Botones dentro del flujo de reporte** (`Cta` con `tone="lost"/"sighted"`, `Button` con `variant="primaryLost"/
    "primarySighted"`) cuando la acción del botón ES crear/continuar ESE tipo de reporte (ej. "Continue" dentro de
    Report Lost Pet, "Report lost" en Pet profile). Ahí el color SÍ es la acción, no solo el estado que se está viendo.
  - Lo que se corrigió (violaba la regla): el CTA principal de `PinDetailSheet` ("I've seen this pet" / "Report to
    network" / "Edit report") tomaba el color del ESTADO DEL REPORTE QUE SE ESTÁ VIENDO, no de la acción del botón —
    por eso un Lost (rojo) hacía ver "I've seen this pet" en rojo, aunque esa acción en realidad ABRE un reporte
    Sighted. Ahora usa `brand.primary`, como cualquier otro botón de acción.
  - **Las tarjetas "I lost my pet"/"I saw a pet"** (Welcome de onboarding y `ReportSheet` del FAB, componente
    compartido `IntentOption`) NO son una excepción: son tarjetas NEUTRAS (surface.card + borde), el color de
    estado va solo en el círculo del ícono. El Welcome antes usaba el color de estado como fondo de todo el botón
    (era la violación) — corregido 2026-09-30 para seguir el mismo patrón que `ReportSheet` siempre tuvo. Mismos
    textos/íconos que `ReportSheet` en ambos: "I lost my pet" (Siren) / "I saw a pet" (Eye).
- **`Theme.danger`** (`bg`/`text`/`border`/`tint`, apuntando a los mismos primitivos `coral` que `status.lost`, pero
  como tokens propios) es el color de error/peligro genérico — validación de formularios, "Delete account", enlaces
  destructivos ("Remove photo"). Existía de antes reutilizando `status.lost.bgStrong` por el mismo tono; ahora está
  separado: `status.lost.*` significa "este reporte está perdido", `danger.*` significa "esto es un error o una
  acción irreversible". Ninguno de los dos es el fondo de un botón de acción normal.
- **Caso NO tocado, deliberado:** el enlace rojo "Can't find the right spot? Enter it manually" de
  `LocationPicker.tsx` (variant "flow") — es una elección de estilo del prototipo original ("enlaces rojos" en el
  comentario del componente), no un error ni un indicador de estado; no encaja en ninguna de las dos categorías de
  arriba, así que se deja igual salvo que se pida lo contrario.

## Nota adicional — raza siempre por su etiqueta canónica, nunca el texto libre crudo (2026-09-30)

- **Regla:** cualquier pantalla que muestre la raza de un reporte o una mascota debe resolverla por `breed_id`
  (`lib/breeds.ts`: `breedLabel(breed, breedId)` para filas de BD con forma `{breed, breed_id}`; `breedDisplay(v)` para
  el `BreedValue` del formulario de edición) — **nunca** mostrar la columna `breed` (texto libre) directamente. Sin
  esto, un mismo animal podía verse distinto según la pantalla: el feed de Home mostraba el texto tal cual se guardó
  ("Siamese cat", "Domestic shorthair, gray tabby") mientras que las pantallas que sí resolvían por id mostraban la
  etiqueta real del catálogo ("Siamese", "Domestic Shorthair").
- **Causa raíz (tres partes, las tres corregidas):**
  1. `active_reports`/`reports_nearby()`/`my_matches()` (funciones SQL que alimentan el feed de Home, `PinDetailSheet`
     y las coincidencias) nunca seleccionaban `breed_id` — solo `breed` — aunque la columna existe en `reports` desde
     la 0016. Corregido en la migración `0024_breed_id_nearby.sql` (agrega `breed_id` a las tres; `sighted_breed_id` en
     `my_matches()`, aunque hoy ningún texto en pantalla lo use todavía — se agrega por simetría con `sighted_breed`).
  2. `seed_edge_cases.sql` insertaba sus propias filas (`...013/014/017/018`) sin pasarlas por
     `map_breed_or_mixed()` — ese mapeo vive en el paso 6 de `seed_demo_reset.sql`, que ya corrió antes y nunca ve
     filas insertadas después. Corregido: `seed_edge_cases.sql` ahora mapea sus propias 4 filas al final de su script.
  3. Hooks/helpers que leen `reports`/`pets` directamente (no vía las funciones de arriba) tampoco seleccionaban
     `breed_id` en su lista de columnas, aunque la tabla sí la tiene: `useMyReports.ts` (My Reports/History),
     `lib/flyer.ts` (`loadFlyerData`, el flyer descargable). Corregido agregando `breed_id` a `COLS_BASE`/`COLS` y al
     tipo `Pick<...>` de cada uno. `lib/myReports.ts` (`toNearby()`, que convierte un `MyReport` propio a la forma
     `ReportNearby` para reusar `MySightingCard`) tampoco copiaba `breed_id` al convertir — corregido también.
- **Dónde se aplicó `breedLabel()`** (antes usaban `r.breed`/`p.breed` crudo): `lib/reportText.ts`
  (`reportTitle`/`reportSubtitle`, compartido por el feed y `PastReports`), `PinDetailSheet.tsx` (línea de raza bajo el
  título), `MySightingCard.tsx` (título cuando no hay nombre, y el aviso "Add breed or details"), `profile.tsx` (lista
  de mascotas registradas), `ReportFlow.tsx` (selector "Which pet is missing?"), `FlyerTemplate.tsx` y
  `lib/shareText.ts` (texto de "Share alert"/"Share sighting" por la hoja nativa).
- **Un registro real (no del seed) también estaba mal clasificado:** un avistamiento propio de un perro sin raza en
  el texto (`breed` null) cuya foto es claramente un Labrador — se le asignó `breed = 'Labrador Retriever'` y
  `breed_id = 'labrador-retriever'` con un UPDATE puntual (no es una fila del seed, así que no se corrige re-corriendo
  ningún script).
- **No re-derivar esto de nuevo:** cualquier pantalla nueva que muestre una raza debe pasar por `breedLabel()`/
  `breedDisplay()`, no por el campo `breed` directo — es el mismo criterio que ya seguían `lib/matchCopy.ts` (que
  nunca mostró la raza del avistamiento, solo la especie, así que no necesitó cambios) y los formularios de edición.
- **"Mark reunited" → "Mark as reunited" (2026-09-30):** `MyReportStatusCard.tsx` decía "Mark reunited" mientras
  `PinDetailSheet.tsx` ya decía "Mark as reunited" para la misma acción — unificado a "Mark as reunited" en toda la
  app.

## Nota adicional — fase de congelación: Profile, Support y Pet profile (2026-10-01)

Fases 1–12 del documento "PetBeacon — Fase de congelación", todas aplicadas (1–6 primero; 7–12 después de su auditoría
y aprobación).

- **Fase 1, botón secundario único:** `components/Button.tsx` es el único componente de botón de la app. Variantes:
  `primary` (brand.primary, nueva), `primaryLost`/`primarySighted` (excepción ya documentada arriba, sin cambios),
  `secondary` (surface.card + borde border.strong + text.primary — igual en los 52px por defecto que en
  `size="compact"`, MIN_HIT-4/Button-14, para botones embebidos en una tarjeta), `ghost`. Acepta un `Icon` opcional
  (lucide). Migrados a este componente: Log out (`profile.tsx`), Change photo (`pet/PetPhoto.tsx`), el botón de
  Contact/Learn more de cada `ResourceCard`, el de Get directions de `EventResourceCard`, y la acción principal de
  `ResourceModal`'s Detail (que además pasó de `info.bg` a `brand.primary` — no es un estado, es una acción normal).
  Ningún botón de Support se muestra ya deshabilitado por ser `is_sample`: ver Fase 6.
- **Fase 2, acción destructiva en Pet profile:** el link "Remove from my pets" (`app/pet.tsx`) usa `danger.text`.
  Dentro de `pet/RemovePetSheet.tsx`, el paso de confirmar "Remove from my profile" usa `danger.bg` (es destructiva);
  el paso de confirmar "My pet passed away" usa el botón `secondary` (momento de duelo, nunca rojo). El bloqueo con
  Lost activo y el archivado vía `archive_pet()` (nunca borra la fila, ver 0017) no cambiaron.
- **Fase 3, FAB (retirado en v1.1, ver nota final):** vivía una sola vez en `app/(tabs)/_layout.tsx`, compartido por las 4 pestañas vía `state/fab.tsx`.
  Se le agregó `hidden` (independiente de `collapsed`, que ya existía para el scroll) y el hook `hooks/useFabHidden.ts`
  (mismo patrón `useFocusEffect` que `useFabScroll`) — Profile lo llama y pierde el FAB al enfocarse, lo recupera al
  salir. My Reports (`components/TabScreen.tsx`) y Support usan `FAB_CLEARANCE` en vez de `paddingBottom: 200` a
  mano; Profile (sin FAB) usa `spacing["2xl"]`.
- **Fase 4, tokens nuevos:** `P.neutral[400]` (`#8F8B84`), `Theme.control` (`trackOn`/`trackOff`/`knob`, para el
  Toggle — ya aplicado en el componente, ver Fase 7) y
  `Theme.category.tile` (`bg`/`icon`, pine/50 y pine/700).
- **Fase 5, categorías de Support sin color propio:** decisión explícita — las 4 categorías (`food`/`foster`/
  `legal`/`shelter`) ya NO se diferencian por color; todas usan `category.tile.bg`/`category.tile.icon`. El
  significado lo llevan el ícono (ya distinto por categoría) y el filtro. Esto reemplaza el mapeo anterior, que
  violaba la regla de estados: `foster` usaba `status.lost.bgStrong` y `legal` usaba `brand.primary`. El ribbon de
  evento sigue en `info.*` (es información destacada, no una categoría). `honey` sigue reservado para advertencias —
  no se usó aquí.
- **Fase 6, datos de muestra:** el chip "Sample data" por tarjeta se eliminó por completo (`components/resources/
  parts.tsx`, ya no existe `SampleTag`) — era redundante con el banner. El banner superior de Support
  ("These resources are sample data for testing.") se sigue mostrando por defecto; se oculta SOLO con
  `EXPO_PUBLIC_HIDE_SAMPLE_NOTICE=true` (flag nuevo, documentado junto a `EXPO_PUBLIC_SHOW_DESIGN_TOOLS` arriba —
  son dos flags separados a propósito, uno es QA y el otro es honestidad de datos). Los botones de un recurso de
  muestra se ven y se tocan como cualquiera: tocarlos abre `ResourceModal` en su tercer modo, `"sample"` — una hoja
  breve ("Sample resource" + texto + "Got it") en vez de llamar a un teléfono falso o abrir un mapa falso. Aplica a
  las 4 vías de entrada: el botón de la tarjeta, el de `EventResourceCard`, la acción principal del detalle, y cada
  fila de la hoja de Contact (Call/WhatsApp/Directions/Website).
- **Fase 7, Toggle:** `components/Toggle.tsx` usa `control.trackOn`/`control.trackOff`/`control.knob` (antes
  `brand.primary`/`border.strong`/`surface.card`) — el único cambio visible es el track apagado, ahora más oscuro
  (contraste WCAG 1.4.11). Sin otros usos sueltos de esos colores que migrar (`ToggleRow` es el único consumidor).
- **Fase 8, Tags y evento duplicado:** `Tag` (`components/resources/parts.tsx`) es ahora un componente exportado;
  `TagChips` solo lo recorre. El evento "Free pet food pantry" compartía dominio y teléfono con "Hudson County Pet
  Pantry" (mismo recurso modelado dos veces) — ahora es "Free microchip day", con su propio marcador ficticio
  (`(914) 555-0199` / `free-microchip-day.example.org` en `seed.sql`; `(201) 555-0199` / `free-microchip-day.example.org`
  en la reubicación a North Bergen de `seed_demo_reset.sql`) e ícono `heart-pulse`
  (antes el genérico de `food`). `seed.sql` ya crea la fila con el nombre nuevo; `seed_demo_reset.sql` acepta ambos
  nombres (`where name in (...)`) para que una base ya seedeada con el nombre viejo también quede bien. La migración
  `0022_resource_details.sql` (histórica, no se edita) mapeó `tags`/`in_person` por el nombre viejo — `seed_demo_reset.sql`
  los vuelve a fijar por el nombre nuevo, así que no dependen de en qué momento se creó la fila.
- **Dominios de muestra, todos a `*.example.org` (2026-10-01):** los 8 recursos de `seed.sql`/`seed_demo_reset.sql`
  usaban dominios inventados pero con forma de dominio real (`westchesterpetpantry.org`, `lowcostspayneuter.org`,
  etc.) — nombres plausibles que alguien podría registrar de verdad. Ahora todos usan `*.example.org`
  (`westchester-pet-pantry.example.org`, `hudson-county-pet-pantry.example.org`, `low-cost-spay-neuter.example.org`,
  `vet-aid-fund.example.org`, `bridge-foster-network.example.org`, `crisis-boarding.example.org`,
  `animal-welfare-legal-aid.example.org`, `riverside-animal-sanctuary.example.org`,
  `free-microchip-day.example.org`) — `example.org`/`.com`/`.net` están reservados por el RFC 2606 exactamente para
  esto, nunca se asignan a un sitio real. Los teléfonos `555-01XX` se quedan igual (decisión explícita: ya son el
  marcador estándar de "no es real" en EE. UU., no hace falta tocarlos).
- **Fase 9, estructura de Profile:** "Alert area" es ahora una sola tarjeta (ubicación + radio) — antes la ubicación
  era una línea suelta en el header y el radio su propia sección. "Save your account" es SIEMPRE la tarjeta de
  llamada a la acción debajo del header (antes, sin un Lost activo, era una fila discreta dentro de "Account") — el
  texto cambia según haya o no un Lost activo, pero el tratamiento es el mismo. "Account" es una sola tarjeta
  agrupada con divisores (mismo patrón que "Notifications"), con "Account saved" como su primera fila cuando la
  cuenta ya tiene correo. `NavRow` ganó una prop `grouped` para los dos modos (tarjeta propia vs. fila agrupada) —
  sigue usándose como tarjeta propia en "Registered pets" y "Design tools".
- **Fase 10, tipografía:** `rowTitle`/`rowSubtitle` (antes `petName`/`petBreed`) son Heading/16 y Body/14
  text/secondary — usados por mascotas registradas, `NavRow` y "Account saved". `ToggleRow` y las preguntas de
  `help.tsx` subieron de Label/14 a Heading/16 para compartir estilo con lo anterior. Los encabezados de sección
  (`sec`, mayúsculas) de `profile.tsx` y `help.tsx` pasaron de `text.muted` a `text.secondary`.
- **Fase 11, microcopy:** `lib/time.ts` → `elapsedShort()` ya no abrevia ("Missing for 3 hours", nunca "3h"/"1d");
  `agoShort()` se queda igual a propósito ("1h ago" es una convención de metadatos distinta, no una duración). "Save
  your account" (`profile.tsx`) ya pluraliza bien: "an active alert for Lazy" / "active alerts for Max and Lazy" /
  "active alerts for 3 pets" (antes siempre decía "an active alert" y el caso de 3+ mostraba el genérico "your
  pets"). Nuevo `lib/config.ts` con `SUPPORT_EMAIL` (valor de ejemplo, ficticio a propósito) y una tarjeta "Still
  need help?" al final de `help.tsx` que abre `mailto:` con ese correo.
- **Fase 12, Pet profile — vista y edición separadas:** `app/pet.tsx` tiene un estado local `mode: "view" | "edit"`.
  Una mascota nueva entra directo en `"edit"` (no hay nada que ver todavía); una existente entra en `"view"`: foto,
  nombre (Title/24) + "Breed · Size · Color" (Body/14 secondary), la tarjeta de estado (Lost/Reunited) o "Report
  lost" si está en casa, y una ficha "Details" de solo lectura (filas clave–valor, Body/14 secondary / Label/14
  primary, Fase 10) con el microchip enmascarado (`maskMicrochip()`, nuevo en `lib/microchip.ts` — solo los últimos
  4 caracteres) y campos vacíos como "Not added yet" en `text.muted`. "Edit details" lleva al modo edición (el
  formulario de siempre); ahí "Change photo"/"Remove photo" y el bloque de estado/"Report lost" YA NO aparecen (se
  movieron/quedaron en el modo vista). "Save changes" en una mascota existente ya no hace `router.back()`: actualiza
  el formulario con la fila guardada y vuelve a `"view"` en la misma pantalla. En una mascota nueva, sí navega —
  pero con `router.replace` a `/pet?id=<la nueva>` (no `router.back()`), para que "atrás" lleve a Profile y no al
  formulario vacío. "Cancel" (nuevo, junto a "Save changes") revierte a los valores guardados y vuelve a `"view"`;
  si hay cambios sin guardar pregunta "Discard changes?" — el mismo diálogo que ya usaba el listener de navegación,
  pero disparado aparte porque cambiar de `mode` es un cambio de estado local, no una navegación que ese listener
  pueda interceptar.
- **Ajustes finales antes de congelar (2026-10-02):** la hoja "Sample resource" ya muestra su título (Heading/18; antes
  usaba un estilo con `flex: 1` que lo colapsaba a altura 0). El header de Pet profile en edición dice "Edit {nombre}"
  ("Add pet" si es nueva). La descripción de las tarjetas de recurso usa `CardDescription` (`components/resources/
  parts.tsx`): mide el ancho real de su contenedor y se lo da al `Text` como `width` explícito, con `numberOfLines={2}`
  (REVISADO 2026-10-03: ver abajo, `numberOfLines` se quitó).
  Motivo: en iOS, con el ancho intrínseco, la descripción de Riverside Animal Sanctuary se medía a 2 líneas pero se
  pintaba en una sola, cortada a media palabra; ni quitar el wrapper del grupo "rehoming" ni cambiar `numberOfLines`
  por `maxHeight` lo arreglaron. Si aparece el mismo síntoma en otro `Text` multilínea dentro de una columna `flex: 1`,
  usar el mismo patrón (ancho explícito medido con `onLayout`).

## Nota adicional — v1.1: tab bar flotante con Report integrado (rama `feature/floating-tab-bar`)

Sustituye la tab bar de 4 pestañas **y** el FAB "Report" por una sola barra flotante (Figma "TabBar — Floating"). Esto
reemplaza la decisión de §7 sobre el FAB de 73 px.

- **`components/FloatingTabBar.tsx`** (prop `tabBar` de `Tabs`, en `app/(tabs)/_layout.tsx`): posición absoluta, márgenes
  laterales de 16 (`TAB_BAR_SIDE_MARGIN`), fondo `surface.card`, borde `border.default`, radio `radius.xl` (28, token
  nuevo), `elevation[2]`, padding 8. Cinco huecos: Home, My Reports, **Report**, Support, Profile. Report no es una ruta:
  es un botón de 56×44 (`radius.pill`, `brand.primary`, `Plus` de 24 en `text.onAccent`) en un hueco de ancho fijo de 64
  (`REPORT_BUTTON`); las cuatro pestañas (`TabBarButton`, `flex: 1`) se reparten el resto por igual. Al pulsarlo abre la
  misma `ReportSheet` que abría el FAB ("I lost my pet" / "I saw a pet") y de ahí `/report/lost` o `/report/sighted` —
  el flujo no cambió. Las pestañas usan `accessibilityRole="tab"` y emiten `tabPress`/`tabLongPress`; Report es
  `button` con label "Report a pet" y hint "Report a lost pet or a sighting".
- **Ancho verificado con las métricas reales de Manrope Bold 11:** "My Reports" mide 60,3 pt; en 360 dp el hueco de
  pestaña es 61,5 pt (cabe con 1,2 pt de margen, sin truncar ni reducir fuente), en 375 pt 65,2 pt, en 393 pt 69,8 pt. En
  320 pt (iPhone SE de 1.ª generación) NO cabe — decisión explícita: no se diseña para 320.
- **`hooks/useTabBarClearance.ts`:** `TAB_BAR_CLEARANCE` = `TAB_BAR_HEIGHT` (65) + distancia inferior
  (`Math.max(insets.bottom - 8, 12)`, también `tabBarBottomDistance`) + `spacing.lg`. Es un hook, no una constante fija,
  porque depende de la safe area real. Lo usan el padding inferior de Home (lista), My Reports (`TabScreen`), Support y
  Profile, y la base de los controles flotantes: `Snackbar` (siempre por encima de la barra), y en el mapa la tarjeta de
  vista previa, el botón de recentrar y el estado vacío. El mapa se extiende hasta el borde inferior, por detrás de la barra;
  `MapboxWebView` recibe `bottomInset` y `mapHtml.ts` sube `.mapboxgl-ctrl-bottom-left/right` (atribución y logo de Mapbox,
  obligatorios por sus términos) ese tanto, y el `fitBounds` automático deja libre ese espacio. Con la tarjeta inferior del mapa
  abierta (vista previa de un pin o aviso de estado vacío) Home mide su alto real con `onLayout` y envía
  `TAB_BAR_CLEARANCE + alto + 8`; el inset inicial va en el HTML y los cambios se inyectan con `window.__setInset(px)` (nunca
  se recarga el mapa), de modo que el logo y la "i" quedan visibles con y sin tarjeta.
- **FAB retirado:** se eliminaron `ExtendedFab`, `state/fab.tsx` (`FabProvider`), `useFabScroll`, `useFabHidden`,
  `FAB_SIZE` y `FAB_CLEARANCE`. La búsqueda de Home que se ocultaba al bajar usaba el estado del FAB; ahora usa un estado
  local de dirección de scroll solo en Home (`onListScroll`/`scrollingDown`), independiente de la barra.
- **Búsqueda de Home (lista) sin saltos:** (1) en las zonas de rebote de iOS (offset <= 0, o se llegó al final) `onListScroll`
  ignora los cambios de dirección — el rebote invierte el offset solo y antes hacía reaparecer la búsqueda al soltar al
  final; (2) histéresis: hace falta recorrer `SCROLL_HYSTERESIS` (20 px) seguidos en una dirección para ocultarla/mostrarla;
  (3) se oculta SOLO con transformaciones (`translateY` + opacidad), nunca cambiando la altura de nada: la barra del
  logo tiene su propio fondo y va por encima (`zIndex`); el hueco de los controles (`controls`) es transparente y solo reserva
  alto, mientras que el fondo blanco, el borde inferior y la sombra viven en `controlsInner`, que es lo que se traslada —
  así, con la búsqueda oculta, el encabezado termina justo debajo de los chips y no queda ninguna franja blanca sobre las
  tarjetas. El bloque de controles, los avisos y el área de contenido suben `SEARCH_H` (54) juntos; el marco
  de la lista ya viene `SEARCH_H` más alto por debajo (`marginBottom: -SEARCH_H`, queda detrás de la tab bar, con ese
  padding extra al final) y es el propio contenedor del área el que se traslada, para que los toques caigan siempre
  dentro de sus límites (también en Android); (4) con `useReducedMotion` el cambio es instantáneo. La lista nunca se
  recoloca, así que el salto de layout no puede ocurrir.
- **Comportamiento:** la barra es fija y siempre visible (no se oculta ni se minimiza al hacer scroll) y desaparece
  mientras el teclado está abierto (`useKeyboardVisible`: `keyboardWillShow/Hide` en iOS, `keyboardDidShow/Hide` en
  Android). Las pantallas del Stack raíz (`pet`, `report/*`, `help`, `edit-*`, `privacy`, `delete-account`, `flyer`) no la
  muestran porque no están dentro de `(tabs)`; no hizo falta código extra. En Android < 9 `boxShadow` no dibuja sombra
  (aceptado).
- **`CardDescription` con `onTextLayout` (2026-10-03, revisa la versión "sin `numberOfLines`"):** esa versión
  (`maxHeight = 2 × lineHeight`) recortaba la SEGUNDA línea por la mitad: el `lineHeight` de la tipografía de la app (19 en
  Body-Sm/13) es MENOR que la altura natural real de la línea de Manrope (≈ 1.366 em), así que dos líneas reales miden más que
  `2 × lineHeight`. Ahora no se supone ninguna altura: ancho explícito medido + `onTextLayout` (`e.nativeEvent.lines`, con el
  `text` y el `height` REALES de cada línea). Hasta 2 líneas: el tope de altura es la suma de sus alturas reales. Más de 2: se
  sustituye el texto por las 2 primeras con la segunda sin su última palabra + "…" y se vuelve a medir hasta que quepa
  (nunca queda una línea recortada a la mitad). Opacidad 0 hasta tener la medida; se re-mide si cambian texto, ancho o
  `fontScale`. Lo usan las tarjetas de Support y la de evento. La lista de Support usa un `contentContainerStyle` estable
  (`useMemo`) en vez de un array nuevo por render.

## Nota adicional — texto dinámico: contención hecha (v1.1), solución completa pendiente para la etapa B (2026-10-03)

Auditoría del tamaño de texto del sistema (Dynamic Type / "Texto más grande"). Se implementó SOLO la contención, para que
el texto grande no rompa contenedores; la solución completa queda como etapa B.

- **`components/AppText.tsx`** (nuevo): envuelve `Text` de RN y pone `maxFontSizeMultiplier` según la prop `role`
  (`Text.defaultProps` no sirve con React 19, por eso es un componente). Todos los `Text` de la app pasan por él
  (reemplazo mecánico en 75 archivos). Excepción: `FlyerTemplate.tsx` conserva el `Text` de RN (pieza impresa/exportada).
  Un `TextInput` no pasa por `AppText` (hoy sin tope propio — pendiente de revisar en la etapa B).
- **Topes por rol:** `tab` 1.0 (etiquetas de la barra: Micro/11, la barra flotante tiene alto fijo) · `control` 1.3 (Button/16,
  Button/14, Badge/12 y Micro/11 en badges) · `title` 1.5 (Display/28, Title/24) · `reading` 1.5 (Heading, Body, Label,
  Caption — SUBIRÁ A 2.0 cuando las tarjetas admitan 2 líneas, ver abajo). El rol se asigna por el estilo tipográfico que usa
  cada texto; si un texto de botón/título nuevo no lleva `role`, cae en `reading`.
- **Alturas fijas → `minHeight`:** `CompactSegmented` (pista 36 / segmento 32), `ActiveFilters` (chip y "Clear all" 30),
  `SearchBar` (campo 44), `FilterButton` (40). Con el tope de 1.5 el campo de búsqueda sigue en 44 (su línea más alta es
  24 × 1.5 = 36), así que `SEARCH_H = 54` en Home sigue alcanzando.

**Pendiente para la etapa B (NO tocado a propósito):**
1. **Tarjetas con `numberOfLines={1}`** — con texto ampliado el nombre/raza/ubicación se recortan en una línea. Hay que
   decidir cuáles admiten 2 líneas (y entonces subir el tope `reading` a 2.0): `pet.tsx` (178, 276), `(tabs)/index.tsx` 315,
   `profile.tsx` (96, 123, 159, 182), `ReportCard.tsx` (31, 42, 58, 59), `MyReportStatusCard.tsx` 55, `PastReports.tsx` (31, 34),
   `ReportRow.tsx` (25, 32), `ReportFlow.tsx` (178, 179), `BreedPicker.tsx` 41, `resources/parts.tsx` 14 (`OpenNow`).
   `TabBarButton.tsx` queda en 1 línea (tope 1.0). `ReportCard` ya tiene su modo apilado `ACCESSIBILITY_FONT_SCALE = 1.5`.
2. **Siete estilos de `theme/typography.ts` con `lineHeight` por DEBAJO de la altura natural de su fuente** (Manrope 1.366 em,
   Outfit 1.26, Geist 1.30): `display28` (34), `title24` (29), `heading20` (25, marginal), `button16` (19), `button14` (17),
   `badge12` (14), `micro11` (13). iOS multiplica el `lineHeight` por el factor de fuente y, si queda por debajo de la
   altura natural, no aplica el desplazamiento de línea base — con texto grande los glifos pueden tocar el borde del
   contenedor. Revisar junto con el punto 1.
