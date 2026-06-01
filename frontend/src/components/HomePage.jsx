import { useNavigate } from 'react-router-dom'
import '../styles/HomePage.css'
import '../styles/Modern.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="homepage-container">
      <div className="floating-elements">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      
      <div className="homepage-content">
        <h1 className="homepage-title">🎓 Attendance Management</h1>
        <p className="homepage-subtitle">Modern AI-Powered Attendance Tracking System</p>
        
        <div className="login-buttons">
          <div className="login-card" onClick={() => navigate('/admin-login')}>
            <span className="login-icon">👨💼</span>
            <h3 className="login-title">Admin Portal</h3>
            <p className="login-description">System administration and user management</p>
          </div>
          
          <div className="login-card" onClick={() => navigate('/teacher-login')}>
            <span className="login-icon">👨🏫</span>
            <h3 className="login-title">Teacher Portal</h3>
            <p className="login-description">Mark attendance and manage students</p>
          </div>
        </div>
        
        <div className="features-section">
          <h2 className="features-title">✨ Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <div className="feature-name">QR Code Scanning</div>
              <div className="feature-desc">Quick attendance with QR codes</div>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👤</span>
              <div className="feature-name">Face Recognition</div>
              <div className="feature-desc">AI-powered facial recognition</div>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💾</span>
              <div className="feature-name">Offline Mode</div>
              <div className="feature-desc">Works without internet connection</div>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <div className="feature-name">Reports & Analytics</div>
              <div className="feature-desc">Detailed attendance reports</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}