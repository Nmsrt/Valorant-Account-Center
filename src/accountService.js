import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'accounts'

export async function getAccounts() {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    // If index doesn't exist yet, fall back to unordered fetch
    console.warn('Ordered fetch failed, falling back:', err.message)
    const snapshot = await getDocs(collection(db, COL))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  }
}

export async function createAccount(data) {
  const { ign, tagline, username, password, rank } = data

  if (!ign || !tagline || !username || !password) {
    throw new Error('IGN, tagline, username, and password are required.')
  }

  // Check for duplicate username
  let all = []
  try {
    all = await getAccounts()
  } catch (err) {
    console.warn('Could not check duplicates:', err.message)
  }

  if (all.some(a => a.username === username.trim())) {
    throw new Error('An account with this username already exists.')
  }

  try {
    const docRef = await addDoc(collection(db, COL), {
      ign: ign.trim(),
      tagline: tagline.trim(),
      username: username.trim(),
      password,
      rank: rank || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, ign, tagline, username, password, rank }
  } catch (err) {
    console.error('Firestore addDoc error:', err)
    throw new Error(`Failed to save: ${err.message}`)
  }
}

export async function updateAccount(id, data) {
  const { ign, tagline, username, password, rank } = data

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

  try {
    await updateDoc(doc(db, COL, id), {
      ign: ign.trim(),
      tagline: tagline.trim(),
      username: username.trim(),
      password,
      rank: rank || null,
      updatedAt: serverTimestamp(),
    })
    return { id, ign, tagline, username, password, rank }
  } catch (err) {
    console.error('Firestore updateDoc error:', err)
    throw new Error(`Failed to update: ${err.message}`)
  }
}

export async function deleteAccount(id) {
  try {
    await deleteDoc(doc(db, COL, id))
  } catch (err) {
    console.error('Firestore deleteDoc error:', err)
    throw new Error(`Failed to delete: ${err.message}`)
  }
}
