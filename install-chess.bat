@echo off
echo ========================================
echo Installing Chess.js Library
echo ========================================
echo.

echo Step 1: Removing old chess.js...
call npm uninstall chess.js

echo.
echo Step 2: Installing chess.js v1.0.0-beta.8...
call npm install chess.js@1.0.0-beta.8

echo.
echo Step 3: Installing react-chessboard (if needed)...
call npm install react-chessboard

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Now run: npm run dev
echo Then navigate to: http://localhost:5173/quickplay
echo.
pause
