import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Stub returns an object with chainable methods that always resolve to empty data.
// This prevents crashes when Supabase env vars aren't set yet (e.g. during local
// development before user runs SQL schema). Real errors will surface at runtime.
function createStubClient(): SupabaseClient {
  const stubResponse = { data: null, error: { message: "Supabase not configured" } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {}
  const methods = ["select", "insert", "update", "delete", "eq", "neq", "ilike", "or", "lte", "gte", "limit", "order"]
  methods.forEach((m) => { chain[m] = () => chain })
  chain.single = () => Promise.resolve(stubResponse)
  chain.then = (resolve: (v: typeof stubResponse) => void) => resolve(stubResponse)
  return {
    from: () => chain,
    auth: { signIn: () => Promise.resolve(stubResponse), signOut: () => Promise.resolve(stubResponse) },
  } as unknown as SupabaseClient
}

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createStubClient()

export const supabaseAdmin: SupabaseClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createStubClient()

export const isSupabaseConfigured = isConfigured
