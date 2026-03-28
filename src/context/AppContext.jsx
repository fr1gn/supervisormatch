/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'
import { supervisors as seededSupervisors } from '../data/supervisors'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  users: 'supervisormatch_users',
  session: 'supervisormatch_session',
  requests: 'supervisormatch_requests',
  supervisors: 'supervisormatch_supervisors',
}

const defaultUsers = [
  {
    id: 'usr-demo-student',
    fullName: 'Alex Carter',
    email: 'student@test.com',
    role: 'student',
    department: 'Computer Science',
    groupName: 'CS-2024-A',
    phone: '+10000000000',
    studyLevel: 'Final Year',
    interests: 'Artificial Intelligence, Learning Analytics',
    bio: 'Student interested in AI-supported education and recommendation systems.',
    password: 'demo123',
  },
  {
    id: 'usr-demo-supervisor',
    fullName: 'Dr. Sarah Johnson',
    email: 'johnson@university.edu',
    role: 'supervisor',
    department: 'Computer Science',
    groupName: '',
    phone: '',
    studyLevel: '',
    interests: '',
    bio: '',
    password: 'demo123',
  },
]

const defaultRequests = [
  {
    id: 'req-demo-1',
    studentEmail: 'student@test.com',
    studentName: 'Alex Carter',
    supervisorId: 'sup-1',
    message: 'I am interested in AI for education and would like to work with your group.',
    status: 'under review',
    createdAt: '2026-03-17T11:10:00.000Z',
  },
  {
    id: 'req-demo-2',
    studentEmail: 'student@test.com',
    studentName: 'Alex Carter',
    supervisorId: 'sup-3',
    message: 'My thesis idea is cloud-native tooling for student collaboration systems.',
    status: 'accepted',
    createdAt: '2026-03-10T09:45:00.000Z',
  },
  {
    id: 'req-demo-3',
    studentEmail: 'student@test.com',
    studentName: 'Alex Carter',
    supervisorId: 'sup-2',
    message: 'I would like to explore graph mining in educational recommendation systems.',
    status: 'rejected',
    createdAt: '2026-03-04T14:35:00.000Z',
  },
]

