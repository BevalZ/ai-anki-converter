# 发布指南

本项目使用 GitHub Actions 自动构建多平台应用程序。

## 🚀 自动构建流程

### 1. Android 构建

**触发方式：**
- 推送 Git 标签 (如 `v1.0.0`)
- 手动触发

**构建产物：** `.apk` 安装包

**工作流文件：** `.github/workflows/android.yml`

**特性：**
- 自动初始化 Android 项目 (`tauri android init`)
- 支持多架构 (ARM64, ARMv7, x86, x86_64)
- 自动发布到 GitHub Releases

### 2. 桌面端构建 (macOS & Linux)

**触发方式：**
- 推送 Git 标签 (如 `v1.0.0`)
- 手动触发

**构建平台：**
- **macOS**: `.dmg` 安装包 (支持 Intel 和 Apple Silicon)
- **Linux**: `.AppImage` 和 `.deb` 包

**工作流文件：** `.github/workflows/desktop.yml`

**特性：**
- 支持 macOS 代码签名
- 多架构构建 (ARM64, x86_64)
- 自动发布到 GitHub Releases

### 3. Windows 构建

**触发方式：**
- 推送 Git 标签 (如 `v1.0.0`)
- 手动触发

**构建产物：** `.msi` 和 `.exe` 安装包

**工作流文件：** `.github/workflows/windows.yml`

**特性：**
- 支持 Windows 代码签名
- 生成 MSI 和 NSIS 安装包
- 自动发布到 GitHub Releases

## 📋 发布步骤

### 创建新版本发布

1. **更新版本号**
   ```bash
   # 更新 package.json 中的版本号
   npm version patch  # 或 minor, major
   
   # 更新 src-tauri/tauri.conf.json 中的版本号
   # 更新 src-tauri/Cargo.toml 中的版本号
   ```

2. **创建并推送标签**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **等待构建完成**
   - Android 构建大约需要 20-40 分钟
   - macOS & Linux 构建大约需要 15-30 分钟
   - Windows 构建大约需要 10-20 分钟
   - 三个工作流会并行执行

4. **发布 Release**
   - 前往 GitHub Releases 页面
   - 编辑自动创建的草稿发布
   - 添加更新日志
   - 发布正式版本

## ⚙️ 配置要求

### GitHub Secrets (可选)

如果需要代码签名，请在 GitHub 仓库设置中添加以下 Secrets：

**macOS 代码签名：**
- `APPLE_CERTIFICATE`: Base64 编码的开发者证书
- `APPLE_CERTIFICATE_PASSWORD`: 证书密码
- `APPLE_SIGNING_IDENTITY`: 签名身份
- `APPLE_ID`: Apple ID
- `APPLE_PASSWORD`: App 专用密码
- `APPLE_TEAM_ID`: 团队 ID

**Windows 代码签名：**
- `WINDOWS_CERTIFICATE`: Base64 编码的代码签名证书
- `WINDOWS_CERTIFICATE_PASSWORD`: 证书密码

### Android 配置

**注意：** GitHub Actions 会自动处理 Android 项目初始化，无需手动配置。

1. **本地开发初始化** (仅本地开发需要)
   ```bash
   npm install -g @tauri-apps/cli@latest
   tauri android init
   ```

2. **配置 Android 签名** (可选)
   - 在 `src-tauri/gen/android/app/build.gradle` 中配置签名
   - 添加 keystore 文件到仓库或使用 GitHub Secrets

3. **自动化特性**
   - CI/CD 自动检测并初始化 Android 项目
   - 支持多架构构建 (ARM64, ARMv7, x86, x86_64)
   - 自动生成通用 APK

## 🔧 本地构建

### 桌面端
```bash
# 开发模式
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### Android
```bash
# 初始化 Android 项目 (首次)
tauri android init

# 开发模式
tauri android dev

# 构建 APK
tauri android build --apk

# 构建 AAB (Google Play)
tauri android build --aab
```

## 📦 构建产物

### 桌面端
- **Windows**: `src-tauri/target/release/bundle/msi/` 和 `src-tauri/target/release/bundle/nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` 和 `src-tauri/target/release/bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/appimage/` 和 `src-tauri/target/release/bundle/deb/`

### Android
- **APK**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB**: `src-tauri/gen/android/app/build/outputs/bundle/`

## 🐛 故障排除

### 常见问题

1. **构建失败 - 依赖问题**
   - 检查 `package.json` 和 `Cargo.toml` 中的依赖版本
   - 清理缓存：`npm ci` 和 `cargo clean`

2. **Android 构建失败**
   - 确保 Android NDK 版本兼容 (使用 NDK 25.0.8775105)
   - 检查 Java 版本 (推荐 Java 17)
   - 验证 Android SDK 配置
   - 如果提示 "Android Studio project directory doesn't exist"，工作流会自动运行 `tauri android init`

3. **代码签名失败**
   - 验证证书有效性
   - 检查 GitHub Secrets 配置
   - 确保证书权限正确

### 调试构建

```bash
# 启用详细日志
RUST_LOG=debug npm run tauri:build

# 检查构建环境
tauri info
```

## 📚 相关文档

- [Tauri 官方文档](https://tauri.app/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri Android 指南](https://tauri.app/v1/guides/building/android)
- [代码签名指南](https://tauri.app/v1/guides/distribution/sign-android)