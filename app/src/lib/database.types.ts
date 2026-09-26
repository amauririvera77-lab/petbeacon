// Tipos a mano desde supabase/migrations/0001_init.sql (CLAUDE.md §4).
// TODO Fase 3+: reemplazar por `supabase gen types typescript` cuando el CLI esté disponible.
//
// Nota: usar `type` (no `interface`) para las filas — supabase-js exige que cada tabla sea
// estructuralmente asignable a Record<string, unknown>, y las interfaces no lo son sin una
// firma de índice explícita (los alias de tipo sí). Con `interface`, TS descarta el genérico
// `Database` y `rpc()` pierde el tipado de sus argumentos.

export type ReportStatus = "lost" | "sighted" | "reunited";
export type Species = "dog" | "cat" | "other";
export type ResourceCategory = "food" | "foster" | "legal";
export type ReportCondition = "calm" | "scared" | "injured" | "unsure";
export type MatchConfidence = "possible" | "strong";

export type Profile = {
  id: string;
  name: string;
  city: string;
  alert_radius_mi: number;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  push_token: string | null;
  home: string | null; // geography (EWKT al escribir)
  created_at: string;
};

export type Pet = {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  breed: string | null;
  photo_url: string | null;
  created_at: string;
};

export type Report = {
  id: string;
  user_id: string;
  status: ReportStatus;
  species: Species;
  name: string | null;
  breed: string | null;
  photo_url: string | null;
  photo_focus_x: number | null; // % (0-100): dónde está la cabeza, para no cortarla al recortar
  photo_focus_y: number | null;
  photo_zoom: number | null; // % (100 = sin zoom) para miniaturas
  features_description: string | null;
  condition: ReportCondition | null; // condición del animal en un avistamiento (0012); ya no va dentro de features_description
  location: string; // geography: EWKT al insertar ('SRID=4326;POINT(lng lat)'), hex EWKB al leer
  location_label: string | null;
  contact_phone_or_email: string | null;
  pet_id: string | null;
  matched_report_id: string | null;
  created_at: string;
  reunited_at: string | null;
};

export type ResourceRow = {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  is_featured_event: boolean;
  icon: string | null;
  hours: string | null;
  photo_url: string | null;
  created_at: string;
};

export type MatchRow = {
  id: string;
  lost_report_id: string;
  sighted_report_id: string;
  confidence: MatchConfidence;
  dismissed: boolean;
  created_at: string;
};

// Forma de retorno de la función SQL reports_nearby() (0001_init.sql).
export type ReportNearby = {
  id: string;
  status: ReportStatus;
  species: Species;
  name: string | null;
  breed: string | null;
  photo_url: string | null;
  photo_focus_x: number | null;
  photo_focus_y: number | null;
  photo_zoom: number | null;
  features_description: string | null;
  condition?: ReportCondition | null; // ausente hasta aplicar 0012
  location_label: string | null;
  created_at: string;
  lat: number;
  lng: number;
  distance_mi: number;
};

// Forma de retorno de resources_nearby() (0002, ampliada en 0006_resource_details.sql).
export type ResourceNearby = {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  is_featured_event: boolean;
  icon: string | null;
  hours: string | null;
  event_date?: string | null; // fecha real del evento (migración 0011); ausente antes de aplicarla
  photo_url: string | null;
  lat: number;
  lng: number;
  distance_mi: number;
};

// Motivos guardados por el trigger de matching (0009): por qué se generó la coincidencia.
export type MatchReasons = {
  same_species?: boolean;
  breed?: "exact" | "similar" | "different" | "unknown" | "incompatible";
  has_photo?: boolean;
  passes_rules?: boolean;
  distance_mi?: number;
  radius_mi?: number;
  seen_after_loss?: boolean;
  minutes_after_loss?: number;
};

// Forma de retorno de my_matches() (0004; ampliada en 0009 — los campos nuevos pueden faltar hasta aplicar esa migración).
export type MyMatch = {
  id: string;
  lost_report_id: string;
  lost_name: string | null;
  sighted_report_id: string;
  confidence: MatchConfidence;
  dismissed: boolean;
  created_at: string;
  sighted_photo_url: string | null;
  sighted_label: string | null;
  sighted_breed: string | null;
  sighted_focus_x: number | null;
  sighted_focus_y: number | null;
  sighted_zoom: number | null;
  sighted_created_at?: string;
  sighted_species?: Species;
  distance_mi?: number | null;
  reasons?: MatchReasons | null;
};

// supabase-js exige `Relationships` en cada tabla y `Views` en el schema (aunque estén vacíos)
// para que el tipo cumpla su GenericSchema; si no, el cliente cae a `any` y rpc() pierde el tipado de Args.
type Rel = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; name: string; city: string }; Update: Partial<Profile> } & Rel;
      pets: { Row: Pet; Insert: Partial<Pet> & { user_id: string; name: string; species: Species }; Update: Partial<Pet> } & Rel;
      reports: { Row: Report; Insert: Partial<Report> & { user_id: string; status: ReportStatus; species: Species; location: string }; Update: Partial<Report> } & Rel;
      resources: { Row: ResourceRow; Insert: Partial<ResourceRow> & { name: string; category: ResourceCategory; description: string }; Update: Partial<ResourceRow> } & Rel;
      matches: { Row: MatchRow; Insert: Partial<MatchRow> & { lost_report_id: string; sighted_report_id: string; confidence: MatchConfidence }; Update: Partial<MatchRow> } & Rel;
    };
    Views: Record<string, never>;
    Functions: {
      reports_nearby: { Args: { lat: number; lng: number; radius_mi: number }; Returns: ReportNearby[] };
      my_report_contact: { Args: { report_id: string }; Returns: string | null };
      my_matches: { Args: Record<PropertyKey, never>; Returns: MyMatch[] };
      resources_nearby: { Args: { lat: number; lng: number; radius_mi: number }; Returns: ResourceNearby[] };
    };
  };
};
