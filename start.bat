@echo off
echo Starting Smart Attendance Management System...
echo.

echo [1/2] Starting Backend Server...
cd backend
start "Backend Server" cmd /k "mvn spring-boot:run"

echo [2/2] Starting Frontend Application...
cd ..\frontend
timeout /t 5 /nobreak > nul
start "Frontend App" cmd /k "npm run dev"

echo.
echo ✅ System Started Successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8081
echo 💾 Database: http://localhost:8081/h2-console
echo.
echo Login Credentials:
echo 👨‍💼 Admin:   yashila / 123
echo 👩‍🏫 Teacher: yash / 1234
echo.
pause