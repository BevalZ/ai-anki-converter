# CodeCA - AI Anki 转换器

一个基于AI的智能记忆卡片生成工具，可以将任意文本转换为高质量的Anki记忆卡片。

## 🌐 在线体验

**[立即体验 CodeCA →](https://traecodecavzfl-hgitvfwgt-987622272s-projects.vercel.app/editor)**

无需安装，直接在浏览器中体验完整功能！

## ✨ 功能特性

### 🤖 AI驱动的卡片生成
- **智能文本处理**：支持文本总结、内容重新整理和知识点提取
- **多种卡片类型**：基础问答、填空题、定义解释等多种格式
- **难度分级**：简单、中等、困难三个难度等级
- **批量生成**：一次性生成多张相关卡片

### 🎨 美观的卡片展示
- **HTML格式化**：支持富文本格式，包括代码高亮、文本强调等
- **代码块支持**：专门优化的代码显示样式
- **响应式设计**：适配各种设备屏幕
- **主题切换**：支持明暗主题

### 📝 强大的编辑功能
- **卡片编辑器**：可视化编辑卡片内容
- **AI增强**：使用AI优化现有卡片内容
- **批量操作**：支持批量选择、删除、编辑
- **标签管理**：为卡片添加分类标签

### 📤 多格式导出
- **Anki包(.apkg)**：直接导入Anki桌面和移动端
- **CSV文件**：电子表格格式，便于数据处理
- **JSON文件**：结构化数据，适合开发者使用
- **纯文本**：简单的问答对格式
- **图像导出**：将卡片导出为PNG、JPEG、SVG格式图片，支持单张或批量导出，前后面垂直拼接

### 🌍 多语言支持
- **界面多语言**：支持中文、英文等多种界面语言
- **智能语言检测**：自动检测输入文本语言并生成对应语言的卡片
- **本地化体验**：完整的多语言用户体验

### 📱 移动端优化
- **响应式设计**：完美适配手机、平板等移动设备
- **触摸友好**：优化按钮大小和交互区域，提升触摸体验
- **移动端导航**：专为小屏幕设计的导航和菜单系统
- **性能优化**：针对移动设备的性能和加载速度优化

### ⚙️ 智能AI配置
- **多AI提供商**：支持OpenAI、Claude、本地模型等
- **自定义API**：可配置自定义AI服务端点
- **模型选择**：支持不同AI模型的切换
- **智能密钥管理**：自动验证API密钥有效性，实时获取可用模型列表
- **安全存储**：使用Web Crypto API安全存储配置信息
- **智能优先级**：自动将最近配置的AI服务设为默认选项

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd codeca
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
```

4. **打开浏览器**
访问 `http://localhost:5173` 开始使用

### 配置AI服务

1. 进入设置页面
2. 添加AI提供商（如OpenAI、Claude等）
3. 配置API密钥
4. 选择合适的模型
5. 测试连接确保配置正确

## 📖 使用指南

### 生成卡片
1. 在首页输入要学习的文本内容
2. 选择卡片类型和难度
3. 设置最大生成数量
4. 点击"生成卡片"按钮
5. 预览生成的卡片

### 智能文本处理
- **总结文本**：将长文本压缩为关键要点
- **重新整理**：提取核心知识点并自动设置卡片数量
- **知识点提取**：智能识别文本中的重要概念

### 卡片管理
- 在卡片编辑器中查看和编辑所有卡片
- 使用AI增强功能优化卡片内容
- 添加标签进行分类管理
- 将重要卡片添加到导出桶

### 导出和分享
- 选择合适的导出格式
- 设置牌组名称
- 下载生成的文件
- 导入到Anki或其他学习应用

## 🛠️ 技术栈

### 前端框架
- **React 18**：现代化的用户界面框架
- **TypeScript**：类型安全的JavaScript超集
- **Vite**：快速的构建工具和开发服务器

### UI组件
- **Tailwind CSS**：实用优先的CSS框架
- **Lucide React**：美观的图标库
- **Sonner**：优雅的通知组件

### 状态管理
- **Zustand**：轻量级状态管理库
- **React Router**：客户端路由管理

### 文本处理
- **React Markdown**：Markdown渲染支持
- **Rehype Highlight**：代码语法高亮
- **Remark GFM**：GitHub风格Markdown

### 文件处理
- **JSZip**：ZIP文件生成
- **File Saver**：文件下载功能
- **Axios**：HTTP请求库

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── CardBucket.tsx   # 卡片收集桶
│   ├── CardContent.tsx  # 卡片内容渲染
│   ├── Empty.tsx        # 空状态组件
│   └── Navigation.tsx   # 导航栏
├── hooks/               # 自定义Hook
│   ├── useTheme.ts      # 主题管理
│   └── useTranslation.ts # 国际化
├── pages/               # 页面组件
│   ├── Home.tsx         # 首页
│   ├── CardEditor.tsx   # 卡片编辑器
│   ├── Export.tsx       # 导出页面
│   └── Settings.tsx     # 设置页面
├── services/            # 服务层
│   └── aiService.ts     # AI服务接口
├── store/               # 状态管理
│   └── useAppStore.ts   # 应用状态
├── utils/               # 工具函数
│   └── translations.ts  # 多语言配置
└── lib/                 # 库文件
    └── utils.ts         # 通用工具函数
```

## 🔧 开发命令

```bash
# 开发服务器
npm run dev

# 类型检查
npm run check

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# Tauri 桌面应用开发
npm run tauri:dev

# 构建 Tauri 桌面应用
npm run tauri:build
```

## 📦 自动构建与发布

本项目使用 GitHub Actions 实现多平台自动构建，支持以下平台：

### 🖥️ 桌面端
- **Windows**: `.msi` 和 `.exe` 安装包
- **macOS**: `.dmg` 安装包 (支持 Intel 和 Apple Silicon)
- **Linux**: `.AppImage` 和 `.deb` 包

### 📱 移动端
- **Android**: `.apk` 安装包

### 🚀 发布新版本

#### 方法一：使用发布脚本（推荐）
```bash
# Linux/macOS
./scripts/release.sh

# Windows
scripts\release.bat
```

#### 方法二：手动发布
1. 更新版本号
   ```bash
   npm version patch  # 或 minor, major
   ```

2. 更新 Tauri 配置
   ```bash
   # 手动编辑 src-tauri/tauri.conf.json 中的版本号
   # 手动编辑 src-tauri/Cargo.toml 中的版本号
   ```

3. 创建并推送标签
   ```bash
   git add .
   git commit -m "chore: bump version to v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

### 📋 构建状态

- **持续集成**: 每次推送到 `main` 分支都会触发构建测试
- **发布构建**: 推送 Git 标签（如 `v1.0.0`）会触发正式发布构建
- **手动构建**: 可在 GitHub Actions 页面手动触发构建

查看详细的发布指南：[.github/RELEASE_GUIDE.md](.github/RELEASE_GUIDE.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Lucide](https://lucide.dev/) - 图标库
- [Anki](https://apps.ankiweb.net/) - 记忆卡片应用

## 📞 支持

如果您在使用过程中遇到问题或有建议，请：

- 提交 [Issue](../../issues)
- 发送邮件至 [support@example.com](mailto:support@example.com)
- 查看 [文档](../../wiki)

---

**CodeCA** - 让学习更高效，让记忆更持久 🚀
