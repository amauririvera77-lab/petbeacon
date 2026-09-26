-- 0014 · Valores nuevos de report_status — PENDIENTE DE APROBACIÓN. Aplícala SOLA y ANTES de la 0015.
--
-- 'closed'   : un reporte Lost que se cerró sin reencuentro (duplicado retirado, mascota fallecida…). No genera alertas ni coincidencias.
-- 'resolved' : un avistamiento que el usuario marcó como resuelto (Fase 4 de Profile/My Reports).
-- Ninguno aparece en el feed ni en el mapa: active_reports solo incluye lost / sighted / reunited.
--
-- POR QUÉ VA APARTE: Postgres no permite USAR un valor de enum recién añadido dentro de la misma transacción que lo crea. La 0015 ya
-- usa 'closed', así que este archivo debe ejecutarse (Run) por separado y terminar antes de correr la 0015.

alter type report_status add value if not exists 'closed';
alter type report_status add value if not exists 'resolved';
