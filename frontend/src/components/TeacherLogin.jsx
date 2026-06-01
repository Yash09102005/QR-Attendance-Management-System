import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/config'
import '../styles/Login.css'

export default function TeacherLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/auth/login', { username, password })
      
      if (response.data.success && response.data.user.role === 'TEACHER') {
        onLogin(response.data.user)
      } else {
        alert('Invalid teacher credentials')
      }
    } catch (error) {
      alert('Login failed. Check if backend is running.')
    }
  }

  return (
    <div className="login-container">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      
      <div className="login-card">
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back to Home
        </button>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍🏫</div>
          <h1 className="login-title">Teacher Portal</h1>
          <p className="login-subtitle">Access your attendance dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="👤 Teacher Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="🔒 Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="login-btn">
            🚀 Login as Teacher
          </button>
        </form>
        
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <span>QR Scanning</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👤</span>
            <span>Face Recognition</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Reports</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💾</span>
            <span>Offline Mode</span>
          </div>
        </div>
      </div>
    </div>
  )
}