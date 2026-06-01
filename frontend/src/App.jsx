import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import AdminLogin from './components/AdminLogin'
import TeacherLogin from './components/TeacherLogin'
import AdminDashboard from './components/AdminDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import './styles/Modern.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/admin-login" 
            element={
              !isAuthenticated ? 
              <AdminLogin onLogin={handleLogin} /> : 
              <Navigate to="/admin-dashboard" />
            } 
          />
          <Route 
            path="/teacher-login" 
            element={
              !isAuthenticated ? 
              <TeacherLogin onLogin={handleLogin} /> : 
              <Navigate to="/teacher-dashboard" />
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              isAuthenticated && user?.role === 'ADMIN' ? 
              <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/teacher-dashboard" 
            element={
              isAuthenticated && user?.role === 'TEACHER' ? 
              <TeacherDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/" />
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App