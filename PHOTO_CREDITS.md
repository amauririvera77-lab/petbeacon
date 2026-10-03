# Créditos de fotos — seed de demostración

Todas las fotos de `supabase/seed_demo_reset.sql` y `supabase/seed_edge_cases.sql` son de [Unsplash](https://unsplash.com),
bajo la [Licencia de Unsplash](https://unsplash.com/license) (uso libre, incluso comercial, sin pedir permiso; se agradece
pero no se exige atribución — este archivo la da de todos modos).

## Fotos agregadas en esta sesión (2026-09-30)

Mismo criterio que el grupo de abajo (enlace de descarga oficial, re-alojadas en `report-photos/demo/`). Ajuste de My
Reports: `...013` y `...014` eran los dos últimos avistamientos del seed sin foto (antes probaban deliberadamente la
silueta por especie en Past reports); con esto, todo el seed de demostración tiene foto real.

| Uso en el seed | Autor | Foto |
|---|---|---|
| Avistamiento "Domestic Shorthair" vencido (mío, Past reports) | [Simon Lohmann](https://unsplash.com/@slohmann) | [unsplash.com/photos/lNtZMTmnpRU](https://unsplash.com/photos/black-cat-walking-on-brick-floor-during-daytime-lNtZMTmnpRU) |
| Avistamiento "Siamese" resuelto (mío, returned_to_owner, Past reports) | [Nirzar Pangarkar](https://unsplash.com/@nirzar) | [unsplash.com/photos/sDpmnfv-KRk](https://unsplash.com/photos/short-fur-white-and-black-cat-on-green-textile-sDpmnfv-KRk) |

## Fotos agregadas en esta sesión (2026-09-29)

Descargadas desde el enlace de descarga oficial de cada foto (`unsplash.com/photos/<id>/download?force=true`) y
re-alojadas en Supabase Storage (`report-photos/demo/`), no enlazadas directo a `images.unsplash.com`.

| Uso en el seed | Autor | Foto |
|---|---|---|
| Avistamiento "Siberian Husky" (mío, Past reports) | [Sophia Fries](https://unsplash.com/@sophia_marlena) | [unsplash.com/photos/Oa7667QHBdM](https://unsplash.com/photos/a-husky-dog-sitting-on-the-ground-in-the-dark-Oa7667QHBdM) |
| Avistamiento "Golden Retriever" que hace match `strong` con Max | [Emil Priver](https://unsplash.com/@emilpriver) | [unsplash.com/photos/58jPAR2Of8s](https://unsplash.com/photos/a-golden-retriever-sitting-in-the-middle-of-a-forest-58jPAR2Of8s) |
| Lazy (Pekingese) — mascota registrada y su reporte Lost | [Mano Nair](https://unsplash.com/@manonair) | [unsplash.com/photos/sYzDqoWh0zk](https://unsplash.com/photos/a-fluffy-pekingese-dog-rests-on-a-dark-blanket-sYzDqoWh0zk) |
| Avistamiento "Labrador mix" | [Judy Beth Morris](https://unsplash.com/@judy_beth_morris_idaho) | [unsplash.com/photos/LEDa86jIuBs](https://unsplash.com/photos/a-black-dog-laying-on-top-of-a-lush-green-field-LEDa86jIuBs) |
| Bartholomew Maximilian von Schnauzenberg (Miniature Schnauzer) | [Alda González-Cuevas](https://unsplash.com/@marianaglezc) | [unsplash.com/photos/VUpV8Vb9eNg](https://unsplash.com/photos/black-long-coat-small-dog-lying-on-white-and-brown-stripe-textile-VUpV8Vb9eNg) |
| Whiskers (Persian) | [Syed Muhammad Baqir Zaidi](https://unsplash.com/@zaidi_14) | [unsplash.com/photos/FsxsMdIh2jU](https://unsplash.com/photos/a-white-kitten-laying-on-top-of-a-brown-leather-chair-FsxsMdIh2jU) |
| Avistamiento "Terrier mix" (mío, en My Reports) | [Petra Andrews](https://unsplash.com/@andrewspetra) | [unsplash.com/photos/Gmqcb0j_kjE](https://unsplash.com/photos/a-white-dog-standing-on-a-wooden-bridge-Gmqcb0j_kjE) |
| Avistamiento "Siamese cat" que hace match `strong` con Luna | [Alex Meier](https://unsplash.com/@alexmeier19) | [unsplash.com/photos/KGiQFgF7dkc](https://unsplash.com/photos/siamese-cat-KGiQFgF7dkc) |

Archivos originales (antes de redimensionar a 1600px / comprimir para el repo) descartados tras subirlos; las copias
usadas por el seed están en `supabase/seed-assets/`.

## Fotos que ya estaban en el seed antes de esta sesión — SIN atribuir

Estas siguen enlazadas directo a `images.unsplash.com/photo-<id>` (hotlink, fuera del alcance de esta tarea). No pude
identificar de forma confiable a su autor: el identificador que usa la URL del CDN (`photo-<timestamp>-<hash>`) es
interno de Unsplash y **no** corresponde al slug de la página pública de la foto (`unsplash.com/photos/<id-corto>`),
así que no hay forma directa de "ir hacia atrás" desde el link hotlinkeado hasta su página de origen — probé la
búsqueda inversa de imágenes de Google (bloqueada por su verificación anti-bot) y de Bing (solo devuelve resultados
genéricos por tema, no la foto exacta). Quedan pendientes de atribuir:

| Uso en el seed | URL actual (hotlink, sin atribuir) |
|---|---|
| Max (Golden Retriever, mascota + su reporte Lost) | `images.unsplash.com/photo-1552053831-71594a27632d` |
| Luna (Siamese, reporte Lost) | `images.unsplash.com/photo-1695708794933-57424f0bf14e` |
| Buddy (Beagle, mascota + reporte reunited) y el avistamiento "Beagle mix" (misma foto reutilizada) | `images.unsplash.com/photo-1703721025121-26d64508482b` |
| Biscuit (Labrador mix, reporte reunited) | `images.unsplash.com/photo-1585588640338-2c3dc723e638` |
| Avistamiento gato gris atigrado | `images.unsplash.com/photo-1557735802-ef14538b00a4` |
| Avistamiento "Golden Retriever" (el que ya tenía foto y match `strong` antes de esta sesión) | `images.unsplash.com/photo-1611250282006-4484dd3fba6b` |

**Si quieres, en una sesión aparte puedo reemplazar también estas 6 por fotos nuevas de Unsplash, descargadas y
re-alojadas igual que las de arriba, con su crédito completo.** Mientras tanto siguen funcionando igual (son solo
hotlinks públicos), pero no cumplen "no uses enlaces externos" ni tienen atribución registrada.
