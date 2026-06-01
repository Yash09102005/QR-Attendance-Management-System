@echo off
echo ========================================
echo   Smart Attendance Management System
echo ========================================
echo.

echo [1/3] Checking directories...
if not exist "backend" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)

echo [2/3] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "echo Starting Spring Boot Backend... && mvn spring-boot:run"

echo [3/3] Starting Frontend Application...
cd ..\frontend
timeout /t 3 /nobreak > nul
start "Frontend App" cmd /k "echo Starting React Frontend... && npm run dev"

echo.
echo ✅ System Started Successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8081
echo 💾 Database: http://localhost:8081/h2-console
echo.
echo 📱 Login Credentials:
echo 👨‍💼 Admin:   yashila / 123
echo 👩‍🏫 Teacher: yash / 1234
echo.
echo 🔄 Features:
echo ✅ Online/Offline Support
echo ✅ Auto Data Synchronization
echo ✅ QR Code Attendance
echo ✅ Manual Attendance
echo ✅ Student Management
echo ✅ Leave Management
echo ✅ Attendance Reports
echo.
pause