@echo off
chcp 65001 >nul
cd /d "%~dp0"

node doubao_gen.js --check
if errorlevel 1 (
  echo.
  echo 请先填写 .env.local 里的 ARK_API_KEY 和 ARK_MODEL，然后重新运行。
  pause
  exit /b 1
)

echo.
node doubao_gen.js --spend
echo.
echo 实际余额请看：https://console.volcengine.com/finance/
echo 这次会调用豆包 API，预计费用 0.12 元/张。
set /p ok=输入 YES 确认调用（其他任意键取消）：
if /i not "%ok%"=="YES" (
  echo 已取消，没有发送请求，也没有产生费用。
  pause
  exit /b 1
)

echo.
echo 正在生成角色设定图...
node doubao_gen.js --prompt-file prompts/character-sheet.txt --out art/generated/character-sheet.png --size 2K --yes
echo.
pause
