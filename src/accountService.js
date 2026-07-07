import { supabase } from './supabase'

const TABLE = 'accounts'
const DUPLICATE_MSG = 'An account with this username already exists.'
const UNIQUE_VIOLATION = '23505' // Postgres unique-constraint error code

// Map a DB row (snake_case) to the shape the app expects (createdAt sort key).
function fromRow({ created_at, updated_at, ...rest }) {
  return { ...rest, createdAt: created_at, updatedAt: updated_at }
}

function throwIfError(error, action) {
  if (!error) return
  console.error(`Supabase error (${action}):`, error)
  if (error.code === UNIQUE_VIOLATION) throw new Error(DUPLICATE_MSG)
  throw new Error(`Failed to ${action}: ${error.message}`)
}

function assertRequired({ ign, tagline, username, password }) {
  if (!ign || !tagline || !username || !password) {
    throw new Error('IGN, tagline, username, and password are required.')
  }
}

function buildPayload({ ign, tagline, username, password, rank, verified, notes }) {
  return {
    ign: ign.trim(),
    tagline: tagline.trim(),
    username: username.trim(),
    password,
    rank: rank || null,
    verified: verified || false,
    notes: notes?.trim() || '',
  }
}

// Pre-check for a friendly error message; the DB unique constraint on
// username is the real guard (races and check failures end in 23505).
async function usernameTaken(username, excludeId) {
  let q = supabase.from(TABLE).select('id').eq('username', username).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) {
    console.warn('Could not check duplicates:', error.message)
    return false
  }
  return data.length > 0
}

export async function getAccounts() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  throwIfError(error, 'load accounts')
  return (data ?? []).map(fromRow)
}

export async function createAccount(data) {
  assertRequired(data)
  const payload = buildPayload(data)

  if (await usernameTaken(payload.username)) {
    throw new Error(DUPLICATE_MSG)
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  throwIfError(error, 'save')
  return fromRow(row)
}

export async function updateAccount(id, data) {
  assertRequired(data)
  const payload = buildPayload(data)

  if (await usernameTaken(payload.username, id)) {
    throw new Error(DUPLICATE_MSG)
  }

  const { data: rows, error } = await supabase
    .from(TABLE)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  throwIfError(error, 'update')
  if (!rows?.length) {
    throw new Error('Account not found — it may have been deleted.')
  }
  return fromRow(rows[0])
}

export async function deleteAccount(id) {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .select('id')

  throwIfError(error, 'delete')
  if (!rows?.length) {
    throw new Error('Account not found — it may have already been deleted.')
  }
}
