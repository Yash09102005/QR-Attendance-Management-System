
class AttendanceDB {
  constructor() {
    this.dbName = 'AttendanceDB'
    this.version = 4
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        
        if (!db.objectStoreNames.contains('students')) {
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' })
          studentsStore.createIndex('rollNumber', 'rollNumber', { unique: true })
          studentsStore.createIndex('name', 'name', { unique: false })
        }
        
        
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true })
          attendanceStore.createIndex('studentId', 'studentId', { unique: false })
          attendanceStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' })
          usersStore.createIndex('username', 'username', { unique: true })
        }
        
      
        if (!db.objectStoreNames.contains('leaves')) {
          const leavesStore = db.createObjectStore('leaves', { keyPath: 'id', autoIncrement: true })
          leavesStore.createIndex('studentId', 'studentId', { unique: false })
          leavesStore.createIndex('synced', 'synced', { unique: false })
        }
        
        
        if (!db.objectStoreNames.contains('pendingOps')) {
          const pendingStore = db.createObjectStore('pendingOps', { keyPath: 'id', autoIncrement: true })
          pendingStore.createIndex('type', 'type', { unique: false })
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async saveStudents(students) {
    const transaction = this.db.transaction(['students'], 'readwrite')
    const store = transaction.objectStore('students')
    
    for (const student of students) {
      await store.put(student)
    }
    
    return transaction.complete
  }

  async getStudents() {
    const transaction = this.db.transaction(['students'], 'readonly')
    const store = transaction.objectStore('students')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveAttendance(attendanceRecords) {
    const transaction = this.db.transaction(['attendance'], 'readwrite')
    const store = transaction.objectStore('attendance')
    
    for (const record of attendanceRecords) {
      await store.put(record)
    }
    
    return transaction.complete
  }

  async getAttendance() {
    const transaction = this.db.transaction(['attendance'], 'readonly')
    const store = transaction.objectStore('attendance')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  
  async addOfflineStudent(studentData) {
    const transaction = this.db.transaction(['students', 'pendingOps'], 'readwrite')
    const studentsStore = transaction.objectStore('students')
    const pendingStore = transaction.objectStore('pendingOps')
    
    
    const offlineStudent = {
      ...studentData,
      id: 'offline_' + Date.now(),
      synced: false,
      isOffline: true
    }
    
    
    await studentsStore.put(offlineStudent)
    
    
    const pendingOp = {
      type: 'CREATE_STUDENT',
      data: studentData,
      timestamp: new Date().toISOString(),
      localId: offlineStudent.id
    }
    
    return new Promise((resolve, reject) => {
      const request = pendingStore.add(pendingOp)
      request.onsuccess = () => resolve(offlineStudent)
      request.onerror = () => reject(request.error)
    })
  }

  async updateOfflineStudent(studentData) {
    const transaction = this.db.transaction(['students', 'pendingOps'], 'readwrite')
    const studentsStore = transaction.objectStore('students')
    const pendingStore = transaction.objectStore('pendingOps')
    
    
    const updatedStudent = { ...studentData, synced: false }
    await studentsStore.put(updatedStudent)
    
    
    if (!studentData.id.toString().startsWith('offline_')) {
      const pendingOp = {
        type: 'UPDATE_STUDENT',
        data: studentData,
        timestamp: new Date().toISOString()
      }
      await pendingStore.add(pendingOp)
    }
    
    return updatedStudent
  }

  async deleteOfflineStudent(studentId) {
    const transaction = this.db.transaction(['students', 'pendingOps'], 'readwrite')
    const studentsStore = transaction.objectStore('students')
    const pendingStore = transaction.objectStore('pendingOps')
    
    
    await studentsStore.delete(studentId)
    

    if (!studentId.toString().startsWith('offline_')) {
      const pendingOp = {
        type: 'DELETE_STUDENT',
        data: { id: studentId },
        timestamp: new Date().toISOString()
      }
      await pendingStore.add(pendingOp)
    }
    
    return true
  }

  async addOfflineAttendance(studentId, status) {
    const transaction = this.db.transaction(['attendance'], 'readwrite')
    const store = transaction.objectStore('attendance')
    
    const record = {
      studentId,
      status,
      timestamp: new Date().toISOString(),
      synced: false,
      id: 'offline_att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(record) // Use put instead of add to handle custom ID
      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  async addOfflineLeave(leaveData) {
    const transaction = this.db.transaction(['leaves'], 'readwrite')
    const store = transaction.objectStore('leaves')
    
    const record = {
      ...leaveData,
      timestamp: new Date().toISOString(),
      synced: false,
      id: 'offline_leave_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(record) // Use put instead of add to handle custom ID
      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedAttendance() {
    const transaction = this.db.transaction(['attendance'], 'readonly')
    const store = transaction.objectStore('attendance')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const unsynced = request.result.filter(record => !record.synced)
        resolve(unsynced)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingOperations() {
    const transaction = this.db.transaction(['pendingOps'], 'readonly')
    const store = transaction.objectStore('pendingOps')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedLeaves() {
    const transaction = this.db.transaction(['leaves'], 'readonly')
    const store = transaction.objectStore('leaves')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const unsynced = request.result.filter(record => !record.synced)
        resolve(unsynced)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markOperationSynced(opId) {
    const transaction = this.db.transaction(['pendingOps'], 'readwrite')
    const store = transaction.objectStore('pendingOps')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(opId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateStudentWithServerId(localId, serverId) {
    const transaction = this.db.transaction(['students'], 'readwrite')
    const store = transaction.objectStore('students')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(localId)
      getRequest.onsuccess = () => {
        const student = getRequest.result
        if (student) {
          // Remove old record
          store.delete(localId)
          // Add with server ID
          student.id = serverId
          student.synced = true
          student.isOffline = false
          const putRequest = store.put(student)
          putRequest.onsuccess = () => resolve(student)
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve(null)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async saveLeaves(leaveRecords) {
    const transaction = this.db.transaction(['leaves'], 'readwrite')
    const store = transaction.objectStore('leaves')
    
    for (const record of leaveRecords) {
      await store.put(record)
    }
    
    return transaction.complete
  }

  async getLeaves() {
    const transaction = this.db.transaction(['leaves'], 'readonly')
    const store = transaction.objectStore('leaves')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markAttendanceSynced(recordId) {
    const transaction = this.db.transaction(['attendance'], 'readwrite')
    const store = transaction.objectStore('attendance')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(recordId)
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async markLeaveSynced(recordId) {
    const transaction = this.db.transaction(['leaves'], 'readwrite')
    const store = transaction.objectStore('leaves')
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(recordId)
      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async syncWithServer(apiClient) {
    try {
      console.log('🔄 Starting sync with MySQL...')
      
      // 1. Push pending operations to MySQL
      const pendingOps = await this.getPendingOperations()
      for (const op of pendingOps) {
        if (op.type === 'CREATE_STUDENT') {
          const response = await apiClient.post('/students/enroll', op.data)
          await this.updateStudentWithServerId(op.localId, response.data.id)
        } else if (op.type === 'UPDATE_STUDENT') {
          await apiClient.put(`/students/${op.data.id}`, op.data)
        } else if (op.type === 'DELETE_STUDENT') {
          await apiClient.delete(`/students/${op.data.id}`)
        }
        await this.markOperationSynced(op.id)
      }
      
      // 2. Push unsynced attendance
      const unsyncedAttendance = await this.getUnsyncedAttendance()
      for (const record of unsyncedAttendance) {
        await apiClient.post('/attendance/mark', {
          studentId: record.studentId,
          status: record.status
        })
        await this.markAttendanceSynced(record.id)
      }
      
      // 3. Pull latest data from MySQL
      const [studentsResponse, attendanceResponse] = await Promise.all([
        apiClient.get('/students'),
        apiClient.get('/attendance')
      ])
      
      await this.saveStudents(studentsResponse.data)
      await this.saveAttendance(attendanceResponse.data)
      
      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync failed:', error)
      throw error
    }
  }

  async clearAllData() {
    const stores = ['students', 'attendance', 'users', 'leaves', 'pendingOps']
    const transaction = this.db.transaction(stores, 'readwrite')
    
    for (const storeName of stores) {
      const store = transaction.objectStore(storeName)
      await store.clear()
    }
    
    return transaction.complete
  }
}

export default new AttendanceDB()