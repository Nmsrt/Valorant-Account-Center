import { useState } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import './FirestoreTest.css'

export default function FirestoreTest() {
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)

  const log = (msg, ok = true) => {
    setResults(prev => [...prev, { msg, ok, time: new Date().toLocaleTimeString() }])
  }

  const runTest = async () => {
    setResults([])
    setRunning(true)

    // Step 1: Check Firebase config
    log('Checking Firebase config...')
    const cfg = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    }
    if (!cfg.apiKey || cfg.apiKey === 'your_api_key_here') {
      log('❌ VITE_FIREBASE_API_KEY is missing or not set in .env', false)
      setRunning(false)
      return
    }
    if (!cfg.projectId) {
      log('❌ VITE_FIREBASE_PROJECT_ID is missing', false)
      setRunning(false)
      return
    }
    log(`✅ Config loaded — project: ${cfg.projectId}`)

    // Step 2: Try reading from Firestore
    log('Trying to READ from Firestore...')
    try {
      const snap = await getDocs(collection(db, 'accounts'))
      log(`✅ READ success — ${snap.size} documents in accounts collection`)
    } catch (err) {
      log(`❌ READ failed: ${err.code} — ${err.message}`, false)
      if (err.code === 'permission-denied') {
        log('→ Fix: Go to Firestore Console → Rules → set allow read, write: if true;', false)
      }
      if (err.code === 'unavailable' || err.message.includes('offline')) {
        log('→ Fix: Firestore may not be created yet. Go to Firebase Console → Firestore Database → Create database', false)
      }
      setRunning(false)
      return
    }

    // Step 3: Try writing to Firestore
    log('Trying to WRITE to Firestore...')
    let testDocId = null
    try {
      const ref = await addDoc(collection(db, '_test'), {
        test: true,
        createdAt: serverTimestamp(),
      })
      testDocId = ref.id
      log(`✅ WRITE success — doc id: ${ref.id}`)
    } catch (err) {
      log(`❌ WRITE failed: ${err.code} — ${err.message}`, false)
      if (err.code === 'permission-denied') {
        log('→ Fix: Firestore Rules are blocking writes. Deploy firestore.rules or set allow write: if true', false)
      }
      setRunning(false)
      return
    }

    // Step 4: Clean up test doc
    if (testDocId) {
      try {
        await deleteDoc(doc(db, '_test', testDocId))
        log('✅ CLEANUP success — test doc removed')
      } catch {
        log('⚠ Cleanup failed (harmless)')
      }
    }

    log('🎉 All tests passed! Firestore is working correctly.')
    setRunning(false)
  }

  return (
    <div className="ftest">
      <div className="ftest__header">
        <h3 className="ftest__title">🔧 Firestore Connection Test</h3>
        <button className="ftest__btn" onClick={runTest} disabled={running}>
          {running ? 'Running...' : 'Run Test'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="ftest__log">
          {results.map((r, i) => (
            <div key={i} className={`ftest__line ${r.ok ? 'ftest__line--ok' : 'ftest__line--err'}`}>
              <span className="ftest__time">{r.time}</span>
              <span>{r.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
