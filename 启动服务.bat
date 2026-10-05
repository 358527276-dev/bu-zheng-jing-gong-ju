@echo off
chcp 65001 >nul
title 不正经工具箱
echo.
echo ========================================
echo    🤪 不正经工具箱 - 启动中
echo ========================================
echo.

cd /d "%~dp0backend"

rem === 配置区（上线前请修改） ===
set ADMIN_PASSWORD=admin123
set AI_PROVIDER=qwen
set AI_API_KEY=sk-ws-H.PMPIIPP.7C3L.MEUCIDHvAWAl6xMryLfV0LNLXc_bABj68fopo_PY8Z3x4FCPAiEAm5tb8qW_qcLU6Wq-MdktqpetuBJQzSjSi8b6lzKByWQ
set AI_MODEL=qwen-turbo
set WX_APPID=wxb86234b979c2e36e
set WX_APPSECRET=fd0f1b77b4cacb0ac92b258432660378
rem ================================

if not exist node_modules (
    echo 📦 首次启动，正在安装依赖...
    npm install
    echo.
)

echo 🚀 服务启动中...
echo.
node server.js

pause
