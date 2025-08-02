// 思维导图生成工具
export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  x?: number;
  y?: number;
  color?: string;
}

export interface MindMapData {
  title: string;
  nodes: MindMapNode[];
}

// 生成思维导图SVG
export function generateMindMapSVG(data: MindMapData): string {
  const width = 1000;
  const height = 700;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 计算节点位置
  const positionedNodes = calculateNodePositions(data.nodes, centerX, centerY);
  
  // 生成SVG内容
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .mind-map-title { 
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
            font-size: 18px; 
            font-weight: 600; 
            fill: #1f2937; 
            text-anchor: middle; 
          }
          .mind-map-node-1 { 
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
            font-size: 14px; 
            font-weight: 500; 
            fill: #374151; 
            text-anchor: middle; 
          }
          .mind-map-node-2 { 
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
            font-size: 12px; 
            font-weight: 400; 
            fill: #4b5563; 
            text-anchor: middle; 
          }
          .mind-map-line-purple { stroke: #a855f7; stroke-width: 3; fill: none; stroke-linecap: round; }
          .mind-map-line-blue { stroke: #3b82f6; stroke-width: 3; fill: none; stroke-linecap: round; }
          .mind-map-line-green { stroke: #10b981; stroke-width: 3; fill: none; stroke-linecap: round; }
          .mind-map-line-orange { stroke: #f59e0b; stroke-width: 3; fill: none; stroke-linecap: round; }
          .mind-map-line-red { stroke: #ef4444; stroke-width: 3; fill: none; stroke-linecap: round; }
          .mind-map-line-indigo { stroke: #6366f1; stroke-width: 3; fill: none; stroke-linecap: round; }
          
          .mind-map-bg-center { 
            fill: #ffffff; 
            stroke: #a855f7; 
            stroke-width: 3; 
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
          }
          .mind-map-bg-purple { 
            fill: #faf5ff; 
            stroke: #a855f7; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(168, 85, 247, 0.2));
          }
          .mind-map-bg-blue { 
            fill: #eff6ff; 
            stroke: #3b82f6; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
          }
          .mind-map-bg-green { 
            fill: #ecfdf5; 
            stroke: #10b981; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2));
          }
          .mind-map-bg-orange { 
            fill: #fffbeb; 
            stroke: #f59e0b; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2));
          }
          .mind-map-bg-red { 
            fill: #fef2f2; 
            stroke: #ef4444; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2));
          }
          .mind-map-bg-indigo { 
            fill: #eef2ff; 
            stroke: #6366f1; 
            stroke-width: 2; 
            filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
          }
        </style>
      </defs>
      
      <!-- 背景渐变 -->
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
  `;
  
  // 绘制连接线
  svgContent += drawConnections(positionedNodes);
  
  // 绘制节点
  svgContent += drawNodes(positionedNodes);
  
  svgContent += '</svg>';
  
  return svgContent;
}

// 计算节点位置
function calculateNodePositions(nodes: MindMapNode[], centerX: number, centerY: number): MindMapNode[] {
  const positioned: MindMapNode[] = [];
  
  // 中心节点
  if (nodes.length > 0) {
    const centerNode = { ...nodes[0], x: centerX, y: centerY };
    positioned.push(centerNode);
    
    // 第一级子节点 - 围绕中心分布
    const level1Nodes = nodes.filter(n => n.level === 1);
    const angleStep = (2 * Math.PI) / Math.max(level1Nodes.length, 1);
    const radius1 = 180; // 增加半径，让布局更宽松
    
    level1Nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // 从顶部开始
      const x = centerX + Math.cos(angle) * radius1;
      const y = centerY + Math.sin(angle) * radius1;
      
      // 为每个一级节点分配颜色
      const colorIndex = index % 6;
      const colors = ['purple', 'blue', 'green', 'orange', 'red', 'indigo'];
      const nodeWithColor = { ...node, x, y, color: colors[colorIndex] };
      positioned.push(nodeWithColor);
      
      // 第二级子节点
      const level2Nodes = node.children;
      if (level2Nodes.length > 0) {
        const subAngleStep = Math.PI / 4 / Math.max(level2Nodes.length, 1); // 增加角度范围
        const radius2 = 120; // 增加二级节点半径
        
        level2Nodes.forEach((subNode, subIndex) => {
          const subAngle = angle + (subIndex - (level2Nodes.length - 1) / 2) * subAngleStep;
          const subX = x + Math.cos(subAngle) * radius2;
          const subY = y + Math.sin(subAngle) * radius2;
          const subNodeWithColor = { ...subNode, x: subX, y: subY, color: colors[colorIndex] };
          positioned.push(subNodeWithColor);
        });
      }
    });
  }
  
  return positioned;
}

// 绘制连接线
function drawConnections(nodes: MindMapNode[]): string {
  let connections = '';
  const centerNode = nodes.find(n => n.level === 0);
  
  if (!centerNode) return connections;
  
  // 连接中心节点到一级节点
  nodes.filter(n => n.level === 1).forEach(node => {
    const color = (node as any).color || 'purple';
    // 使用曲线连接，更加优雅
    const midX = (centerNode.x! + node.x!) / 2;
    const midY = (centerNode.y! + node.y!) / 2;
    const controlX = midX + (node.x! - centerNode.x!) * 0.2;
    const controlY = midY + (node.y! - centerNode.y!) * 0.2;
    
    connections += `
      <path d="M ${centerNode.x} ${centerNode.y} Q ${controlX} ${controlY} ${node.x} ${node.y}" 
            class="mind-map-line-${color}" />
    `;
    
    // 连接一级节点到二级节点
    node.children.forEach(subNode => {
      const subNodePositioned = nodes.find(n => n.id === subNode.id);
      if (subNodePositioned) {
        const subMidX = (node.x! + subNodePositioned.x!) / 2;
        const subMidY = (node.y! + subNodePositioned.y!) / 2;
        const subControlX = subMidX + (subNodePositioned.x! - node.x!) * 0.3;
        const subControlY = subMidY + (subNodePositioned.y! - node.y!) * 0.3;
        
        connections += `
          <path d="M ${node.x} ${node.y} Q ${subControlX} ${subControlY} ${subNodePositioned.x} ${subNodePositioned.y}" 
                class="mind-map-line-${color}" />
        `;
      }
    });
  });
  
  return connections;
}

// 绘制节点
function drawNodes(nodes: MindMapNode[]): string {
  let nodeElements = '';
  
  nodes.forEach(node => {
    if (!node.x || !node.y) return;
    
    const textLength = getTextWidth(node.text);
    const padding = node.level === 0 ? 20 : node.level === 1 ? 16 : 12;
    const minWidth = node.level === 0 ? 120 : node.level === 1 ? 80 : 60;
    const rectWidth = Math.max(textLength + padding * 2, minWidth);
    const rectHeight = node.level === 0 ? 50 : node.level === 1 ? 36 : 28;
    const borderRadius = node.level === 0 ? 25 : node.level === 1 ? 18 : 14;
    
    // 确定节点样式类
    let bgClass = 'mind-map-bg-center';
    if (node.level === 1) {
      const color = (node as any).color || 'purple';
      bgClass = `mind-map-bg-${color}`;
    } else if (node.level === 2) {
      const color = (node as any).color || 'purple';
      bgClass = `mind-map-bg-${color}`;
    }
    
    // 背景椭圆形/圆角矩形
    if (node.level === 0) {
      // 中心节点使用椭圆
      nodeElements += `
        <ellipse 
          cx="${node.x}" 
          cy="${node.y}" 
          rx="${rectWidth / 2}" 
          ry="${rectHeight / 2}" 
          class="${bgClass}" 
        />
      `;
    } else {
      // 其他节点使用圆角矩形
      nodeElements += `
        <rect 
          x="${node.x - rectWidth / 2}" 
          y="${node.y - rectHeight / 2}" 
          width="${rectWidth}" 
          height="${rectHeight}" 
          rx="${borderRadius}" 
          ry="${borderRadius}"
          class="${bgClass}" 
        />
      `;
    }
    
    // 文本 - 处理长文本换行
    const maxCharsPerLine = node.level === 0 ? 14 : node.level === 1 ? 12 : 10;
    const lines = wrapText(node.text, maxCharsPerLine);
    const lineHeight = node.level === 0 ? 20 : node.level === 1 ? 16 : 14;
    const startY = node.y - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      const textClass = node.level === 0 ? 'mind-map-title' : `mind-map-node-${node.level}`;
      nodeElements += `
        <text 
          x="${node.x}" 
          y="${startY + index * lineHeight}" 
          class="${textClass}" 
          dominant-baseline="middle"
        >${escapeXml(line)}</text>
      `;
    });
  });
  
  return nodeElements;
}

// 估算文本宽度（中文字符按2个英文字符计算）
function getTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    // 中文字符宽度约为英文字符的1.8倍
    if (/[\u4e00-\u9fff]/.test(char)) {
      width += 14;
    } else {
      width += 8;
    }
  }
  return width;
}

// 文本换行 - 优化中文处理
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  
  const lines: string[] = [];
  let currentLine = '';
  let currentLength = 0;
  
  for (const char of text) {
    // 中文字符按2个字符长度计算
    const charLength = /[\u4e00-\u9fff]/.test(char) ? 2 : 1;
    
    if (currentLength + charLength <= maxChars) {
      currentLine += char;
      currentLength += charLength;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
      currentLength = charLength;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

// XML转义
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 解析文本生成思维导图数据
export function parseTextToMindMap(text: string, title: string): MindMapData {
  const lines = text.split('\n').filter(line => line.trim());
  const nodes: MindMapNode[] = [];
  
  // 提取或使用提供的标题
  let centerTitle = title;
  
  // 如果文本以一级标题开始，使用它作为中心节点
  if (lines.length > 0 && lines[0].trim().startsWith('# ')) {
    centerTitle = lines[0].trim().replace(/^#+\s*/, '');
  }
  
  // 中心节点
  nodes.push({
    id: 'center',
    text: centerTitle.length > 12 ? centerTitle.substring(0, 12) + '...' : centerTitle,
    level: 0,
    children: []
  });
  
  // 解析内容生成节点
  let currentLevel1Node: MindMapNode | null = null;
  let nodeId = 1;
  let skipFirstH1 = false; // 标记是否跳过第一个一级标题
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 检测标题级别
    if (trimmed.startsWith('# ')) {
      // 一级标题 - 如果是第一个且已用作中心节点，则跳过
      if (!skipFirstH1) {
        skipFirstH1 = true;
        continue;
      }
      // 其他一级标题作为一级节点
      const text = trimmed.replace(/^#+\s*/, '');
      const displayText = text.length > 10 ? text.substring(0, 10) + '...' : text;
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text: displayText,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('## ')) {
      // 二级标题 -> 一级节点（主要分类）
      const text = trimmed.replace(/^#+\s*/, '');
      const displayText = text.length > 10 ? text.substring(0, 10) + '...' : text;
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text: displayText,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('### ')) {
      // 三级标题 -> 二级节点（如果有当前一级节点）
      if (currentLevel1Node) {
        const text = trimmed.replace(/^#+\s*/, '');
        const displayText = text.length > 8 ? text.substring(0, 8) + '...' : text;
        const childNode = {
          id: `node-${nodeId++}`,
          text: displayText,
          level: 2,
          children: []
        };
        currentLevel1Node.children.push(childNode);
        nodes.push(childNode);
      }
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      // 列表项 -> 二级节点
      if (currentLevel1Node) {
        const text = trimmed.replace(/^[-•]\s*/, '');
        const displayText = text.length > 8 ? text.substring(0, 8) + '...' : text;
        const childNode = {
          id: `node-${nodeId++}`,
          text: displayText,
          level: 2,
          children: []
        };
        currentLevel1Node.children.push(childNode);
        nodes.push(childNode);
      }
    } else if (trimmed.length > 5 && trimmed.length < 100 && !trimmed.startsWith('#')) {
      // 普通段落 -> 如果没有当前一级节点，创建一个
      if (!currentLevel1Node) {
        const displayText = trimmed.length > 10 ? trimmed.substring(0, 10) + '...' : trimmed;
        currentLevel1Node = {
          id: `node-${nodeId++}`,
          text: displayText,
          level: 1,
          children: []
        };
        nodes.push(currentLevel1Node);
      }
    }
  }
  
  // 如果没有解析出子节点，创建默认结构
  if (nodes.length === 1) {
    // 尝试按句号、感叹号、问号分割
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 3);
    
    if (sentences.length > 1) {
      sentences.slice(0, 6).forEach((sentence, index) => {
        const cleanText = sentence.trim();
        const displayText = cleanText.length > 8 ? cleanText.substring(0, 8) + '...' : cleanText;
        if (displayText && displayText.length > 1) {
          nodes.push({
            id: `node-${index + 1}`,
            text: displayText,
            level: 1,
            children: []
          });
        }
      });
    } else {
      // 如果无法按句子分割，按逗号或空格分割
      const parts = text.split(/[，,\s]+/).filter(s => s.trim().length > 2);
      parts.slice(0, 6).forEach((part, index) => {
        const cleanText = part.trim();
        const displayText = cleanText.length > 8 ? cleanText.substring(0, 8) + '...' : cleanText;
        if (displayText && displayText.length > 1) {
          nodes.push({
            id: `node-${index + 1}`,
            text: displayText,
            level: 1,
            children: []
          });
        }
      });
    }
  }
  
  return {
    title,
    nodes
  };
}