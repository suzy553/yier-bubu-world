@echo off
chcp 65001 >nul
start "" notepad "%~dp0.env.local"
