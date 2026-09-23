-- Ajuste de los puntos focales del seed, medidos sobre las fotos reales (el `head` del prototipo estaba pensado
-- para su propio método de recorte y dejaba a Max corrido hacia abajo). Foco = centro de la cabeza, en % (x, y).
update reports set photo_focus_x = 52, photo_focus_y = 37, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000001'; -- Max
update reports set photo_focus_x = 28, photo_focus_y = 46, photo_zoom = 150 where id = '10000000-0000-0000-0000-000000000002'; -- Unknown dog (beagle): menos zoom para no apretar la cabeza
update reports set photo_focus_x = 43, photo_focus_y = 35, photo_zoom = 240 where id = '10000000-0000-0000-0000-000000000003'; -- Unknown cat
update reports set photo_focus_x = 56, photo_focus_y = 25, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000004'; -- Biscuit
update reports set photo_focus_x = 50, photo_focus_y = 30, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000005'; -- Luna (sin cambios)
