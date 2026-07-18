import { useState, useEffect, useCallback } from 'react'
import { db, isFirebaseConfigured } from '@/utils/firebase'
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore'

/**
 * useSyncQueue - A hook to batch Firestore writes and sync every 5 minutes (or manually).
 * Prevents overwhelming the database during high-traffic ticket scanning.
 */
export function useSyncQueue(collectionName) {
  const [queue, setQueue] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)

  // Enqueue an item locally
  const enqueue = useCallback((data) => {
    setQueue(prev => [...prev, { ...data, localTimestamp: Date.now() }])
  }, [])

  // Sync all queued items to Firestore
  const syncNow = useCallback(async () => {
    if (queue.length === 0 || !isFirebaseConfigured || !db) return
    
    setIsSyncing(true)
    try {
      const batch = writeBatch(db)
      
      queue.forEach(item => {
        const docRef = doc(collection(db, collectionName))
        // Replace local timestamp with server timestamp for accurate DB time
        batch.set(docRef, { ...item, timestamp: serverTimestamp() })
      })

      await batch.commit()
      
      console.log(`[SyncQueue] Successfully synced ${queue.length} items to ${collectionName}`)
      setQueue([])
      setLastSynced(new Date())
    } catch (error) {
      console.error(`[SyncQueue] Failed to sync to ${collectionName}:`, error)
    } finally {
      setIsSyncing(false)
    }
  }, [queue, collectionName])

  // Auto-sync every 5 minutes (300,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (queue.length > 0) {
        syncNow()
      }
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [queue, syncNow])

  return { queue, enqueue, syncNow, isSyncing, lastSynced, queueLength: queue.length }
}
