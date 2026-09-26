import { supabase } from "./supabase";

// Guardar la cuenta anónima con un correo (Profile → "Save your account") y volver a entrar con él. Todo con código de 6 dígitos por correo,
// sin contraseña. REQUISITO de Supabase (Dashboard → Authentication → Emails): las plantillas "Confirm email change" y "Magic Link" deben
// mostrar el código con {{ .Token }}, y para usuarios reales hace falta un SMTP propio (el correo integrado tiene límites muy bajos).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v: string) => EMAIL.test(v.trim());

const need = () => { if (!supabase) throw new Error("Supabase isn't configured."); return supabase; };

function friendly(message: string): string {
  if (/already (been )?registered|already exists|email_exists/i.test(message)) return "That email already has a PetBeacon account. Log in with it instead.";
  if (/rate limit|too many|security purposes/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  if (/expired|invalid|token/i.test(message)) return "That code didn't work. Check it and try again, or request a new one.";
  return message;
}

// Cuenta anónima → permanente: pide el correo y Supabase envía el código.
export async function startSaveAccount(email: string): Promise<void> {
  const { error } = await need().auth.updateUser({ email: email.trim().toLowerCase() });
  if (error) throw new Error(friendly(error.message));
}
export async function confirmSaveAccount(email: string, code: string): Promise<void> {
  const { error } = await need().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email_change" });
  if (error) throw new Error(friendly(error.message));
}

// Volver a entrar en una cuenta ya guardada (desde otro dispositivo o tras cerrar sesión).
export async function startLogin(email: string): Promise<void> {
  const { error } = await need().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
  if (error) throw new Error(/signups? not allowed|not found/i.test(error.message) ? "We couldn't find an account with that email." : friendly(error.message));
}
export async function confirmLogin(email: string, code: string): Promise<void> {
  const { error } = await need().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
  if (error) throw new Error(friendly(error.message));
}
