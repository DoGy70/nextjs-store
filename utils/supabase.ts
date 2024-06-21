import { createClient } from "@supabase/supabase-js";

const bucketName = "main-bucket";

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

export async function uploadImage(image: File) {
  const timestamp = Date.now();
  const newName = `${timestamp}-${image.name}`;
  const { data } = await supabase.storage
    .from(bucketName)
    .upload(newName, image, { cacheControl: "3600" });

  if (!data) throw new Error("Image upload failed");

  return supabase.storage.from(bucketName).getPublicUrl(newName).data.publicUrl;
}

export function deleteImage(url: string) {
  const imageName = url.split("/").pop();

  if (!imageName) throw new Error("Invalid URL");
  return supabase.storage.from(bucketName).remove([imageName]);
}
