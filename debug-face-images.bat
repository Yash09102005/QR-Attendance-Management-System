@echo off
echo ========================================
echo   Face Image Debug Helper
echo ========================================
echo.

echo 🔍 Checking face image uploads...
echo.

echo 📁 Expected upload directory:
echo backend\uploads\faces\
echo.

echo 📸 Expected image naming pattern:
echo student_[ID]_face.jpg
echo Example: student_1_face.jpg, student_2_face.jpg
echo.

echo 🌐 Expected image URLs:
echo http://localhost:8081/uploads/faces/student_1_face.jpg
echo http://localhost:8081/uploads/faces/student_2_face.jpg
echo.

echo 🛠️ Debug Steps:
echo.
echo 1. Check if uploads directory exists:
cd /d "%~dp0backend"
if exist "uploads\faces\" (
    echo ✅ uploads\faces\ directory exists
    echo.
    echo 📋 Files in uploads\faces\:
    dir uploads\faces\ /b
) else (
    echo ❌ uploads\faces\ directory NOT found
    echo Creating directory...
    mkdir uploads\faces
    echo ✅ Directory created
)
echo.

echo 2. Test image accessibility:
echo Open these URLs in browser to test:
echo http://localhost:8081/uploads/faces/student_1_face.jpg
echo http://localhost:8081/uploads/faces/student_2_face.jpg
echo.

echo 3. Check backend console for upload logs
echo 4. Check browser console (F12) for detailed errors
echo.

echo 💡 Common Issues:
echo - Backend not serving static files from uploads directory
echo - Image files have wrong names or extensions
echo - CORS issues preventing image loading
echo - File permissions preventing access
echo.

echo 🔧 Quick Fixes:
echo - Restart backend server
echo - Re-upload face images
echo - Check backend static file configuration
echo - Verify MySQL is running
echo.

pause