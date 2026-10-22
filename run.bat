@echo off
cd /d "%~dp0"
where node >nul 2>nul && (start "" http://localhost:5173 & node serve.js & goto :eof)
where python >nul 2>nul && (start "" http://localhost:8000 & python -m http.server 8000 & goto :eof)
where py >nul 2>nul && (start "" http://localhost:8000 & py -m http.server 8000 & goto :eof)
echo Install Node.js or Python to run the local server.
pause
