import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const VENDOR_PAYMENT_BUCKET = "vendor-payment-proofs";

const sanitizeFileName = (name = "file") =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "file";

export async function uploadVendorPaymentProof({ paymentId, file }) {
  if (!isSupabaseConfigured || !supabase || !file) {
    return { path: "", publicUrl: "", fileName: file?.name || "" };
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${paymentId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(VENDOR_PAYMENT_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Gagal upload bukti transfer ke Storage: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(VENDOR_PAYMENT_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl: data?.publicUrl || "",
    fileName: file.name || safeName,
  };
}

export async function deleteVendorPaymentProof(path) {
  if (!isSupabaseConfigured || !supabase || !path) return;
  const { error } = await supabase.storage.from(VENDOR_PAYMENT_BUCKET).remove([path]);
  if (error) {
    throw new Error(`Gagal menghapus file bukti transfer dari Storage: ${error.message}`);
  }
}
