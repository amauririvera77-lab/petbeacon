-- Datos seed del prototipo. Coordenadas ILUSTRATIVAS (se reemplazan con geocoding real).
-- Unsplash IDs del prototipo; en producción las fotos van a Supabase Storage.
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-000000000001','authenticated','authenticated','demo-owner@petbeacon.test'),
  ('00000000-0000-0000-0000-000000000002','authenticated','authenticated','demo-reporter@petbeacon.test')
on conflict do nothing;

insert into profiles (id, name, city, alert_radius_mi, home) values
  ('00000000-0000-0000-0000-000000000001','Demo Owner','White Plains, NY',5,st_makepoint(-73.7629,41.034)::geography),
  ('00000000-0000-0000-0000-000000000002','Demo Reporter','White Plains, NY',5,st_makepoint(-73.7629,41.034)::geography);

insert into resources (name, category, description, address, location, phone, website_url, is_featured_event, icon) values
  ('Free pet food pantry','food','This Saturday, 9am-1pm. Dry and wet food, litter and flea treatment, no paperwork needed.','Maple Park Community Hall, White Plains, NY',st_makepoint(-73.76890, 41.03800)::geography,'(914) 555-0110','westchesterpetpantry.org/pantry',true,null),
  ('Westchester Pet Pantry','food','Free pet food distribution, first Saturday of every month.','142 Mamaroneck Ave, White Plains, NY',st_makepoint(-73.75490, 41.04000)::geography,'(914) 555-0142','westchesterpetpantry.org',false,null),
  ('Low-Cost Spay/Neuter Clinic','food','Sliding-scale fees based on household income, walk-ins welcome.','88 Grand St, White Plains, NY',st_makepoint(-73.75290, 41.02400)::geography,'(914) 555-0188','lowcostspayneuter.org',false,'heart-pulse'),
  ('Emergency Vet Aid Fund','food','Short-term grants covering urgent veterinary care costs.','210 Central Ave, White Plains, NY',st_makepoint(-73.78290, 41.05400)::geography,'(914) 555-0121','vetaidfund.org',false,'heart-pulse'),
  ('Bridge Foster Network','foster','Temporary foster homes for pets during hospitalizations or moves.','56 Bank St, White Plains, NY',st_makepoint(-73.77690, 41.02200)::geography,'(914) 555-0156','bridgefosternetwork.org',false,null),
  ('Crisis Boarding Program','foster','Up to 30 days of free boarding while you get back on your feet.','19 Post Rd, White Plains, NY',st_makepoint(-73.73790, 41.06200)::geography,'(914) 555-0119','crisisboarding.org',false,null),
  ('Animal Welfare Legal Aid','legal','Free consultations on housing and pet-related legal questions.','301 Main St, White Plains, NY',st_makepoint(-73.76090, 41.04400)::geography,'(914) 555-0301','animalwelfarelegalaid.org',false,null),
  ('Riverside Animal Sanctuary','legal','Verified no-kill shelter with surrender counseling before intake.','77 Riverside Dr, White Plains, NY',st_makepoint(-73.73290, 41.00400)::geography,'(914) 555-0177','riversideanimalsanctuary.org',false,'paw');

insert into reports (id, user_id, status, species, name, breed, photo_url, features_description, location, location_label, contact_phone_or_email, created_at, reunited_at) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','lost','dog','Max','Golden Retriever','https://images.unsplash.com/photo-1552053831-71594a27632d','Blue collar with a silver tag, limps slightly on his left leg.',st_makepoint(-73.77290, 41.04000)::geography,'near Maple Park','(914) 555-0100',now() - interval '3 hours',null),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','sighted','dog',null,'Beagle mix','https://images.unsplash.com/photo-1703721025121-26d64508482b','No collar visible. Friendly, approached the reporter calmly.',st_makepoint(-73.75490, 41.03500)::geography,'5th Ave & Elm St',null,now() - interval '1 hours',null),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','sighted','cat',null,'Gray tabby','https://images.unsplash.com/photo-1557735802-ef14538b00a4','Skittish — seen hiding under a porch, did not approach.',st_makepoint(-73.77090, 41.02600)::geography,'Oak Street',null,now() - interval '6 hours',null),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','reunited','dog','Biscuit','Labrador mix','https://images.unsplash.com/photo-1585588640338-2c3dc723e638','Reunited with owner within 3 hours of the alert going live.',st_makepoint(-73.75890, 41.04400)::geography,'near Maple Park','(914) 555-0100',now() - interval '18 hours',now() - interval '3 hours'),
  ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','lost','cat','Luna','Siamese cat','https://images.unsplash.com/photo-1695708794933-57424f0bf14e','Very shy — may not approach strangers, please don''t chase.',st_makepoint(-73.75090, 41.02000)::geography,'Birchwood Ln','luna.owner@example.com',now() - interval '30 hours',null),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000002','sighted','dog',null,'Golden Retriever',null,'Golden coat, blue collar. Stayed near the park entrance and let people approach.',st_makepoint(-73.77050, 41.03850)::geography,'Maple Park entrance',null,now() - interval '30 minutes',null);

-- El trigger de matching (0009) se dispara al insertar. Ejemplos coherentes:
--   Sighted #6 (Golden Retriever, 30 min, 0.2 mi) vs Lost #1 (Max, Golden Retriever) => 'strong'.
-- Ejemplos que NO deben generar match: Sighted #2 (Beagle) vs Max (Golden) → tamaños incompatibles;
--   Sighted #3 (Gray tabby) vs Luna (Siamese) → razas de gato distintas.