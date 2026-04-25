import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const signInAdmin = async ({ email, password }) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
};

export const signOutAdmin = async () => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
};

export const getCurrentProfile = async () => {
  if (!isSupabaseConfigured || !supabase) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  if (!["admin", "bendahara"].includes(data.role)) {
    throw new Error("Akun ini tidak memiliki akses.");
  }

  return data;
};