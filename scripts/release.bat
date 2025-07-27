@echo off
setlocal enabledelayedexpansion

REM CodeCA 发布脚本 (Windows 版本)
REM 用于快速创建新版本发布

echo.
echo ========================================
echo   CodeCA 发布脚本
echo ========================================
echo.

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "src-tauri" (
    echo ❌ 错误: 未找到 src-tauri 目录
    pause
    exit /b 1
)

REM 检查 Git 状态
git status --porcelain > temp_status.txt
for /f %%i in (temp_status.txt) do (
    echo ⚠️  警告: 工作目录有未提交的更改
    echo 请先提交或暂存所有更改后再发布
    git status --short
    del temp_status.txt
    pause
    exit /b 1
)
del temp_status.txt

REM 获取当前版本
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set current_version=%%i
echo ℹ️  当前版本: v!current_version!
echo.

REM 询问新版本号
echo 请选择版本类型:
echo 1) patch (修复版本, 如 1.0.0 -^> 1.0.1)
echo 2) minor (功能版本, 如 1.0.0 -^> 1.1.0)
echo 3) major (重大版本, 如 1.0.0 -^> 2.0.0)
echo 4) 自定义版本号
echo.
set /p choice="请选择 (1-4): "

if "%choice%"=="1" (
    set version_type=patch
) else if "%choice%"=="2" (
    set version_type=minor
) else if "%choice%"=="3" (
    set version_type=major
) else if "%choice%"=="4" (
    set /p custom_version="请输入新版本号 (如 1.2.3): "
    REM 简单的版本号格式检查
    echo !custom_version! | findstr /r "^[0-9]*\.[0-9]*\.[0-9]*$" >nul
    if errorlevel 1 (
        echo ❌ 错误: 版本号格式不正确，应为 x.y.z 格式
        pause
        exit /b 1
    )
) else (
    echo ❌ 错误: 无效选择
    pause
    exit /b 1
)

echo.
echo ℹ️  更新版本号...

REM 更新版本号
if defined custom_version (
    set new_version=!custom_version!
    npm version !new_version! --no-git-tag-version
) else (
    for /f "tokens=*" %%i in ('npm version !version_type! --no-git-tag-version') do set version_output=%%i
    set new_version=!version_output:~1!
)

echo ℹ️  更新 Tauri 配置...
REM 更新 Tauri 配置文件 (使用 PowerShell 进行更精确的替换)
powershell -Command "(Get-Content 'src-tauri/tauri.conf.json') -replace '\"version\": \".*\"', '\"version\": \"%new_version%\"' | Set-Content 'src-tauri/tauri.conf.json'"

REM 更新 Cargo.toml
if exist "src-tauri\Cargo.toml" (
    powershell -Command "(Get-Content 'src-tauri/Cargo.toml') -replace 'version = \".*\"', 'version = \"%new_version%\"' | Set-Content 'src-tauri/Cargo.toml'"
)

echo ✅ 版本号已更新为: v!new_version!
echo.

REM 询问是否创建更新日志
set /p edit_changelog="是否要创建/编辑更新日志? (y/N): "
if /i "!edit_changelog!"=="y" (
    if not exist "CHANGELOG.md" (
        echo # 更新日志 > CHANGELOG.md
        echo. >> CHANGELOG.md
        echo ## [v!new_version!] - %date% >> CHANGELOG.md
        echo. >> CHANGELOG.md
        echo ### 新增 >> CHANGELOG.md
        echo - >> CHANGELOG.md
        echo. >> CHANGELOG.md
        echo ### 修复 >> CHANGELOG.md
        echo - >> CHANGELOG.md
        echo. >> CHANGELOG.md
        echo ### 改进 >> CHANGELOG.md
        echo - >> CHANGELOG.md
        echo. >> CHANGELOG.md
    )
    notepad CHANGELOG.md
)

echo ℹ️  提交版本更新...
git add package.json src-tauri/tauri.conf.json
if exist "src-tauri\Cargo.toml" (
    git add src-tauri/Cargo.toml
)
if exist "CHANGELOG.md" (
    git add CHANGELOG.md
)

git commit -m "chore: bump version to v!new_version!"

echo ℹ️  创建 Git 标签...
git tag "v!new_version!"

echo.
set /p push_now="是否立即推送到远程仓库并触发构建? (y/N): "
if /i "!push_now!"=="y" (
    echo ℹ️  推送到远程仓库...
    git push origin main
    git push origin "v!new_version!"
    
    echo ✅ 发布完成!
    echo ℹ️  GitHub Actions 将自动开始构建
    echo ℹ️  请访问 GitHub Actions 页面查看构建状态
) else (
    echo ⚠️  版本已准备就绪，但未推送到远程仓库
    echo ℹ️  要推送并触发构建，请运行:
    echo   git push origin main
    echo   git push origin v!new_version!
)

echo.
echo ✅ 发布脚本执行完成!
echo.
pause