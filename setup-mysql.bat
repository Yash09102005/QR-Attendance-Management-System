@echo off
echo ========================================
echo   MySQL Setup for Attendance System
echo ========================================
echo.

echo 📋 Prerequisites:
echo 1. Install MySQL Server 8.0+ from https://dev.mysql.com/downloads/mysql/
echo 2. Install MySQL Workbench (optional GUI)
echo 3. Remember your root password during installation
echo.

echo 🔧 Configuration Steps:
echo.
echo 1. Start MySQL Service:
echo    - Windows: Services → MySQL80 → Start
echo    - Or: net start mysql80
echo.
echo 2. Connect to MySQL:
echo    mysql -u root -p
echo.
echo 3. Create Database (optional - auto-created):
echo    CREATE DATABASE attendance_db;
echo    USE attendance_db;
echo.
echo 4. Update application.properties if needed:
echo    - Username: root
echo    - Password: (your MySQL root password)
echo    - Database: attendance_db
echo.

echo 🚀 Current Configuration:
echo Database: MySQL 8.0
echo URL: jdbc:mysql://localhost:3306/attendance_db
echo Username: root
echo Password: (empty - update if you have password)
echo Auto-create: Yes
echo.

echo 💾 Data Storage:
echo ✅ Online: MySQL Database (persistent)
echo ✅ Offline: IndexedDB (browser storage)
echo ✅ Dual Storage: Both when online
echo ✅ Auto-Sync: IndexedDB → MySQL when reconnected
echo.

echo 🔍 Verify Setup:
echo 1. Start MySQL service
echo 2. Run: run.bat
echo 3. Check console for "MySQL" connection logs
echo 4. Test enrollment - should save to both storages
echo.

pause