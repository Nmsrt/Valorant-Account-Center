import { supabase } from './supabase'

const TABLE = 'accounts'

// Map a DB row (snake_case) to the shape the app expects (createdAt sort key).
function fromRow(row) {
  return {
    id: row.id,
    ign: row.ign,
    tagline: row.tagline,
    username: row.username,
    password: row.password,
    rank: row.rank,
    verified: row.verified,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAccounts() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase select error:', error)
    throw new Error(`Failed to load accounts: ${error.message}`)
  }
  return data.map(fromRow)
}

export async function createAccount(data) {
  const { ign, tagline, username, password, rank, verified, notes } = data

  if (!ign || !tagline || !username || !password) {
    throw new Error('IGN, tagline, username, and password are required.')
  }

  let all = []
  try {
    all = await getAccounts()
  } catch (err) {
    console.warn('Could not check duplicates:', err.message)
  }

  if (all.some(a => a.username === username.trim())) {
    throw new Error('An account with this username already exists.')
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      ign: ign.trim(),
      tagline: tagline.trim(),
      username: username.trim(),
      password,
      rank: rank || null,
      verified: verified || false,
      notes: notes?.trim() || '',
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    throw new Error(`Failed to save: ${error.message}`)
  }
  return fromRow(row)
}

export async function updateAccount(id, data) {
  const { ign, tagline, username, password, rank, verified, notes } = data

  if (!ign || !tagline || !username || !password) {
    throw new Error('All fields are required.')
  }

  let all = []
  try {
    all = await getAccounts()
  } catch (err) {
    console.warn('Could not check duplicates:', err.message)
  }

  if (all.some(a => a.username === username.trim() && a.id !== id)) {
    throw new Error('An account with this username already exists.')
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .update({
      ign: ign.trim(),
      tagline: tagline.trim(),
      username: username.trim(),
      password,
      rank: rank || null,
      verified: verified || false,
      notes: notes?.trim() || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    throw new Error(`Failed to update: ${error.message}`)
  }
  return fromRow(row)
}

export async function deleteAccount(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(`Failed to delete: ${error.message}`)
  }
}
