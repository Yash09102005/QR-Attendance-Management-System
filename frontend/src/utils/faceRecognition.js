import * as faceapi from 'face-api.js'

class FaceRecognition {
  constructor() {
    this.modelsLoaded = false
    this.faceDescriptors = []
    this.isInitialized = false
  }

 
  async loadModels() {
    if (this.modelsLoaded) return true

    try {
      console.log('Loading face recognition models...')
      
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])

      this.modelsLoaded = true
      console.log('✅ Face recognition models loaded successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to load face recognition models:', error)
      return false
    }
  }

  
  async loadStudentFaces(students) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels()
      if (!loaded) return false
    }

    const studentsWithPhotos = students.filter(s => s.faceImagePath)
    console.log(`Loading face descriptors for ${studentsWithPhotos.length} students...`)

    this.faceDescriptors = []

    for (const student of studentsWithPhotos) {
      try {
        
        const imageUrls = [
          `http://localhost:8081/uploads/faces/student_${student.id}_face.jpg`,
          `http://localhost:8081/uploads/faces/${student.faceImagePath}`,
          `http://localhost:8081/uploads/faces/student_${student.id}_${student.faceImagePath}`,
          `http://localhost:8081/uploads/faces/face_${student.id}.jpg`
        ]

        let faceDescriptor = null
        
        for (const url of imageUrls) {
          try {
            console.log(`Trying to load face image: ${url}`)
            const img = await faceapi.fetchImage(url)
            
            const detection = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor()

            if (detection) {
              faceDescriptor = detection.descriptor
              console.log(`✅ Face descriptor loaded for ${student.name}`)
              break
            }
          } catch (urlError) {
            console.log(`Failed to load from ${url}:`, urlError.message)
          }
        }

        if (faceDescriptor) {
          this.faceDescriptors.push({
            student: student,
            descriptor: faceDescriptor
          })
        } else {
          console.log(`⚠️ No face found in images for ${student.name}`)
        }
      } catch (error) {
        console.error(`Error processing face for ${student.name}:`, error)
      }
    }

    console.log(`Loaded ${this.faceDescriptors.length} face descriptors`)
    this.isInitialized = this.faceDescriptors.length > 0
    return this.isInitialized
  }

  
  async recognizeFace(videoElement) {
    if (!this.modelsLoaded || !this.isInitialized) {
      return {
        success: false,
        message: 'Face recognition not initialized'
      }
    }

    try {
      console.log('🔍 Detecting face in video...')
      
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        return {
          success: false,
          message: 'No face detected in camera'
        }
      }

      console.log('✅ Face detected, comparing with student faces...')

    
      let bestMatch = null
      let bestDistance = 1.0

      for (const studentData of this.faceDescriptors) {
        const distance = faceapi.euclideanDistance(detection.descriptor, studentData.descriptor)
        console.log(`Distance to ${studentData.student.name}: ${distance.toFixed(3)}`)

        if (distance < bestDistance && distance < 0.6) { 
          bestDistance = distance
          bestMatch = studentData.student
        }
      }

      if (bestMatch) {
        const confidence = ((1 - bestDistance) * 100).toFixed(1)
        console.log(`🎯 Face matched: ${bestMatch.name} (${confidence}% confidence)`)
        
        return {
          success: true,
          student: bestMatch,
          confidence: parseFloat(confidence),
          message: `Face recognized as ${bestMatch.name}`
        }
      } else {
        return {
          success: false,
          message: 'Face not recognized - no matching student found'
        }
      }

    } catch (error) {
      console.error('Face recognition error:', error)
      return {
        success: false,
        message: 'Face recognition failed: ' + error.message
      }
    }
  }

  
  async detectFace(videoElement) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels()
      if (!loaded) {
        return {
          success: false,
          message: 'Face detection models not loaded'
        }
      }
    }

    try {
      console.log('🔍 Detecting face in video element...')
      
     
      if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        return {
          success: false,
          message: 'Video not ready or no video stream'
        }
      }
      
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))

      console.log('Face detection result:', !!detection)
      
      return {
        success: !!detection,
        message: detection ? 'Face detected successfully' : 'No face detected in camera'
      }
    } catch (error) {
      console.error('Face detection error:', error)
      return {
        success: false,
        message: 'Face detection failed: ' + error.message
      }
    }
  }

 
  getStatus() {
    return {
      modelsLoaded: this.modelsLoaded,
      isInitialized: this.isInitialized,
      studentsWithFaces: this.faceDescriptors.length
    }
  }


  reset() {
    this.faceDescriptors = []
    this.isInitialized = false
  }
}

export default new FaceRecognition()