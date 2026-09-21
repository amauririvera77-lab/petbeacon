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
1. **Welcome** — "What brings you here today?" con 3 salidas: "I lost my pet" (primario, coral), "I see a pet" (primario, azul), "Just setting up — I'll register my pet now" (link secundario) + **"Struggling to care for your pet right now? See local support"** (link secundario, lleva directo a Support and care sin pasar por registro/permisos).
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
- **Pin detail sheet** — 3 estados distintos, no uno solo con texto condicional:
  - Lost con match → CTA "I've seen this pet" (ícono ojo) + "Share flyer".
  - Sighted sin match → CTA "Report to network" + **"Share sighting"** (no "Share flyer" — corregido).
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

3. **Clustering de pines.** En cuanto exista data real y el radio de búsqueda sea amplio, pines cercanos deben agruparse visualmente (círculo con número) hasta hacer zoom — es prácticamente obligatorio en cualquier mapa de producción con volumen de datos real, no opcional.

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

- **FAB en esquina inferior derecha, 73px, flotante** — posición ergonómica validada (zona de alcance del pulgar), no moverlo al header ni cambiar tamaño.
- **Tab bar con 4 ítems, todos en negro/teal cuando activos** — decisión explícita de NO destacar "Support" con un color distinto en el nav, para no cargar el indicador de navegación con un segundo significado (se evaluó y descartó deliberadamente).
- **List como vista por defecto de Home, Map como alternativa de igual jerarquía** — válido en tanto Map use un proveedor real (ver requisito técnico #1); si eso no ocurre, reconsiderar la jerarquía.
- **Registro después del reporte, no antes, en la mayoría de los casos** — el onboarding permite completar Welcome → intención → Signup mínimo (2 campos) → reporte, todo saltable. Es la mejor versión posible dado que Signup sigue precediendo al reporte por estructura del flujo; si se quiere invertir esto del todo, es una decisión de producto pendiente, no un bug.

---

## 8. Decisiones y preguntas abiertas

Ninguna pendiente — las tres preguntas que estaban abiertas en este documento (formato descargable del flyer, estrictitud del matching automático, proveedor de mapas) ya quedaron resueltas y documentadas en las secciones 5 y 6 correspondientes, con su razonamiento completo conservado para referencia futura (incluyendo la preparación de un Case Study de este proyecto).

---

## Archivos de referencia

- **HTML del prototipo funcional:** el adjunto más reciente de Claude Design (verificado contra este documento).
- **Figma:** `https://www.figma.com/design/EBWIYjqaxc3ZoXBU2OhgE5` — foundations, 8 componentes documentados, 26+ pantallas ensambladas.
- **Logo real de la marca:** `assets/logo/petbeacon-logo.svg` — usar ese archivo tal cual, con sus colores propios fijos (no recolorear ni enlazar a ninguna variable del tema, como ya se estableció en la sección 3). El `.pdf` incluido en la misma carpeta es solo la fuente original de diseño, no debe usarse directamente en el producto.

## Nota adicional — logotipo

El logo real de la marca está en `assets/logo/petbeacon-logo.svg` — usar ese archivo tal cual, con sus colores propios fijos (no recolorear ni enlazar a ninguna variable del tema, como ya se estableció en la sección 3). El archivo `.pdf` en la misma carpeta es solo respaldo de la fuente original de diseño, no se usa directamente en el build.
