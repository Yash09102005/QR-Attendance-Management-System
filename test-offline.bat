@echo off
echo ========================================
echo   Testing Offline Functionality
echo ========================================
echo.

echo 📋 Test Steps:
echo.
echo 1. Start the system (run.bat)
echo 2. Login as Teacher (yash / 1234)
echo 3. Go to Edit Students - verify 10 students shown
echo 4. Go to Mark Attendance - mark some students Present/Absent
echo 5. Go to View Reports - should show:
echo    - Total Students: 10
echo    - Present Records: (your marked count)
echo    - Attendance table with student names
echo.
echo 6. Disconnect internet/WiFi
echo 7. Mark more attendance (should work offline)
echo 8. Go to View Reports - should show all records
echo 9. Reconnect internet - should auto-sync
echo.

echo 🔍 What to Check in Reports:
echo ✅ Student names appear (not "Student ID: undefined")
echo ✅ Summary cards show correct counts
echo ✅ Attendance table shows all records
echo ✅ Source column shows 📀 Offline vs 🌐 Online
echo ✅ Color coding: Green=Present, Red=Absent
echo.

echo 🛠️ Debug Tips:
echo - Press F12 in browser to see console logs
echo - Check Application → IndexedDB → AttendanceDB
echo - Look for error messages in console
echo.

pause