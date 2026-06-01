# 🗄️ MySQL Setup Guide for Attendance System

## 1. Install MySQL
Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

## 2. Create Database
```sql
CREATE DATABASE attendance_db;
USE attendance_db;
```

## 3. Update Backend Configuration
The `application.properties` has been updated to use MySQL:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/attendance_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=yash@2005
```

## 4. Add MySQL Dependency
Updated `pom.xml` with MySQL connector:
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
```

## 5. Architecture Changes

### Backend (Spring Boot + MySQL)
- **Entities**: Student, Attendance with proper JPA annotations
- **Services**: StudentService, AttendanceService for business logic
- **Controllers**: Refactored to use service layer
- **MySQL**: Source of truth for all data

### Frontend (React + IndexedDB)
- **Online**: Data saved to MySQL + cached in IndexedDB
- **Offline**: Data saved to IndexedDB + synced when online
- **Sync**: Automatic bidirectional synchronization

## 6. Key Features

### Offline-First Design
```javascript
// Online: MySQL + IndexedDB
if (isOnline) {
  const response = await api.post('/students/enroll', student)
  await attendanceDB.saveStudents([response.data])
}
// Offline: IndexedDB only
else {
  const offlineStudent = await attendanceDB.addOfflineStudent(student)
}
```

### Automatic Sync
```javascript
// Syncs IndexedDB ↔ MySQL when online
await attendanceDB.syncWithServer(api)
```

## 7. Start the System

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm run dev
```

## 8. Verify Setup
1. Check MySQL connection at startup logs
2. Create a student online - should appear in MySQL
3. Go offline, create student - should sync when online
4. Check `attendance_db` tables in MySQL

Your system now uses MySQL as the source of truth with full offline capabilities! 🎉