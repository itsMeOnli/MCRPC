import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { unzipAndExtract, mergeDirectories, createZipArchive } from "@/lib/zip-utils.js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""; 
const supabase = createClient(supabaseUrl, supabaseKey);

const UPLOAD_DIR = path.join(process.cwd(), "tmp_uploads");

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    multiples: true,
  });

  const requestId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
  const processingDir = path.join(UPLOAD_DIR, requestId);
  const mergedOutputDir = path.join(processingDir, "merged_output");
  let finalZipPath: string | null = null;

  try {
    const [fields, files] = await form.parse(req);

    const resourcePacks = files.resourcePacks;

    if (!resourcePacks || resourcePacks.length === 0) {
      return res.status(400).json({ message: "No resource packs uploaded." });
    }

    await fs.mkdir(processingDir, { recursive: true });
    await fs.mkdir(mergedOutputDir, { recursive: true });

    // Ensure resourcePacks is always an array for consistent iteration
    const uploadedFilesArray = Array.isArray(resourcePacks)
      ? resourcePacks
      : [resourcePacks];

    // Process each pack
    for (const file of uploadedFilesArray) {
      const currentFilePath = file.filepath;
      const unzipDestination = path.join(processingDir, `${file.newFilename}_unzipped`);
      
      console.log(`Processing file: ${file.originalFilename} from ${currentFilePath}`);

      await unzipAndExtract(currentFilePath, unzipDestination);
      await mergeDirectories(unzipDestination, mergedOutputDir);

      // Cleanup
      await fs.rm(unzipDestination, { recursive: true, force: true });
      await fs.rm(currentFilePath, { force: true });
    }

    // Create the final combined ZIP
    const finalZipFileName = `combined_resource_pack_${requestId}.zip`;
    finalZipPath = path.join(processingDir, finalZipFileName);
    await createZipArchive(mergedOutputDir, finalZipPath);

    // Upload the final ZIP to Supabase Storage
    const supabaseBucket = "resource-packs";
    const supabaseFilePath = `combined/${finalZipFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(supabaseFilePath, await fs.readFile(finalZipPath), {
        cacheControl: "3600", //Cache for 1 hour
        upsert: false,
        contentType: "application/zip",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(supabaseFilePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL from Supabase.");
    }

    console.log(`Successfully combined and uploaded. URL: ${publicUrlData.publicUrl}`);
    res.status(200).json({ downloadUrl: publicUrlData.publicUrl });
  } catch (error: unknown) {
    console.error("Server-side processing error:", error);
    res.status(500).json({ message: "Failed to combine resource packs", error: (error as Error).message });
  } finally {
    //cleanup
    if (processingDir && await fs.stat(processingDir).catch(() => null)) {
      await fs.rm(processingDir, { recursive: true, force: true }).catch(err => {
        console.error(`Failed to clean up processingDir ${processingDir}:`, err);
      });
    }
  }
}