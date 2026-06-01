import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

class QRUtils {
  constructor() {
    this.scanner = null
    this.videoElement = null
  }

  
  async generateStudentQR(student) {
    const qrData = {
      type: 'STUDENT_ATTENDANCE',
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
      timestamp: new Date().toISOString()
    }
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return qrCodeDataURL
    } catch (error) {
      console.error('QR generation error:', error)
      throw error
    }
  }

  
  async generateClassQR(classInfo) {
    const qrData = {
      type: 'CLASS_ATTENDANCE',
      classId: classInfo.id || 'default',
      className: classInfo.name || 'Attendance Session',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    }
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: '#0066cc',
          light: '#FFFFFF'
        }
      })
      return qrCodeDataURL
    } catch (error) {
      console.error('Class QR generation error:', error)
      throw error
    }
  }

  
  async startScanner(videoElement, onScanSuccess, onScanError) {
    try {
      this.videoElement = videoElement
      
      
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        throw new Error('No camera found')
      }

      this.scanner = new QrScanner(
        videoElement,
        (result) => {
          console.log('QR scanned:', result.data)
          this.parseQRData(result.data, onScanSuccess, onScanError)
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      await this.scanner.start()
      console.log('QR scanner started')
      return true
    } catch (error) {
      console.error('Scanner start error:', error)
      if (onScanError) onScanError(error)
      return false
    }
  }

  stopScanner() {
    if (this.scanner) {
      this.scanner.stop()
      this.scanner.destroy()
      this.scanner = null
      console.log('QR scanner stopped')
    }
  }


  parseQRData(qrString, onSuccess, onError) {
    try {
      
      const qrData = JSON.parse(qrString)
      
      if (qrData.type === 'STUDENT_ATTENDANCE') {
        onSuccess({
          type: 'student',
          studentId: qrData.studentId,
          rollNumber: qrData.rollNumber,
          name: qrData.name,
          timestamp: qrData.timestamp
        })
      } else if (qrData.type === 'CLASS_ATTENDANCE') {
        onSuccess({
          type: 'class',
          classId: qrData.classId,
          className: qrData.className,
          date: qrData.date,
          timestamp: qrData.timestamp
        })
      } else {
        
        onSuccess({
          type: 'manual',
          data: qrString
        })
      }
    } catch (parseError) {
      
      onSuccess({
        type: 'manual',
        data: qrString.trim()
      })
    }
  }

  
  async checkCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Camera permission error:', error)
      return false
    }
  }
}

export default new QRUtils()