#!/bin/bash

# CodeCA 发布脚本
# 用于快速创建新版本发布

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    print_error "请在项目根目录运行此脚本"
    exit 1
fi

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    print_warning "工作目录有未提交的更改"
    echo "请先提交或暂存所有更改后再发布"
    git status --short
    exit 1
fi

# 获取当前版本
current_version=$(node -p "require('./package.json').version")
print_info "当前版本: v$current_version"

# 询问新版本号
echo
echo "请选择版本类型:"
echo "1) patch (修复版本, 如 1.0.0 -> 1.0.1)"
echo "2) minor (功能版本, 如 1.0.0 -> 1.1.0)"
echo "3) major (重大版本, 如 1.0.0 -> 2.0.0)"
echo "4) 自定义版本号"
echo
read -p "请选择 (1-4): " choice

case $choice in
    1)
        version_type="patch"
        ;;
    2)
        version_type="minor"
        ;;
    3)
        version_type="major"
        ;;
    4)
        read -p "请输入新版本号 (如 1.2.3): " custom_version
        if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_error "版本号格式不正确，应为 x.y.z 格式"
            exit 1
        fi
        ;;
    *)
        print_error "无效选择"
        exit 1
        ;;
esac

# 更新版本号
print_info "更新版本号..."

if [ -n "$custom_version" ]; then
    new_version=$custom_version
    # 手动更新 package.json
    npm version $new_version --no-git-tag-version
else
    # 使用 npm version 自动更新
    new_version=$(npm version $version_type --no-git-tag-version | sed 's/v//')
fi

# 更新 Tauri 配置文件
print_info "更新 Tauri 配置..."
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" src-tauri/tauri.conf.json
rm src-tauri/tauri.conf.json.bak

# 更新 Cargo.toml
if [ -f "src-tauri/Cargo.toml" ]; then
    sed -i.bak "s/version = \".*\"/version = \"$new_version\"/" src-tauri/Cargo.toml
    rm src-tauri/Cargo.toml.bak
fi

print_success "版本号已更新为: v$new_version"

# 询问是否创建更新日志
echo
read -p "是否要编辑更新日志? (y/N): " edit_changelog
if [[ $edit_changelog =~ ^[Yy]$ ]]; then
    if [ ! -f "CHANGELOG.md" ]; then
        echo "# 更新日志\n\n## [v$new_version] - $(date +%Y-%m-%d)\n\n### 新增\n- \n\n### 修复\n- \n\n### 改进\n- \n" > CHANGELOG.md
    fi
    ${EDITOR:-nano} CHANGELOG.md
fi

# 提交更改
print_info "提交版本更新..."
git add package.json src-tauri/tauri.conf.json
if [ -f "src-tauri/Cargo.toml" ]; then
    git add src-tauri/Cargo.toml
fi
if [ -f "CHANGELOG.md" ]; then
    git add CHANGELOG.md
fi

git commit -m "chore: bump version to v$new_version"

# 创建标签
print_info "创建 Git 标签..."
git tag "v$new_version"

# 询问是否推送
echo
read -p "是否立即推送到远程仓库并触发构建? (y/N): " push_now
if [[ $push_now =~ ^[Yy]$ ]]; then
    print_info "推送到远程仓库..."
    git push origin main
    git push origin "v$new_version"
    
    print_success "发布完成!"
    print_info "GitHub Actions 将自动开始构建"
    print_info "请访问 https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions 查看构建状态"
else
    print_warning "版本已准备就绪，但未推送到远程仓库"
    print_info "要推送并触发构建，请运行:"
    echo "  git push origin main"
    echo "  git push origin v$new_version"
fi

echo
print_success "发布脚本执行完成!"