@echo off
echo Testing Backend API...
echo.
curl -X POST http://localhost:8081/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"yashila\",\"password\":\"123\"}"
echo.
echo.
pause