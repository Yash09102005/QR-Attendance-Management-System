import { useState, useEffect, useRef } from 'react'
import api from '../api/config'
import attendanceDB from '../utils/indexedDB'
import qrUtils from '../utils/qrUtils'
import faceRecognition from '../utils/faceRecognition'
import QRGenerationPanel from './QRGenerationPanel'
import '../styles/Dashboard.css'
import '../styles/Modern.css'

export default function TeacherDashboard({ user, onLogout }) {
  const [view, setView] = useState('home')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [newStudent, setNewStudent] = useState({ name: '', rollNumber: '', email: '' })
  const [editStudent, setEditStudent] = useState(null)
  const [leaveData, setLeaveData] = useState({ studentId: '', date: '', reason: '' })
  const [qrScanning, setQrScanning] = useState(false)
  const [qrGeneration, setQrGeneration] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState({})
  const [faceScanning, setFaceScanning] = useState(false)
  const [faceRecognitionReady, setFaceRecognitionReady] = useState(false)
  const [recognitionActive, setRecognitionActive] = useState(false)
  const [recognitionCount, setRecognitionCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineMode, setOfflineMode] = useState(false)
  const [qrVerifiedStudent, setQrVerifiedStudent] = useState(null)
  const [faceVerifiedStudent, setFaceVerifiedStudent] = useState(null)
  const [verificationMode, setVerificationMode] = useState(false)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [notification, setNotification] = useState(null)
  const qrVideoRef = useRef(null)
  const faceVideoRef = useRef(null)
  const intervalRef = useRef(null)
  const attendanceProcessing = useRef(false)
  const sessionAttendanceMarked = useRef(false)

  useEffect(() => {
    initializeOfflineDB()
    fetchStudents()
    fetchAttendance()
    fetchLeaves()
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const initializeOfflineDB = async () => {
    try {
      if (!attendanceDB.db) {
        await attendanceDB.init()
        console.log('IndexedDB initialized')
      }
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      // Retry initialization
      setTimeout(() => initializeOfflineDB(), 1000)
    }
  }

  const syncOfflineData = async () => {
    try {
      await attendanceDB.syncWithServer(api)
      setNotification({ type: 'success', message: 'Sync completed successfully!' })
      fetchStudents()
      fetchAttendance()
      fetchLeaves()
    } catch (error) {
      console.error('Sync failed:', error)
      setNotification({ type: 'error', message: 'Sync failed: ' + error.message })
    }
  }

  const fetchStudents = async () => {
    try {
      if (isOnline) {
        // Fetch from MySQL database
        const response = await api.get('/students')
        setStudents(response.data)
        // Cache in IndexedDB for offline use
        await attendanceDB.saveStudents(response.data)
        setOfflineMode(false)
        console.log('Students loaded from database:', response.data.length)
      } else {
        // Load from IndexedDB when offline
        const cachedStudents = await attendanceDB.getStudents()
        setStudents(cachedStudents)
        setOfflineMode(true)
        console.log('Students loaded from offline cache:', cachedStudents.length)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      // Fallback to offline cache
      try {
        const cachedStudents = await attendanceDB.getStudents()
        setStudents(cachedStudents)
        setOfflineMode(true)
        console.log('Fallback to offline cache due to error')
      } catch (cacheError) {
        console.error('No offline data available:', cacheError)
        setStudents([])
      }
    }
  }

  const fetchAttendance = async () => {
    try {
      if (isOnline) {
        const response = await api.get('/attendance')
        setAttendance(response.data)
        // Also save to IndexedDB for offline use
        await attendanceDB.saveAttendance(response.data)
      } else {
        // Load from IndexedDB when offline
        const cachedAttendance = await attendanceDB.getAttendance()
        setAttendance(cachedAttendance)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      // Fallback to offline data
      try {
        const cachedAttendance = await attendanceDB.getAttendance()
        setAttendance(cachedAttendance)
      } catch (cacheError) {
        console.error('No offline attendance data available')
      }
    }
  }

  const fetchLeaves = async () => {
    try {
      if (isOnline) {
        const response = await api.get('/leaves')
        setLeaves(response.data)
        
        await attendanceDB.saveLeaves(response.data)
      } else {
        
        const cachedLeaves = await attendanceDB.getLeaves()
        setLeaves(cachedLeaves)
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
      
      try {
        const cachedLeaves = await attendanceDB.getLeaves()
        setLeaves(cachedLeaves)
      } catch (cacheError) {
        console.error('No offline leaves data available')
      }
    }
  }

  const markAttendance = async (studentId, status) => {
    try {
      if (isOnline) {
        
        const response = await api.post('/attendance/mark', { studentId, status })
        
        await attendanceDB.addOfflineAttendance(studentId, status)
        console.log('Attendance saved to MySQL and IndexedDB')
        alert('Attendance marked! (Saved to MySQL + IndexedDB)')
      } else {
        await attendanceDB.addOfflineAttendance(studentId, status)
        alert('Attendance saved offline to IndexedDB. Will sync to MySQL when online.')
      }
      
      fetchAttendance()
    } catch (error) {
      try {
        await attendanceDB.addOfflineAttendance(studentId, status)
        alert('MySQL server error. Attendance saved offline to IndexedDB.')
        fetchAttendance()
      } catch (offlineError) {
        alert('Error marking attendance')
      }
    }
  }

  const enrollStudent = async (e) => {
    e.preventDefault()
    
    try {
      // Ensure IndexedDB is initialized
      if (!attendanceDB.db) {
        await attendanceDB.init()
      }
      
      if (isOnline) {
        // Save to MySQL and cache in IndexedDB
        const response = await api.post('/students/enroll', newStudent)
        await attendanceDB.saveStudents([response.data])
        setNotification({ type: 'success', message: 'Student enrolled successfully!' })
        setNewStudent({ name: '', rollNumber: '', email: '' })
        fetchStudents()
      } else {
        // Save offline - will sync when online
        const offlineStudent = await attendanceDB.addOfflineStudent(newStudent)
        setStudents(prev => [...prev, offlineStudent])
        setNewStudent({ name: '', rollNumber: '', email: '' })
        setNotification({ type: 'info', message: 'Student enrolled offline. Will sync when online.' })
      }
    } catch (error) {
      // Fallback to offline if MySQL fails
      try {
        if (!attendanceDB.db) {
          await attendanceDB.init()
        }
        const offlineStudent = await attendanceDB.addOfflineStudent(newStudent)
        setStudents(prev => [...prev, offlineStudent])
        setNewStudent({ name: '', rollNumber: '', email: '' })
        setNotification({ type: 'warning', message: 'Database error. Student saved offline.' })
      } catch (offlineError) {
        setNotification({ type: 'error', message: 'Failed to enroll student: ' + offlineError.message })
      }
    }
  }

  const updateStudent = async (e) => {
    e.preventDefault()
    try {
      if (isOnline && !editStudent.id.toString().startsWith('offline_')) {
        // Update in MySQL database
        await api.put(`/students/${editStudent.id}`, editStudent)
        // Also update in IndexedDB
        await attendanceDB.updateOfflineStudent(editStudent)
        alert('Student updated successfully in database!')
        
        setEditStudent(null)
        fetchStudents() // Refresh the student list
      } else {
        // Update offline when no internet or offline student
        await attendanceDB.updateOfflineStudent(editStudent)
        setEditStudent(null)
        // Update local state immediately
        setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s))
        alert('Student updated offline. Will sync to database when online.')
      }
    } catch (error) {
      console.error('Update error:', error)
      
      // Fallback to offline update
      try {
        await attendanceDB.updateOfflineStudent(editStudent)
        setEditStudent(null)
        setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s))
        alert('Database error. Student updated offline and will sync later.')
      } catch (offlineError) {
        alert('Error updating student: ' + offlineError.message)
      }
    }
  }

  const deleteStudent = async (id) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        if (isOnline && !id.toString().startsWith('offline_')) {
          // Delete from MySQL database
          await api.delete(`/students/${id}`)
          // Also delete from IndexedDB
          await attendanceDB.deleteOfflineStudent(id)
          alert('Student deleted successfully from database!')
          
          fetchStudents() // Refresh the student list
        } else {
          // Delete offline when no internet or offline student
          await attendanceDB.deleteOfflineStudent(id)
          // Update local state immediately
          setStudents(prev => prev.filter(s => s.id !== id))
          alert('Student deleted offline. Will sync to database when online.')
        }
      } catch (error) {
        console.error('Delete error:', error)
        
        // Fallback to offline delete
        try {
          await attendanceDB.deleteOfflineStudent(id)
          setStudents(prev => prev.filter(s => s.id !== id))
          alert('Database error. Student deleted offline and will sync later.')
        } catch (offlineError) {
          alert('Error deleting student: ' + offlineError.message)
        }
      }
    }
  }

  const markLeave = async (e) => {
    e.preventDefault()
    try {
      if (isOnline) {
        
        await api.post('/leaves/mark', leaveData)
        alert('Leave marked successfully!')
      } else {
        
        await attendanceDB.addOfflineLeave(leaveData)
        alert('Leave marked offline. Will sync when online.')
      }
      setLeaveData({ studentId: '', date: '', reason: '' })
      fetchLeaves()
    } catch (error) {
      console.error('Leave marking error:', error)
      
      try {
        await attendanceDB.addOfflineLeave(leaveData)
        setLeaveData({ studentId: '', date: '', reason: '' })
        alert('Server error. Leave saved offline.')
      } catch (offlineError) {
        alert('Error marking leave')
      }
    }
  }

  const startQRScanner = async () => {
    try {
      setQrScanning(true)
      
      
      const hasPermission = await qrUtils.checkCameraPermission()
      if (!hasPermission) {
        alert('Camera permission required for QR scanning')
        setQrScanning(false)
        return
      }

      
      const success = await qrUtils.startScanner(
        qrVideoRef.current,
        handleQRScanSuccess,
        handleQRScanError
      )

      if (!success) {
        setQrScanning(false)
      }
    } catch (error) {
      console.error('QR scanner start error:', error)
      alert('Failed to start QR scanner: ' + error.message)
      setQrScanning(false)
    }
  }

  const stopQRScanner = () => {
    qrUtils.stopScanner()
    setQrScanning(false)
  }

  const handleQRScanSuccess = async (scanResult) => {
    console.log('QR scan result:', scanResult)
    
    try {
      let student = null
      
      if (scanResult.type === 'student') {
        student = students.find(s => s.id == scanResult.studentId)
      } else if (scanResult.type === 'class') {
        alert(`📚 Class QR detected: ${scanResult.className}\nNow scan individual student QR codes.`)
        return
      } else {
        student = students.find(s => 
          s.rollNumber.toLowerCase() === scanResult.data.toLowerCase() ||
          s.name.toLowerCase().includes(scanResult.data.toLowerCase())
        )
      }
      
      if (!student) {
        alert(`❌ Student not found: ${scanResult.data || scanResult.name}`)
        return
      }
      
      setQrVerifiedStudent(student)
      setVerificationMode(true)
      
      if (faceVerifiedStudent && faceVerifiedStudent.id === student.id && !attendanceMarked) {
        await markDualVerifiedAttendance(student)
      }
      
      stopQRScanner()
      
    } catch (error) {
      console.error('QR processing error:', error)
      alert('Error processing QR code: ' + error.message)
    }
  }

  const handleQRScanError = (error) => {
    console.error('QR scan error:', error)
    alert('QR scanning error: ' + error.message)
    stopQRScanner()
  }

  const handleManualQRInput = async (qrData) => {
    if (!qrData.trim()) return
    
    qrUtils.parseQRData(qrData, handleQRScanSuccess, handleQRScanError)
  }

  const markDualVerifiedAttendance = async (student) => {
    if (attendanceMarked || attendanceProcessing.current || sessionAttendanceMarked.current) return
    
    attendanceProcessing.current = true
    sessionAttendanceMarked.current = true
    setAttendanceMarked(true)
    console.log(`🔐 Both QR and Face verified for ${student.name} - marking attendance...`)
    
    try {
      await markAttendance(student.id, 'PRESENT')
      alert(`🎉 ATTENDANCE MARKED!\n\n👤 Student: ${student.name}\n🎓 Roll: ${student.rollNumber}\n✅ Status: PRESENT`)
    } catch (error) {
      console.error('Error marking dual verified attendance:', error)
      alert('Error marking attendance: ' + error.message)
      sessionAttendanceMarked.current = false
    }
    
    resetVerification()
  }

  const resetVerification = () => {
    setQrVerifiedStudent(null)
    setFaceVerifiedStudent(null)
    setVerificationMode(false)
    setAttendanceMarked(false)
    attendanceProcessing.current = false
    console.log('🔄 Verification reset')
  }

  
  const startFaceRecognition = async () => {
    try {
      console.log('👤 Starting face recognition...')
      setFaceScanning(true)
      
      
      console.log('📹 Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user'
        } 
      })
      
      console.log('✅ Camera stream obtained')
      
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream
        faceVideoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded, starting playback...')
          faceVideoRef.current.play()
        }
        await new Promise(resolve => {
          faceVideoRef.current.onplaying = resolve
        })
        console.log('✅ Camera video is now playing')
      }
      
      
      console.log('🤖 Loading face recognition models...')
      const modelsLoaded = await faceRecognition.loadModels()
      if (!modelsLoaded) {
        alert('❌ Failed to load AI models. Please check internet connection and try again.')
        stopFaceRecognition()
        return
      }
      
      
      const studentsWithPhotos = students.filter(s => s.faceImagePath)
      console.log('Students with photos:', studentsWithPhotos.length)
      
      if (studentsWithPhotos.length === 0) {
        
        alert('⚠️ No student photos found!\n\nWill detect your face and mark as PRESENT for demo.')
        setFaceRecognitionReady(true)
        setRecognitionActive(true)
        setRecognitionCount(3)
        startRecognitionCountdown()
        return
      }
      
      
      console.log('📸 Loading student face images...')
      const facesLoaded = await faceRecognition.loadStudentFaces(students)
      
      setFaceRecognitionReady(true)
      setRecognitionActive(true)
      setRecognitionCount(3)
      
      if (facesLoaded) {
        const status = faceRecognition.getStatus()
        alert(`👤 Face Recognition Ready!\n\n👥 Loaded ${status.studentsWithFaces} student faces\n⏱️ 3-second countdown will begin\n📸 Look directly at the camera`)
      } else {
        alert('⚠️ Could not load student faces, but will detect your face and mark as PRESENT for demo.')
      }
      
      
      startRecognitionCountdown()
      
    } catch (error) {
      console.error('Face recognition start error:', error)
      if (error.name === 'NotAllowedError') {
        alert('❌ Camera permission denied. Please allow camera access and try again.')
      } else if (error.name === 'NotFoundError') {
        alert('❌ No camera found. Please connect a camera and try again.')
      } else {
        alert('❌ Camera error: ' + error.message)
      }
      stopFaceRecognition()
    }
  }

  const stopFaceRecognition = () => {
    console.log('🛑 Stopping face recognition...')
    
    
    if (faceVideoRef.current && faceVideoRef.current.srcObject) {
      const tracks = faceVideoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      faceVideoRef.current.srcObject = null
    }
    
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setFaceScanning(false)
    setRecognitionActive(false)
    setRecognitionCount(0)
    setFaceRecognitionReady(false)
  }

  const startRecognitionCountdown = () => {
    intervalRef.current = setInterval(() => {
      setRecognitionCount(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          performFaceRecognition()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const performFaceRecognition = async () => {
    console.log('🔍 Performing face recognition...')
    
    if (!faceVideoRef.current) {
      alert('❌ Camera not ready')
      stopFaceRecognition()
      return
    }
    
    try {
      const faceDetected = await faceRecognition.detectFace(faceVideoRef.current)
      
      if (!faceDetected.success) {
        alert('❌ No face detected in camera. Please:\n1. Ensure good lighting\n2. Look directly at camera\n3. Move closer to camera\n4. Try again')
        stopFaceRecognition()
        return
      }
      
      console.log('✅ Face detected!')
      
      const status = faceRecognition.getStatus()
      
      if (status.studentsWithFaces > 0) {
        const result = await faceRecognition.recognizeFace(faceVideoRef.current)
        
        if (result.success) {
          console.log(`✅ Face recognized: ${result.student.name} (${result.confidence}% confidence)`)
          
          setFaceVerifiedStudent(result.student)
          setVerificationMode(true)
          
          if (qrVerifiedStudent && qrVerifiedStudent.id === result.student.id && !attendanceMarked) {
            await markDualVerifiedAttendance(result.student)
          } else if (qrVerifiedStudent && qrVerifiedStudent.id !== result.student.id) {
            alert(`❌ VERIFICATION MISMATCH!\n\n📱 QR: ${qrVerifiedStudent.name}\n👤 Face: ${result.student.name}\n\n⚠️ Both must match to mark attendance`)
            resetVerification()
          }
        } else {
          console.log('❌ Face not recognized')
        }
      } else {
        alert('⚠️ No student face photos loaded.\nPlease upload face photos first.')
      }
      
    } catch (error) {
      console.error('Face recognition error:', error)
      alert('❌ Face recognition error: ' + error.message)
    }
    
    stopFaceRecognition()
  }

  const downloadCSV = async () => {
    try {
      // Generate CSV from current attendance data
      let csv = 'Student Name,Roll Number,Status,Date,Time,Source\n'
      
      attendance.forEach(record => {
        const student = students.find(s => s.id == record.studentId || (record.student && s.id == record.student.id))
        const studentName = student ? student.name : (record.student ? record.student.name : `Student ID: ${record.studentId}`)
        const rollNumber = student ? student.rollNumber : (record.student ? record.student.rollNumber : 'N/A')
        const date = new Date(record.timestamp).toLocaleDateString()
        const time = new Date(record.timestamp).toLocaleTimeString()
        const source = record.synced === false ? 'Offline' : 'Online'
        
        csv += `"${studentName}","${rollNumber}","${record.status}","${date}","${time}","${source}"\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'attendance_report.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('📊 CSV report downloaded successfully!')
    } catch (error) {
      console.error('CSV download error:', error)
      alert('Error generating CSV report: ' + error.message)
    }
  }

  const downloadPDF = async () => {
    try {
      // Generate HTML report from current attendance data
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>Attendance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        h1 { color: #333; }
        .present { color: #28a745; font-weight: bold; }
        .absent { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Attendance Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Records:</strong> ${attendance.length}</p>
    <table>
        <tr>
            <th>Student Name</th>
            <th>Roll Number</th>
            <th>Status</th>
            <th>Date</th>
            <th>Source</th>
        </tr>
        ${attendance.map(record => {
          const student = students.find(s => s.id == record.studentId || (record.student && s.id == record.student.id))
          const studentName = student ? student.name : (record.student ? record.student.name : `Student ID: ${record.studentId}`)
          const rollNumber = student ? student.rollNumber : (record.student ? record.student.rollNumber : 'N/A')
          const statusClass = record.status === 'PRESENT' ? 'present' : 'absent'
          const source = record.synced === false ? 'Offline' : 'Online'
          
          return `<tr>
            <td>${studentName}</td>
            <td>${rollNumber}</td>
            <td class="${statusClass}">${record.status}</td>
            <td>${new Date(record.timestamp).toLocaleDateString()}</td>
            <td>${source}</td>
          </tr>`
        }).join('')}
    </table>
</body>
</html>`
      
      const blob = new Blob([html], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'attendance_report.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('📄 Report downloaded successfully!')
    } catch (error) {
      console.error('PDF download error:', error)
      alert('Error generating report: ' + error.message)
    }
  }

  const uploadFaceImage = async (studentId, file) => {
    if (!file) return
    
    console.log('Uploading face image:', file.name, 'for student:', studentId)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await api.post(`/face/upload/${studentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('Upload response:', response.data)
      
      if (response.data.success) {
        const imageUrl = response.data.imageUrl || `http://localhost:8081/uploads/faces/student_${studentId}_face.jpg`
        
        alert(`📸 Face image uploaded successfully!\n\nFile: ${response.data.fileName}\nURL: ${imageUrl}\n\nThis photo will be used for face recognition.`)
        
       
        try {
          const testResponse = await fetch(imageUrl)
          if (testResponse.ok) {
            console.log('✅ Image is accessible at:', imageUrl)
          } else {
            console.error('❌ Image not accessible:', testResponse.status)
          }
        } catch (testError) {
          console.error('❌ Image test failed:', testError)
        }
        
        fetchStudents() 
        faceRecognition.reset() 
      } else {
        alert('Failed to upload: ' + response.data.message)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading face image: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '25px',
        padding: '30px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px 0',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h1 style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: 0
          }}>
            🎓 Welcome, {user.name}
          </h1>
          <button 
            onClick={onLogout}
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🚪 Logout
          </button>
        </div>
      <div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '30px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#00ff88' : '#ff4757',
                  boxShadow: `0 0 10px ${isOnline ? '#00ff88' : '#ff4757'}`,
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  {isOnline ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>
                👥 {students.length} Students | 📊 {attendance.length} Records
              </div>
            </div>
            {isOnline && (
              <button 
                onClick={syncOfflineData}
                style={{ 
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                🔄 Sync Data
              </button>
            )}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { key: 'home', icon: '🏠', label: 'Dashboard', color: '#4facfe' },
            { key: 'attendance', icon: '✅', label: 'Attendance', color: '#43e97b' },
            { key: 'reports', icon: '📊', label: 'Reports', color: '#fa709a' },
            { key: 'students', icon: '👥', label: 'Students', color: '#ffecd2' },
            { key: 'leave', icon: '🏖️', label: 'Leave', color: '#a8edea' }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                padding: '15px 25px',
                border: 'none',
                borderRadius: '15px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: view === tab.key 
                  ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                  : 'rgba(255,255,255,0.1)',
                color: view === tab.key ? 'white' : '#666',
                boxShadow: view === tab.key 
                  ? `0 8px 25px ${tab.color}40`
                  : '0 4px 15px rgba(0,0,0,0.1)',
                transform: view === tab.key ? 'translateY(-2px)' : 'translateY(0)'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {view === 'home' && (
          <div className="content-card">
            <h2>📈 Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{students.length}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{attendance.filter(r => r.status === 'PRESENT').length}</div>
                <div className="stat-label">Present Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{attendance.filter(r => r.status === 'ABSENT').length}</div>
                <div className="stat-label">Absent Records</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{leaves.length}</div>
                <div className="stat-label">Leave Records</div>
              </div>
            </div>
          </div>
        )}

      {view === 'attendance' && (
        <div className="content-card">
          <h2>✅ Mark Attendance</h2>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: verificationMode ? '#e7f3ff' : '#f8f9fa', borderRadius: '8px', border: '2px solid ' + (verificationMode ? '#007bff' : '#dee2e6') }}>
              <h4 style={{ margin: '0 0 10px 0', color: verificationMode ? '#0066cc' : '#666' }}>🔐 Dual Verification System</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div style={{ padding: '10px', backgroundColor: qrVerifiedStudent ? '#d4edda' : '#f8f9fa', borderRadius: '6px', border: '1px solid ' + (qrVerifiedStudent ? '#c3e6cb' : '#dee2e6') }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📱 QR Verification</div>
                  <div>{qrVerifiedStudent ? `✅ ${qrVerifiedStudent.name}` : '⏳ Pending'}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: faceVerifiedStudent ? '#d4edda' : '#f8f9fa', borderRadius: '6px', border: '1px solid ' + (faceVerifiedStudent ? '#c3e6cb' : '#dee2e6') }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>👤 Face Verification</div>
                  <div>{faceVerifiedStudent ? `✅ ${faceVerifiedStudent.name}` : '⏳ Pending'}</div>
                </div>
              </div>
              {verificationMode && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button 
                    onClick={resetVerification}
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                  >
                    🔄 Reset Verification
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={qrScanning ? stopQRScanner : startQRScanner}
              className="btn-modern btn-primary"
            >
              {qrScanning ? '📹 Stop QR Scanner' : '📱 Start QR Scanner'}
            </button>
            <button 
              onClick={() => setQrGeneration(!qrGeneration)}
              className="btn-modern btn-success"
            >
              {qrGeneration ? '❌ Close QR Generator' : '🎨 Generate QR Codes'}
            </button>
            <button 
              onClick={faceScanning ? stopFaceRecognition : startFaceRecognition}
              className="btn-modern btn-purple"
            >
              {faceScanning ? '🛑 Stop Face Recognition' : '👤 Start Face Recognition'}
            </button>
          </div>
          
          {qrScanning && (
            <div style={{ padding: '20px', border: '3px solid #007bff', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#f8f9ff' }}>
              <h4 style={{ color: '#007bff', marginBottom: '15px' }}>📱 QR Code Scanner Active</h4>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <video 
                    ref={qrVideoRef}
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      height: '300px', 
                      border: '2px solid #007bff',
                      borderRadius: '8px',
                      backgroundColor: '#000'
                    }}
                    autoPlay
                    muted
                    playsInline
                  />
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    🎯 Point camera at QR code to scan automatically
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Manual QR Input:</label>
                    <input 
                      type="text" 
                      placeholder="Enter QR data, roll number, or student name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleManualQRInput(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      style={{ padding: '12px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '6px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Supported QR Types:</h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                      <li>🎓 Student QR codes (generated below)</li>
                      <li>📚 Class/Session QR codes</li>
                      <li>📝 Roll numbers (e.g., "CS001")</li>
                      <li>👤 Student names (e.g., "Sri Priya")</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {qrGeneration && (
            <QRGenerationPanel 
              students={students}
              generatedQRs={generatedQRs}
              setGeneratedQRs={setGeneratedQRs}
            />
          )}

          {faceScanning && (
            <div style={{ padding: '20px', border: '3px solid #6f42c1', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#f8f6ff' }}>
              <h4 style={{ color: '#6f42c1', marginBottom: '15px' }}>👤 Face Recognition Active</h4>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <video 
                    ref={faceVideoRef}
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      height: '300px', 
                      border: recognitionActive ? '3px solid #007bff' : '2px solid #6f42c1',
                      borderRadius: '8px',
                      backgroundColor: '#000'
                    }}
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {recognitionActive && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '15px', 
                      backgroundColor: '#e7f3ff',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '2px solid #007bff'
                    }}>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>
                        {recognitionCount > 0 ? recognitionCount : '🔍'}
                      </div>
                      <div style={{ fontSize: '16px', color: '#0066cc' }}>
                        {recognitionCount > 0 ? `Recognition in ${recognitionCount} seconds...` : 'Analyzing face... Marking attendance...'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ padding: '15px', backgroundColor: '#f0e6ff', borderRadius: '8px', marginBottom: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>System Status:</h5>
                    <div style={{ fontSize: '14px' }}>
                      <div>🤖 Models: {faceRecognitionReady ? '✅ Loaded' : '⏳ Loading...'}</div>
                      <div>👥 Students with faces: {students.filter(s => s.faceImagePath).length}</div>
                      <div>📹 Camera: {faceScanning ? '✅ Active' : '❌ Inactive'}</div>
                      <div>🔍 Recognition: {recognitionActive ? '✅ Running' : '⏸️ Standby'}</div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>How it works:</h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                      <li>📸 Camera captures your face</li>
                      <li>🤖 AI compares with uploaded photos</li>
                      <li>🎯 Matches face with student records</li>
                      <li>✅ Marks attendance automatically</li>
                      <li>📊 Shows confidence percentage</li>
                    </ul>
                  </div>
                  
                  {!faceRecognitionReady && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '14px' }}>
                      ⏳ Loading AI models... This may take a moment on first use.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <h3>Manual Attendance</h3>
          {students.map(student => (
            <div key={student.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
              <span>{student.name} ({student.rollNumber})</span>
              <button 
                onClick={() => markAttendance(student.id, 'PRESENT')}
                style={{ margin: '0 5px', padding: '5px', backgroundColor: '#28a745', color: 'white', border: 'none' }}
              >
                Present
              </button>
              <button 
                onClick={() => markAttendance(student.id, 'ABSENT')}
                style={{ margin: '0 5px', padding: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
              >
                Absent
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'reports' && (
        <div className="content-card">
          <h2>📊 Attendance Reports</h2>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4>📊 Summary</h4>
              <div>
                <button 
                  onClick={downloadCSV}
                  className="btn-modern btn-success"
                >
                  📊 Download CSV
                </button>
                <button 
                  onClick={downloadPDF}
                  className="btn-modern btn-danger"
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{students.length}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Students</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  {attendance.filter(r => r.status === 'PRESENT').length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Present Records</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                  {attendance.filter(r => r.status === 'ABSENT').length}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Absent Records</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{leaves.length}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Leave Records</div>
              </div>
            </div>
          </div>

          {attendance.length > 0 ? (
            <div>
              <h4>📋 Attendance Records</h4>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record, index) => {
                    
                    const student = students.find(s => 
                      s.id == record.studentId || 
                      s.id === record.studentId ||
                      (record.student && s.id == record.student.id)
                    )
                    const studentName = student ? student.name : 
                      (record.student ? record.student.name : `Student ID: ${record.studentId}`)
                    
                    return (
                      <tr key={record.id || index}>
                        <td>{studentName}</td>
                        <td>
                          <span className={record.status === 'PRESENT' ? 'status-present' : 'status-absent'}>
                            {record.status}
                          </span>
                        </td>
                        <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                        <td>{record.synced === false ? '💾 Offline' : '🌐 Online'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
              <h4>No Attendance Records Yet</h4>
              <p style={{ color: '#666' }}>Start marking attendance to see reports here.</p>
            </div>
          )}

          {leaves.length > 0 && (
            <div>
              <h4>🏖️ Leave Records</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Student</th>
                    <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>Date</th>
                    <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left' }}>Reason</th>
                    <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave, index) => {
                    // Find student name - handle both server and offline IDs
                    const student = students.find(s => 
                      s.id == leave.studentId || 
                      s.id === leave.studentId ||
                      (leave.student && s.id == leave.student.id)
                    )
                    const studentName = student ? student.name : 
                      (leave.student ? leave.student.name : `Student ID: ${leave.studentId}`)
                    
                    return (
                      <tr key={leave.id || index}>
                        <td style={{ border: '1px solid #ccc', padding: '12px' }}>{studentName}</td>
                        <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                          {leave.leaveDate || new Date(leave.date).toLocaleDateString()}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '12px' }}>{leave.reason}</td>
                        <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                          {leave.synced === false ? '💾 Offline' : '🌐 Online'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'students' && (
        <div className="content-card">
          <h2>👥 Student Management</h2>
          
          <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
            <h3 style={{ color: '#4a5568', marginBottom: 'var(--space-md)' }}>➕ Enroll New Student</h3>
            <form onSubmit={enrollStudent} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'end' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Student Name:</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Roll Number:</label>
                <input
                  type="text"
                  placeholder="e.g., CS001"
                  value={newStudent.rollNumber}
                  onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Email:</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <button type="submit" className="btn-modern btn-success">
                ✅ Enroll Student
              </button>
            </form>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: 'var(--space-sm)', fontStyle: 'italic' }}>
              💡 Students will be saved to the database {isOnline ? 'immediately' : 'when you go online'}
            </div>
          </div>

          {editStudent && (
            <div style={{ background: 'linear-gradient(135deg, rgba(227, 242, 253, 0.9) 0%, rgba(243, 229, 245, 0.9) 100%)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', border: '2px solid rgba(0, 123, 255, 0.3)', backdropFilter: 'blur(20px)' }}>
              <h3 style={{ color: '#007bff', marginBottom: 'var(--space-md)' }}>✏️ Update Student: {editStudent.name}</h3>
              <form onSubmit={updateStudent} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'end' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Student Name:</label>
                  <input
                    type="text"
                    value={editStudent.name}
                    onChange={(e) => setEditStudent({...editStudent, name: e.target.value})}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ flex: '1', minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Roll Number:</label>
                  <input
                    type="text"
                    value={editStudent.rollNumber}
                    onChange={(e) => setEditStudent({...editStudent, rollNumber: e.target.value})}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Email:</label>
                  <input
                    type="email"
                    value={editStudent.email}
                    onChange={(e) => setEditStudent({...editStudent, email: e.target.value})}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button type="submit" className="btn-modern btn-primary">
                    💾 Update
                  </button>
                  <button type="button" onClick={() => setEditStudent(null)} className="btn-modern" style={{ background: 'var(--neutral-gradient)' }}>
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>👥 All Students ({students.length})</h3>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {isOnline ? '🟢 Database Connected' : '🔴 Offline Mode'}
            </div>
          </div>
          {students.map(student => (
            <div key={student.id} className="student-card" style={{ 
              backgroundColor: student.isOffline ? 'rgba(255, 243, 205, 0.9)' : 'var(--glass-bg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {student.name} ({student.rollNumber})
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {student.email}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    Face Photo: {student.faceImagePath ? 
                      <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Uploaded ({student.faceImagePath})</span> : 
                      <span style={{ color: 'red' }}>✗ Not uploaded</span>
                    }
                  </div>
                  {student.isOffline && (
                    <div style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
                      💾 Offline - Will sync when online
                    </div>
                  )}
                </div>
                
                {student.faceImagePath && (
                  <div style={{ width: '60px', height: '60px', marginRight: '15px' }}>
                    <img 
                      src={`http://localhost:8081/uploads/faces/student_${student.id}_face.jpg`}
                      alt={student.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '50%',
                        border: '2px solid #28a745'
                      }}
                      onError={(e) => {
                        console.log(`Failed to load image for student ${student.id}`)
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <button 
                      onClick={() => setEditStudent(student)}
                      className="btn-modern btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteStudent(student.id)}
                      className="btn-modern btn-danger"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          uploadFaceImage(student.id, file)
                        }
                      }}
                      style={{ display: 'none' }}
                      id={`face-upload-${student.id}`}
                    />
                    <label 
                      htmlFor={`face-upload-${student.id}`}
                      style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'inline-block'
                      }}
                    >
                      {student.faceImagePath ? '📷 Change Photo' : '📸 Upload Face Photo'}
                    </label>
                    {student.faceImagePath && (
                      <button 
                        onClick={() => {
                          // Test image URL
                          const testUrl = `http://localhost:8081/uploads/faces/student_${student.id}_face.jpg`
                          window.open(testUrl, '_blank')
                        }}
                        style={{ 
                          padding: '6px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          marginLeft: '5px',
                          fontSize: '12px'
                        }}
                      >
                        🔍 Test Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'leave' && (
        <div className="content-card">
          <h2>🏖️ Mark Student Leave</h2>
          <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={markLeave} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'end' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Select Student:</label>
                <select
                  value={leaveData.studentId}
                  onChange={(e) => setLeaveData({...leaveData, studentId: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name} ({student.rollNumber})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Leave Date:</label>
                <input
                  type="date"
                  value={leaveData.date}
                  onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ flex: '2', minWidth: '250px' }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#4a5568' }}>Reason:</label>
                <input
                  type="text"
                  placeholder="Enter reason for leave..."
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <button type="submit" className="btn-modern btn-success">
                🏖️ Mark Leave
              </button>
            </form>
          </div>

          <h3 style={{ color: '#4a5568', marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>Leave Records</h3>
          {leaves.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              {leaves.map(leave => (
                <div key={leave.id} className="student-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)', color: '#2d3748' }}>
                        {leave.student.name} ({leave.student.rollNumber})
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: 'var(--space-xs)' }}>
                        📅 {leave.leaveDate} | 📝 {leave.reason}
                      </div>
                    </div>
                    <span className="status-present" style={{ fontSize: '0.8rem' }}>
                      APPROVED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: '#6c757d' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🏖️</div>
              <div>No leave records found</div>
            </div>
          )}
        </div>
      )}
      </div>
      
      {/* Modern Toast Notification */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '30px',
            right: '30px',
            padding: '20px 25px',
            borderRadius: '15px',
            color: 'white',
            fontWeight: '600',
            fontSize: '16px',
            zIndex: 1000,
            background: 
              notification.type === 'success' ? 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' :
              notification.type === 'error' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' :
              notification.type === 'warning' ? 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)' : 
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            transform: 'translateX(0)',
            animation: 'slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }}
          onClick={() => setNotification(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' :
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            {notification.message}
          </div>
        </div>
      )}
      
      </div>
    </div>
  )
}