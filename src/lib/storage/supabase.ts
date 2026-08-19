import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

/**
 * Deletes a document from the Supabase Storage bucket.
 * Replaces the AWS S3 implementation for the 100% Free Stack.
 */
export async function deleteDocumentFromSupabase(objectKey: string, bucketName: string = 'cv-uploads'): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase Storage Mock] Would delete object:', objectKey);
    return true;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([objectKey]);

    if (error) {
      throw error;
    }

    console.log(`[Supabase Storage] Successfully deleted ${objectKey} from ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`[Supabase Storage Error] Failed to delete ${objectKey}:`, error);
    throw error;
  }
}
