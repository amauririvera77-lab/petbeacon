-- 0021 · Categoría "Rehoming & shelters" — PENDIENTE DE APROBACIÓN. Aplícala SOLA y ANTES de la 0022.
--
-- Support and care 5.5 ("Support Before Surrender"): los recursos de entrega o ingreso a refugio necesitan su propia categoría y van al final
-- de la lista. Postgres no permite USAR un valor de enum recién añadido dentro de la misma transacción que lo crea, así que este archivo va
-- aparte: la 0022 ya lo usa (mueve Riverside Animal Sanctuary a esta categoría).

alter type resource_category add value if not exists 'shelter';
