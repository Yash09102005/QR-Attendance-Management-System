import { useState, useEffect } from 'react'
import api from '../api/config'
import '../styles/Dashboard.css'
import '../styles/Modern.css'

export default function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState('home')
  const [attendance, setAttendance] = useState([])
  const [users, setUsers] = useState([])
  const [students, setStudents] = useState([])
  const [leaves, setLeaves] = useState([])
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'TEACHER' })
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    fetchAttendance()
    fetchUsers()
    fetchStudents()
    fetchLeaves()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance')
      setAttendance(response.data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves')
      setLeaves(response.data)
    } catch (error) {
      console.error('Error fetching leaves:', error)
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/auth/register', newUser)
      setNewUser({ username: '', password: '', name: '', role: 'TEACHER' })
      fetchUsers()
      showToast('User created successfully!', 'success')
    } catch (error) {
      showToast('Error creating user', 'error')
    }
  }

  const deleteUser = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/auth/users/${id}`)
        fetchUsers()
        showToast('User deleted successfully!', 'success')
      } catch (error) {
        showToast('Error deleting user', 'error')
      }
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">👨‍💼 Admin Dashboard - Welcome {user.name}</h1>
        <button onClick={onLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
      <div className="content-wrapper">
        <div className="status-card">
          <div style={{ textAlign: 'center' }}>
            <strong>🔒 Administrator Access - Full System Control</strong>
          </div>
        </div>
        
        <div className="nav-buttons">
          <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>🏠 Home</button>
          <button onClick={() => setView('reports')} className={`nav-btn ${view === 'reports' ? 'active' : ''}`}>📊 View Reports</button>
          <button onClick={() => setView('users')} className={`nav-btn ${view === 'users' ? 'active' : ''}`}>👥 Manage Users</button>
        </div>

        {view === 'home' && (
          <div className="content-card">
            <h2 style={{ marginBottom: '2rem', color: 'white', fontSize: '2rem' }}>📈 System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{students.length}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{users.filter(u => u.role === 'TEACHER').length}</div>
                <div className="stat-label">Total Teachers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{attendance.length}</div>
                <div className="stat-label">Attendance Records</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{leaves.length}</div>
                <div className="stat-label">Leave Records</div>
              </div>
            </div>
          </div>
        )}

      {view === 'reports' && (
        <div className="content-card">
          <h2>📊 System Reports</h2>
          
          <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>Recent Attendance</h3>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 10).map(record => (
                <tr key={record.id}>
                  <td>{record.student.name}</td>
                  <td>{record.student.rollNumber}</td>
                  <td>
                    <span className={record.status === 'PRESENT' ? 'status-present' : 'status-absent'}>
                      {record.status}
                    </span>
                  </td>
                  <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ color: '#4a5568', marginBottom: '1rem', marginTop: '2rem' }}>Recent Leaves</h3>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td>{leave.student.name}</td>
                  <td>{leave.leaveDate}</td>
                  <td>{leave.reason}</td>
                  <td><span className="status-present">{leave.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'users' && (
        <div className="content-card">
          <h2>👥 User Management</h2>
          
          <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>➕ Create New User</h3>
            <form onSubmit={createUser} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end' }}>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="form-input"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="form-input"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="form-input"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="form-input"
              >
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className="btn-modern btn-success">
                ✅ Create User
              </button>
            </form>
          </div>

          <h3 style={{ color: '#4a5568', marginBottom: '1rem' }}>All Users</h3>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.name}</td>
                  <td><span className="status-present">{user.role}</span></td>
                  <td>
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="btn-modern btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      </div>
      
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'success' 
            ? 'linear-gradient(135deg, #c8e6c9, #a5d6a7)' 
            : 'linear-gradient(135deg, #ffcdd2, #ef9a9a)',
          color: toast.type === 'success' ? '#1b5e20' : '#b71c1c',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          border: `2px solid ${toast.type === 'success' ? '#4caf50' : '#f44336'}`,
          zIndex: 1000,
          fontWeight: '600',
          fontSize: '1rem',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}