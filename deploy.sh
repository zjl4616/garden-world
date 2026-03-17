#!/bin/bash
# 花园世界游戏部署脚本

echo "🚀 开始部署花园世界游戏..."

# 检查是否安装了 curl
if ! command -v curl &> /dev/null; then
    echo "❌ 需要安装 curl"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "📁 创建临时目录: $TEMP_DIR"

# 复制所有文件到临时目录
cp -r /root/.openclaw/workspace/agents/dev/garden-world/* "$TEMP_DIR/"
cd "$TEMP_DIR"

echo "📦 准备部署文件..."
ls -la

# 创建 Netlify 配置文件
cat > netlify.toml << EOF
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
EOF

# 创建 package.json 用于 Netlify 识别
cat > package.json << 'EOF'
{
  "name": "garden-world",
  "version": "1.0.0",
  "description": "一个简单的网页版花园种植游戏",
  "scripts": {
    "build": "echo 'No build step required for static site'"
  },
  "keywords": ["game", "garden", "planting", "html5"],
  "author": "Your Name",
  "license": "MIT"
}
EOF

echo "🌐 尝试通过 Netlify Drop 部署..."

# 使用 curl 尝试直接部署到 Netlify Drop
# 注意：Netlify Drop 需要手动拖拽文件到网站，这里提供下载链接
echo "📎 文件已准备好，你可以："
echo ""
echo "1. 访问 https://app.netlify.com/drop"
echo "2. 将整个文件夹拖拽到上传区域"
echo "3. 等待部署完成"
echo ""

# 或者使用 GitHub Pages 部署方案
echo "📋 备选方案：GitHub Pages"
echo ""
echo "1. 创建新的 GitHub 仓库"
echo "2. 上传所有文件到仓库"
echo "3. 在仓库设置中启用 GitHub Pages"
echo "4. 访问 https://<你的用户名>.github.io/<仓库名>"
echo ""

# 创建压缩包方便下载
ZIP_FILE="garden-world.zip"
zip -r "$ZIP_FILE" ./*
echo "📦 已创建压缩包: $ZIP_FILE"
echo "📏 文件大小: $(du -h "$ZIP_FILE" | cut -f1)"

echo ""
echo "🎮 游戏文件清单："
echo "  • index.html      - 主页面"
echo "  • styles.css      - 样式文件"
echo "  • game.js         - 游戏逻辑"
echo "  • manifest.json   - PWA配置"
echo "  • README.md       - 说明文档"
echo ""
echo "✅ 准备完成！"
echo "📁 文件夹路径: $TEMP_DIR"
echo "📦 压缩包路径: $TEMP_DIR/$ZIP_FILE"

# 保持临时目录，让用户可以下载
echo ""
echo "💡 提示：文件将在会话结束后删除，请及时下载"