import { useState, useEffect } from 'react'
import qrUtils from '../utils/qrUtils'

export default function QRGenerationPanel({ students, generatedQRs, setGeneratedQRs }) {
  const [selectedStudents, setSelectedStudents] = useState([])
  const [classQR, setClassQR] = useState(null)
  const [loading, setLoading] = useState(false)

  
  const generateClassQR = async () => {
    setLoading(true)
    try {
      const classInfo = {
        id: 'class_' + Date.now(),
        name: 'Attendance Session',
        date: new Date().toLocaleDateString()
      }
      
      const qrCode = await qrUtils.generateClassQR(classInfo)
      setClassQR(qrCode)
    } catch (error) {
      alert('Error generating class QR: ' + error.message)
    }
    setLoading(false)
  }

  
  const generateStudentQRs = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students first')
      return
    }

    setLoading(true)
    const newQRs = { ...generatedQRs }

    try {
      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId)
        if (student && !newQRs[studentId]) {
          const qrCode = await qrUtils.generateStudentQR(student)
          newQRs[studentId] = qrCode
        }
      }
      setGeneratedQRs(newQRs)
    } catch (error) {
      alert('Error generating student QRs: ' + error.message)
    }
    setLoading(false)
  }

  const generateAllStudentQRs = async () => {
    setLoading(true)
    const newQRs = { ...generatedQRs }

    try {
      for (const student of students) {
        if (!newQRs[student.id]) {
          const qrCode = await qrUtils.generateStudentQR(student)
          newQRs[student.id] = qrCode
        }
      }
      setGeneratedQRs(newQRs)
    } catch (error) {
      alert('Error generating QRs: ' + error.message)
    }
    setLoading(false)
  }

  
  const downloadQR = (qrDataURL, filename) => {
    const link = document.createElement('a')
    link.download = filename
    link.href = qrDataURL
    link.click()
  }

  
  const printQRs = () => {
    const printWindow = window.open('', '_blank')
    const qrCodes = Object.entries(generatedQRs)
    
    let printContent = `
      <html>
        <head>
          <title>Student QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .qr-item { 
              display: inline-block; 
              margin: 15px; 
              text-align: center; 
              page-break-inside: avoid;
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 8px;
            }
            .qr-code { width: 150px; height: 150px; }
            .student-info { margin-top: 8px; font-size: 14px; font-weight: bold; }
            @media print {
              .qr-item { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <h2>Student QR Codes - ${new Date().toLocaleDateString()}</h2>
    `

    qrCodes.forEach(([studentId, qrCode]) => {
      const student = students.find(s => s.id == studentId)
      if (student) {
        printContent += `
          <div class="qr-item">
            <img src="${qrCode}" class="qr-code" alt="QR Code for ${student.name}" />
            <div class="student-info">
              ${student.name}<br/>
              ${student.rollNumber}
            </div>
          </div>
        `
      }
    })

    printContent += '</body></html>'
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div style={{ padding: '20px', border: '3px solid #28a745', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#f8fff8' }}>
      <h4 style={{ color: '#28a745', marginBottom: '20px' }}>🎨 QR Code Generator</h4>
      
      {/* Class QR Section */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h5 style={{ color: '#0066cc', marginBottom: '15px' }}>📚 Class/Session QR Code</h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={generateClassQR}
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#0066cc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Generating...' : '🏫 Generate Class QR'}
          </button>
          
          {classQR && (
            <div style={{ textAlign: 'center' }}>
              <img src={classQR} alt="Class QR Code" style={{ width: '120px', height: '120px', border: '2px solid #0066cc' }} />
              <div style={{ marginTop: '8px' }}>
                <button 
                  onClick={() => downloadQR(classQR, 'class-qr-code.png')}
                  style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  📥 Download
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Students scan this QR to join the attendance session, then scan their individual QR codes.
        </div>
      </div>

      {/* Student Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ color: '#28a745', marginBottom: '15px' }}>👥 Select Students for QR Generation</h5>
        
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => setSelectedStudents(students.map(s => s.id))}
            style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}
          >
            ✅ Select All
          </button>
          <button 
            onClick={() => setSelectedStudents([])}
            style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}
          >
            ❌ Clear All
          </button>
          <button 
            onClick={generateStudentQRs}
            disabled={loading || selectedStudents.length === 0}
            style={{ 
              padding: '8px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: (loading || selectedStudents.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Generating...' : '🎯 Generate Selected QRs'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
          {students.map(student => (
            <label key={student.id} style={{ display: 'flex', alignItems: 'center', padding: '5px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStudents([...selectedStudents, student.id])
                  } else {
                    setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                  }
                }}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>{student.name} ({student.rollNumber})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generated QR Codes Display */}
      {Object.keys(generatedQRs).length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h5 style={{ color: '#28a745', margin: 0 }}>📱 Generated QR Codes ({Object.keys(generatedQRs).length})</h5>
            <button 
              onClick={printQRs}
              style={{ padding: '8px 15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              🖨️ Print All QRs
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
            {Object.entries(generatedQRs).map(([studentId, qrCode]) => {
              const student = students.find(s => s.id == studentId)
              if (!student) return null
              
              return (
                <div key={studentId} style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <img 
                    src={qrCode} 
                    alt={`QR for ${student.name}`}
                    style={{ width: '120px', height: '120px', border: '1px solid #ccc' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {student.rollNumber}
                  </div>
                  <button 
                    onClick={() => downloadQR(qrCode, `${student.rollNumber}-qr.png`)}
                    style={{ 
                      marginTop: '5px', 
                      padding: '4px 8px', 
                      fontSize: '11px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px' 
                    }}
                  >
                    📥 Download
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}