import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://qscspcpnejbdebaskxgp.supabase.co'
const ANON_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY3NwY3BuZWpiZGViYXNreGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzY2NzYsImV4cCI6MjA5NTU1MjY3Nn0.JRYeK0EH5f3tqJQcFqpn5xi44kHlbSCDJIuFKDKBZyc'

export const supabase = createClient(PROJECT_URL, ANON_KEY)

const BUCKET = 'profile-photos'
const MAX_MB  = 5

export async function uploadExerciseImage(
  file: File,
  exerciseId: string
): Promise<string> {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_MB} MB`)
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }

  const path = `exercises/${exerciseId}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadNutritionImage(
  file: File,
  storagePath: string   // e.g. "nutrition/banner/BUILD_MUSCLE"
): Promise<string> {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_MB} MB`)
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