function parseStorage(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

function makeSupervisorFromUser(user) {
  return {
    id: `sup-${Date.now()}`,
    email: user.email,
    phone: '',
    name: user.fullName,
    title: 'Supervisor',
    department: user.department || 'General Department',
    areas: user.department ? [user.department] : ['General Research'],
    capacity: 8,
    currentStudents: 0,
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=160&q=80',
    bio: 'Update your profile with your specialization and supervision preferences.',
    topics: [],
  }
}

export function AppProvider({ children }) {
  const [users, setUsers] = useState(() => parseStorage(STORAGE_KEYS.users, defaultUsers))
  const [session, setSession] = useState(() => parseStorage(STORAGE_KEYS.session, null))
  const [requests, setRequests] = useState(() => parseStorage(STORAGE_KEYS.requests, defaultRequests))
  const [supervisors, setSupervisors] = useState(() => parseStorage(STORAGE_KEYS.supervisors, seededSupervisors))

  const persistSupervisors = (next) => {
    setSupervisors(next)
    writeStorage(STORAGE_KEYS.supervisors, next)
  }

  const registerUser = (payload) => {
    const normalizedEmail = normalizeEmail(payload.email)
    const exists = users.some((user) => user.email === normalizedEmail)

    if (exists) {
      return { ok: false, error: 'An account with this email already exists.' }
    }

    const nextUser = {
      id: `usr-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      role: payload.role,
      department: payload.department.trim(),
      groupName: payload.groupName.trim(),
      phone: '',
      studyLevel: '',
      interests: '',
      bio: '',
      password: payload.password,
    }

    const nextUsers = [...users, nextUser]
    setUsers(nextUsers)
    writeStorage(STORAGE_KEYS.users, nextUsers)

    if (nextUser.role === 'supervisor' && !supervisors.some((sup) => sup.email === normalizedEmail)) {
      const nextSupervisors = [makeSupervisorFromUser(nextUser), ...supervisors]
      persistSupervisors(nextSupervisors)
    }

    return { ok: true, role: nextUser.role }
  }

  const loginUser = ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !password.trim()) {
      return { ok: false, error: 'Please enter your email and password.' }
    }

    const user = users.find((item) => item.email === normalizedEmail)

    if (!user) {
      return { ok: false, error: 'Account not found. Please register first.' }
    }

    if (user.password !== password.trim()) {
      return { ok: false, error: 'Incorrect password. Please try again.' }
    }

    if (user.role === 'supervisor' && !supervisors.some((sup) => sup.email === user.email)) {
      const nextSupervisors = [makeSupervisorFromUser(user), ...supervisors]
      persistSupervisors(nextSupervisors)
    }

    const nextSession = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      groupName: user.groupName,
    }

    setSession(nextSession)
    writeStorage(STORAGE_KEYS.session, nextSession)

    return { ok: true, role: user.role }
  }

  const logoutUser = () => {
    setSession(null)
    localStorage.removeItem(STORAGE_KEYS.session)
  }

  const getCurrentSupervisor = useCallback(() => {
    if (!session?.email) {
      return null
    }

    return supervisors.find((item) => item.email === session.email) || null
  }, [session, supervisors])

  const getCurrentStudent = useCallback(() => {
    if (!session?.email) {
      return null
    }

    return users.find((item) => item.email === session.email) || null
  }, [session, users])

  const sendRequest = ({ supervisorId, message }) => {
    if (!session || session.role !== 'student') {
      return { ok: false, error: 'Only student accounts can send requests.' }
    }

    const duplicate = requests.some(
      (request) =>
        request.studentEmail === session.email &&
        request.supervisorId === supervisorId &&
        request.status !== 'rejected',
    )

    if (duplicate) {
      return { ok: false, error: 'You already have an active request for this supervisor.' }
    }

    const nextRequest = {
      id: `req-${Date.now()}`,
      studentEmail: session.email,
      studentName: session.fullName,
      supervisorId,
      message: message.trim() || 'I would like to discuss potential supervision opportunities.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const nextRequests = [nextRequest, ...requests]
    setRequests(nextRequests)
    writeStorage(STORAGE_KEYS.requests, nextRequests)

    return { ok: true }
  }

  const getSupervisorRequests = useCallback(() => {
    const supervisor = getCurrentSupervisor()

    if (!supervisor) {
      return []
    }

    return requests.filter((request) => request.supervisorId === supervisor.id)
  }, [getCurrentSupervisor, requests])

  const updateRequestStatus = (requestId, status) => {
    const allowed = ['pending', 'under review', 'accepted', 'rejected']

    if (!allowed.includes(status)) {
      return
    }

    const nextRequests = requests.map((request) => {
      if (request.id !== requestId) {
        return request
      }
      return { ...request, status }
    })

    setRequests(nextRequests)
    writeStorage(STORAGE_KEYS.requests, nextRequests)

    if (status === 'accepted') {
      const targetRequest = nextRequests.find((item) => item.id === requestId)
      if (!targetRequest) {
        return
      }

      const nextSupervisors = supervisors.map((item) => {
        if (item.id !== targetRequest.supervisorId) {
          return item
        }

        const current = item.currentStudents || 0
        const capacity = item.capacity || 8
        return {
          ...item,
          currentStudents: Math.min(capacity, current + 1),
        }
      })

      persistSupervisors(nextSupervisors)
    }
  }

  const cancelRequest = (requestId) => {
    const nextRequests = requests.filter((request) => request.id !== requestId)
    setRequests(nextRequests)
    writeStorage(STORAGE_KEYS.requests, nextRequests)
  }

  const updateSupervisorProfile = (payload) => {
    if (!session || session.role !== 'supervisor') {
      return { ok: false, error: 'Only supervisors can edit this profile.' }
    }

    const nextSupervisors = supervisors.map((item) => {
      if (item.email !== session.email) {
        return item
      }

      return {
        ...item,
        name: payload.name.trim(),
        title: payload.title.trim() || 'Supervisor',
        department: payload.department.trim(),
        phone: payload.phone.trim(),
        bio: payload.bio.trim(),
        areas: payload.areas
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      }
    })

    persistSupervisors(nextSupervisors)

    const nextUsers = users.map((item) => {
      if (item.email !== session.email) {
        return item
      }

      return {
        ...item,
        fullName: payload.name.trim(),
        department: payload.department.trim(),
      }
    })

    setUsers(nextUsers)
    writeStorage(STORAGE_KEYS.users, nextUsers)

    const nextSession = {
      ...session,
      fullName: payload.name.trim(),
      department: payload.department.trim(),
    }

    setSession(nextSession)
    writeStorage(STORAGE_KEYS.session, nextSession)

    return { ok: true }
  }

  const updateStudentProfile = (payload) => {
    if (!session || session.role !== 'student') {
      return { ok: false, error: 'Only students can edit this profile.' }
    }

    const nextUsers = users.map((item) => {
      if (item.email !== session.email) {
        return item
      }

      return {
        ...item,
        fullName: payload.fullName.trim(),
        department: payload.department.trim(),
        groupName: payload.groupName.trim(),
        phone: payload.phone.trim(),
        studyLevel: payload.studyLevel.trim(),
        interests: payload.interests.trim(),
        bio: payload.bio.trim(),
      }
    })

    setUsers(nextUsers)
    writeStorage(STORAGE_KEYS.users, nextUsers)

    const nextSession = {
      ...session,
      fullName: payload.fullName.trim(),
      department: payload.department.trim(),
      groupName: payload.groupName.trim(),
    }

    setSession(nextSession)
    writeStorage(STORAGE_KEYS.session, nextSession)

    return { ok: true }
  }

  const addSupervisorTopic = (payload) => {
    if (!session || session.role !== 'supervisor') {
      return { ok: false, error: 'Only supervisors can add topics.' }
    }

    const title = payload.title.trim()
    const area = payload.area.trim()
    const description = payload.description.trim()

    if (!title || !area || !description) {
      return { ok: false, error: 'Please fill title, area, and description.' }
    }

    const nextSupervisors = supervisors.map((item) => {
      if (item.email !== session.email) {
        return item
      }

      const topic = {
        id: `top-${Date.now()}`,
        title,
        area,
        description,
      }

      const nextAreas = item.areas.includes(area) ? item.areas : [...item.areas, area]

      return {
        ...item,
        areas: nextAreas,
        topics: [topic, ...(item.topics || [])],
      }
    })

    persistSupervisors(nextSupervisors)
    return { ok: true }
  }

  const removeSupervisorTopic = (topicId) => {
    if (!session || session.role !== 'supervisor') {
      return
    }

    const nextSupervisors = supervisors.map((item) => {
      if (item.email !== session.email) {
        return item
      }

      return {
        ...item,
        topics: (item.topics || []).filter((topic) => topic.id !== topicId),
      }
    })

    persistSupervisors(nextSupervisors)
  }

  const value = {
    session,
    users,
    supervisors,
    requests,
    registerUser,
    loginUser,
    logoutUser,
    sendRequest,
    getCurrentStudent,
    getCurrentSupervisor,
    getSupervisorRequests,
    updateRequestStatus,
    cancelRequest,
    updateStudentProfile,
    updateSupervisorProfile,
    addSupervisorTopic,
    removeSupervisorTopic,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used inside AppProvider.')
  }

  return context
}
