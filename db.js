// src/lib/db.js
// All Firestore CRUD operations

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where,
  orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

const MEMBERS_COL = 'members'

// ── Real-time listener for all members in a community ──
export function listenToMembers(communityId, callback) {
  const q = query(
    collection(db, MEMBERS_COL),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(members)
  })
}

// ── Add a new member ──
export async function addMember(data) {
  return addDoc(collection(db, MEMBERS_COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// ── Update a member ──
export async function updateMember(id, data) {
  return updateDoc(doc(db, MEMBERS_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete a member and clean up relations ──
export async function deleteMember(id, allMembers) {
  const batch = writeBatch(db)

  // Remove this id from all relation arrays of other members
  allMembers.forEach(m => {
    if (m.id === id) return
    const updates = {}
    if ((m.parentIds || []).includes(id)) updates.parentIds = m.parentIds.filter(x => x !== id)
    if ((m.spouseIds || []).includes(id)) updates.spouseIds = m.spouseIds.filter(x => x !== id)
    if ((m.childrenIds || []).includes(id)) updates.childrenIds = m.childrenIds.filter(x => x !== id)
    if (Object.keys(updates).length > 0) {
      batch.update(doc(db, MEMBERS_COL, m.id), { ...updates, updatedAt: serverTimestamp() })
    }
  })

  batch.delete(doc(db, MEMBERS_COL, id))
  return batch.commit()
}

// ── Upload photo to Firebase Storage ──
export async function uploadPhoto(file, memberId, communityId) {
  const ext = file.name.split('.').pop()
  const path = `photos/${communityId}/${memberId}-${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

// ── Delete photo from Storage ──
export async function deletePhoto(url) {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (e) {
    // ignore if already deleted
  }
}

// ── Community management ──
const COMMUNITIES_COL = 'communities'

export async function createCommunity(data) {
  return addDoc(collection(db, COMMUNITIES_COL), {
    ...data,
    createdAt: serverTimestamp(),
    memberCount: 0,
  })
}

export async function getCommunity(id) {
  const snap = await getDoc(doc(db, COMMUNITIES_COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserCommunities(userId) {
  const q = query(
    collection(db, COMMUNITIES_COL),
    where('adminIds', 'array-contains', userId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getPublicCommunities() {
  const q = query(
    collection(db, COMMUNITIES_COL),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function joinCommunity(communityId, userId) {
  const ref = doc(db, COMMUNITIES_COL, communityId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Community not found')
  const data = snap.data()
  const memberIds = data.memberIds || []
  if (!memberIds.includes(userId)) {
    await updateDoc(ref, {
      memberIds: [...memberIds, userId],
      memberCount: (data.memberCount || 0) + 1,
    })
  }
}

// ── Activity log ──
export async function logActivity(communityId, userId, action, details) {
  return addDoc(collection(db, 'activityLog'), {
    communityId, userId, action, details,
    timestamp: serverTimestamp(),
  })
}
