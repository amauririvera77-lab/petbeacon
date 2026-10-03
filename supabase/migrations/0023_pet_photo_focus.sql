-- Punto focal de la foto de una mascota registrada (Profile → mascotas, selector "Which pet is missing?" del flujo de reporte),
-- igual mecanismo que 0007 ya usa en reports: % del ancho/alto donde está la cabeza + zoom para miniaturas cuadradas (48×48).
-- Sin esto, la miniatura cuadrada de Profile usa el foco por defecto de FocusImage (50%, 30%) y puede cortar la cara si no
-- está centrada (ej. Lazy, cuya cara está en el tercio izquierdo de su foto). Fotos subidas desde la app quedan en null,
-- igual que en reports.
alter table pets
  add column if not exists photo_focus_x smallint,
  add column if not exists photo_focus_y smallint,
  add column if not exists photo_zoom smallint;
