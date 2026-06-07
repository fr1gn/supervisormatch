import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [supervisors, setSupervisors] = useState([])
  const [requests, setRequests] = useState([])

  // при загрузке проверяем, есть ли сохранённый токен — если да, восстанавливаем сессию
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/users/me').then(res => {
        if (res.ok) {
          setSession(res.data)
        } else {
          localStorage.removeItem('access_token')
        }
        setIsInitializing(false)
      })
    } else {
      setIsInitializing(false)
    }
  }, [])

  // если токен протух и рефреш не помог — чистим всё и кидаем на логин
  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('access_token')
      setSession(null)
      setSupervisors([])
      setRequests([])
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  const registerUser = async (payload) => {
    const res = await api.post('/auth/register', payload)
    return res
  }

  const loginUser = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    if (res.ok) {
      localStorage.setItem('access_token', res.data.accessToken)
      setSession(res.data.user)
    }
    return res
  }

  const logoutUser = async () => {
    await api.post('/auth/logout')
    localStorage.removeItem('access_token')
    setSession(null)
    setSupervisors([])
    setRequests([])
  }

  const fetchSupervisors = useCallback(async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await api.get(`/supervisors${query ? '?' + query : ''}`);
    if (res.ok) {
      setSupervisors(res.data);
    }
    return res.data || [];
  }, []);

  const getCurrentSupervisor = useCallback(() => {
    if (!session || session.role !== 'supervisor') return null;
    return supervisors.find(s => s.userId === session.id) || null;
  }, [session, supervisors])

  const getCurrentStudent = useCallback(() => {
    if (!session || session.role !== 'student') return null;
    return session;
  }, [session])

  const fetchRequests = useCallback(async () => {
    if (!session) return;
    const endpoint = session.role === 'student' ? '/requests/student' : '/requests/supervisor';
    const res = await api.get(endpoint);
    if (res.ok) {
      setRequests(res.data);
    }
  }, [session]);

  // подгружаем данные сразу после логина
  useEffect(() => {
    if (session) {
      fetchSupervisors()
      fetchRequests()
    }
  }, [session, fetchSupervisors, fetchRequests])

  const sendRequest = async (payload) => {
    let res;
    if (payload instanceof FormData) {
      res = await api.postFormData('/requests', payload);
    } else {
      res = await api.post('/requests', payload);
    }
    if (res.ok) {
      await fetchRequests();
    }
    return res;
  }

  const getSupervisorRequests = useCallback(() => {
    return requests;
  }, [requests])

  // ===== Команды / приглашения / discovery =====

  // список студентов (для выбора участников и для страницы "Find Teammates")
  const fetchStudents = useCallback(async ({ openToTeam, keyword } = {}) => {
    const params = new URLSearchParams()
    if (openToTeam) params.set('openToTeam', 'true')
    if (keyword) params.set('keyword', keyword)
    const qs = params.toString()
    const res = await api.get(`/students${qs ? '?' + qs : ''}`)
    return res.ok ? res.data : []
  }, [])

  // создаём команду с выбранными участниками (они получают приглашения)
  const createTeam = useCallback(async ({ name, memberUserIds }) => {
    return api.post('/teams', { name, memberUserIds })
  }, [])

  const fetchMyTeams = useCallback(async () => {
    const res = await api.get('/teams/mine')
    return res.ok ? res.data : []
  }, [])

  const fetchInvitations = useCallback(async () => {
    const res = await api.get('/invitations')
    return res.ok ? res.data : []
  }, [])

  // отправить приглашение в команду (discovery)
  const sendInvitation = useCallback(async ({ toUserId, teamId }) => {
    return api.post('/invitations', { toUserId, teamId })
  }, [])

  // принять / отклонить приглашение
  const respondInvitation = useCallback(async (invitationId, action) => {
    return api.patch(`/invitations/${invitationId}`, { action })
  }, [])

  const updateRequestStatus = async (requestId, status) => {
    const res = await api.patch(`/requests/${requestId}/status`, { status });
    if (res.ok) {
      await fetchRequests();
      await fetchSupervisors(); 
    }
    return res;
  }

  const updateSupervisorProfile = async (payload) => {
    const supervisor = getCurrentSupervisor();
    if (!supervisor) return { ok: false, error: 'Not found' };
    const res = await api.patch(`/supervisors/${supervisor.id}/profile`, payload);
    if (res.ok) {
      await fetchSupervisors();
      const meRes = await api.get('/users/me');
      if (meRes.ok) setSession(meRes.data);
    }
    return res;
  }

  const updateStudentProfile = async (payload) => {
    const res = await api.patch('/users/me', payload);
    if (res.ok) {
      const meRes = await api.get('/users/me');
      if (meRes.ok) setSession(meRes.data);
    }
    return res;
  }

  const addSupervisorTopic = async (payload) => {
    const supervisor = getCurrentSupervisor();
    if (!supervisor) return { ok: false, error: 'Not found' };
    const res = await api.post(`/supervisors/${supervisor.id}/topics`, payload);
    if (res.ok) {
      await fetchSupervisors();
    }
    return res;
  }

  const removeSupervisorTopic = async (topicId) => {
    const supervisor = getCurrentSupervisor();
    if (!supervisor) return { ok: false, error: 'Not found' };
    const res = await api.delete(`/supervisors/${supervisor.id}/topics/${topicId}`);
    if (res.ok) {
      await fetchSupervisors();
    }
    return res;
  }

  const value = {
    session,
    supervisors,
    requests,
    isInitializing,
    registerUser,
    loginUser,
    logoutUser,
    fetchSupervisors,
    fetchRequests,
    sendRequest,
    getCurrentStudent,
    getCurrentSupervisor,
    getSupervisorRequests,
    updateRequestStatus,
    updateStudentProfile,
    updateSupervisorProfile,
    addSupervisorTopic,
    removeSupervisorTopic,
    fetchStudents,
    createTeam,
    fetchMyTeams,
    fetchInvitations,
    sendInvitation,
    respondInvitation,
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
