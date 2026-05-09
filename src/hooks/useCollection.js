import { useState, useEffect } from 'react'
import { onSnapshot } from 'firebase/firestore'

export function useCollection(queryFn) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let q
    try { q = queryFn() } catch(e) {
      setError('Firebase no configurado. Revisa tu archivo .env')
      setLoading(false); return
    }
    const unsub = onSnapshot(q,
      snap => { setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); setError(null) },
      err  => { console.error(err); setError(err.message); setLoading(false) }
    )
    return unsub
  }, [])

  return { data, loading, error }
}
