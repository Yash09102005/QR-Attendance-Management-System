@echo off
echo ========================================
echo   Face Upload Test & Debug
echo ========================================
echo.

echo 🔧 Step 1: Check Backend Setup
echo.
cd /d "%~dp0backend"

echo 📁 Checking uploads directory...
if not exist "uploads" mkdir uploads
if not exist "uploads\faces" mkdir uploads\faces
echo ✅ Upload directories ready
echo.

echo 🌐 Step 2: Test Backend Server
echo Backend should be running on http://localhost:8081
echo.
curl -I http://localhost:8081 2>nul
if %errorlevel% == 0 (
    echo ✅ Backend server is running
) else (
    echo ❌ Backend server not responding
    echo Please start backend with: mvn spring-boot:run
)
echo.

echo 📸 Step 3: Test Face Image Upload
echo.
echo 1. Go to http://localhost:3000
echo 2. Login as Teacher (yash / 1234)
echo 3. Go to Edit Students
echo 4. Click "Upload Face Photo" for any student
echo 5. Select a clear face image (JPG/PNG)
echo 6. Check console for upload logs
echo.

echo 🔍 Step 4: Verify Image Accessibility
echo After upload, test these URLs in browser:
echo http://localhost:8081/uploads/faces/student_1_face.jpg
echo http://localhost:8081/uploads/faces/student_2_face.jpg
echo.

echo 📋 Step 5: Check Backend Logs
echo Look for these messages in backend console:
echo "✅ Face image saved: [path]"
echo "📁 File exists: true"
echo "🌐 URL will be: [url]"
echo "✅ Static file handler configured for /uploads/faces/"
echo.

echo 🐛 Common Issues & Solutions:
echo.
echo Issue: "Failed to load faces"
echo Solution: Check if images are accessible via direct URL
echo.
echo Issue: "404 Not Found" for images
echo Solution: Restart backend server to load WebConfig
echo.
echo Issue: "CORS error"
echo Solution: Check WebConfig.java is properly configured
echo.
echo Issue: "No face detected in image"
echo Solution: Use clear, front-facing photos with good lighting
echo.

echo 🚀 Quick Test:
echo 1. Restart backend: mvn spring-boot:run
echo 2. Upload face photo
echo 3. Click "Test Image" button
echo 4. Start Face Recognition
echo.

pause