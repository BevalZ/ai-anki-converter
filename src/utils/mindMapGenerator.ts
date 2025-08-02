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
  // 预计算实际需要的尺寸
  const { actualWidth, actualHeight } = calculateActualSize(data.nodes);
  const width = Math.max(1400, actualWidth + 200); // 增加边距
  const height = Math.max(1000, actualHeight + 200); // 增加边距
  
  // 计算节点位置 - 使用新的左右展开布局
  const positionedNodes = calculateHorizontalLayout(data.nodes, width, height);
  
  // 生成SVG内容
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <style>
          .mind-map-title { 
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; 
            font-size: 16px; 
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
            font-size: 13px; 
            font-weight: 400; 
            fill: #4b5563; 
            text-anchor: middle; 
          }
          .mind-map-line-purple { stroke: #a855f7; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          .mind-map-line-blue { stroke: #3b82f6; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          .mind-map-line-green { stroke: #10b981; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          .mind-map-line-orange { stroke: #f59e0b; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          .mind-map-line-red { stroke: #ef4444; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          .mind-map-line-indigo { stroke: #6366f1; stroke-width: 2.5; fill: none; stroke-linecap: round; }
          
          .mind-map-bg-center { 
            fill: #ffffff; 
            stroke: #6366f1; 
            stroke-width: 3; 
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
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
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
  `;
  
  // 绘制连接线
  svgContent += drawHorizontalConnections(positionedNodes);
  
  // 绘制节点
  svgContent += drawHorizontalNodes(positionedNodes);
  
  svgContent += '</svg>';
  
  return svgContent;
}

// 计算实际需要的画布尺寸
function calculateActualSize(nodes: MindMapNode[]): { actualWidth: number; actualHeight: number } {
  const level1Nodes = nodes.filter(n => n.level === 1);
  
  // 计算高度需求
  const nodeHeights = level1Nodes.map(node => {
    const level2Count = node.children.length;
    const level2Height = level2Count > 0 ? level2Count * 80 + (level2Count - 1) * 15 : 0;
    return Math.max(60, level2Height);
  });
  
  const totalHeight = nodeHeights.reduce((sum, h) => sum + h, 0) + (level1Nodes.length - 1) * 40;
  
  // 计算宽度需求 - 基于最长的文本
  let maxWidth = 800; // 基础宽度
  nodes.forEach(node => {
    const textWidth = getTextWidth(node.text);
    if (node.level === 2) {
      maxWidth = Math.max(maxWidth, 120 + 250 + 250 + textWidth + 100); // 中心 + 一级 + 二级 + 文本 + 边距
    }
  });
  
  return {
    actualWidth: maxWidth,
    actualHeight: Math.max(800, totalHeight)
  };
}

// 计算水平布局节点位置 - 优化重叠问题
function calculateHorizontalLayout(nodes: MindMapNode[], width: number, height: number): MindMapNode[] {
  const positioned: MindMapNode[] = [];
  const colors = ['purple', 'blue', 'green', 'orange', 'red', 'indigo'];
  
  if (nodes.length === 0) return positioned;
  
  // 中心节点位置
  const centerX = 120;
  const centerY = height / 2;
  const centerNode = { ...nodes[0], x: centerX, y: centerY };
  positioned.push(centerNode);
  
  // 获取一级节点
  const level1Nodes = nodes.filter(n => n.level === 1);
  if (level1Nodes.length === 0) return positioned;
  
  // 预计算所有节点的高度需求 - 增加间距
  const nodeHeights = level1Nodes.map(node => {
    const level2Count = node.children.length;
    // 每个二级节点至少需要80px高度，加上间距
    const level2Height = level2Count > 0 ? level2Count * 80 + (level2Count - 1) * 15 : 0;
    // 一级节点本身需要60px高度
    return Math.max(60, level2Height);
  });
  
  // 计算总高度需求
  const totalHeight = nodeHeights.reduce((sum, h) => sum + h, 0) + (level1Nodes.length - 1) * 40;
  
  // 计算起始Y位置，确保居中
  let currentY = centerY - totalHeight / 2;
  const level1X = centerX + 250; // 增加间距
  
  level1Nodes.forEach((node, index) => {
    const colorIndex = index % colors.length;
    const color = colors[colorIndex];
    
    // 一级节点Y位置
    const nodeHeight = nodeHeights[index];
    const y = currentY + nodeHeight / 2;
    
    const level1Node = { ...node, x: level1X, y, color };
    positioned.push(level1Node);
    
    // 处理二级节点
    const level2Nodes = node.children;
    if (level2Nodes.length > 0) {
      const level2X = level1X + 250; // 增加间距
      const level2TotalHeight = level2Nodes.length * 80 + (level2Nodes.length - 1) * 15;
      let level2CurrentY = y - level2TotalHeight / 2;
      
      level2Nodes.forEach((subNode, subIndex) => {
        const subY = level2CurrentY + 40; // 40是节点中心位置
        const level2Node = { ...subNode, x: level2X, y: subY, color };
        positioned.push(level2Node);
        
        level2CurrentY += 95; // 80px节点高度 + 15px间距
      });
    }
    
    // 移动到下一个一级节点位置
    currentY += nodeHeight + 40; // 40px间距
  });
  
  return positioned;
}

// 绘制水平布局的连接线
function drawHorizontalConnections(nodes: MindMapNode[]): string {
  let connections = '';
  const centerNode = nodes.find(n => n.level === 0);
  
  if (!centerNode) return connections;
  
  // 连接中心节点到一级节点
  nodes.filter(n => n.level === 1).forEach(node => {
    const color = (node as any).color || 'purple';
    
    // 使用水平贝塞尔曲线
    const controlX1 = centerNode.x! + (node.x! - centerNode.x!) * 0.6;
    const controlY1 = centerNode.y!;
    const controlX2 = centerNode.x! + (node.x! - centerNode.x!) * 0.4;
    const controlY2 = node.y!;
    
    connections += `
      <path d="M ${centerNode.x} ${centerNode.y} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${node.x} ${node.y}" 
            class="mind-map-line-${color}" />
    `;
    
    // 连接一级节点到二级节点
    node.children.forEach(subNode => {
      const subNodePositioned = nodes.find(n => n.id === subNode.id);
      if (subNodePositioned) {
        const subControlX1 = node.x! + (subNodePositioned.x! - node.x!) * 0.6;
        const subControlY1 = node.y!;
        const subControlX2 = node.x! + (subNodePositioned.x! - node.x!) * 0.4;
        const subControlY2 = subNodePositioned.y!;
        
        connections += `
          <path d="M ${node.x} ${node.y} C ${subControlX1} ${subControlY1} ${subControlX2} ${subControlY2} ${subNodePositioned.x} ${subNodePositioned.y}" 
                class="mind-map-line-${color}" />
        `;
      }
    });
  });
  
  return connections;
}

// 绘制水平布局的节点 - 优化尺寸计算
function drawHorizontalNodes(nodes: MindMapNode[]): string {
  let nodeElements = '';
  
  nodes.forEach(node => {
    if (!node.x || !node.y) return;
    
    // 根据节点层级调整换行参数 - 允许更多字符显示
    const maxCharsPerLine = node.level === 0 ? 12 : node.level === 1 ? 10 : 12; // 二级节点允许更多字符
    const lines = smartWrapText(node.text, maxCharsPerLine);
    const lineHeight = node.level === 0 ? 22 : node.level === 1 ? 20 : 18;
    
    // 计算节点尺寸 - 更精确的计算，允许更大的节点
    const maxLineWidth = Math.max(...lines.map(line => getTextWidth(line)));
    const padding = node.level === 0 ? 32 : node.level === 1 ? 28 : 24;
    const minWidth = node.level === 0 ? 140 : node.level === 1 ? 120 : 160; // 二级节点最小宽度增加
    
    // 确保宽度足够容纳文本
    const rectWidth = Math.max(maxLineWidth + padding * 2, minWidth);
    
    // 高度根据行数动态调整
    const textHeight = lines.length * lineHeight;
    const minHeight = node.level === 0 ? 70 : node.level === 1 ? 60 : 50;
    const rectHeight = Math.max(textHeight + padding, minHeight);
    
    const borderRadius = node.level === 0 ? 30 : node.level === 1 ? 25 : 20;
    
    // 确定节点样式类
    let bgClass = 'mind-map-bg-center';
    if (node.level === 1) {
      const color = (node as any).color || 'purple';
      bgClass = `mind-map-bg-${color}`;
    } else if (node.level === 2) {
      const color = (node as any).color || 'purple';
      bgClass = `mind-map-bg-${color}`;
    }
    
    // 绘制节点背景
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
    
    // 绘制文本 - 垂直居中
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

// 智能文本换行 - 优化中文处理和断词策略，避免不合理换行
function smartWrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [''];
  
  // 计算实际显示长度
  const displayLength = getTextDisplayLength(text);
  
  // 如果文本长度合适，直接返回
  if (displayLength <= maxCharsPerLine * 2) return [text];
  
  // 优先尝试在合适的位置断行
  const breakPoints = [
    /([，。！？；：、])/g,  // 中文标点
    /([,\.!?;:])/g,        // 英文标点
    /(\s+)/g,              // 空格
    /([\u4e00-\u9fff])(?=[\u4e00-\u9fff])/g  // 中文字符间
  ];
  
  let bestLines: string[] = [];
  let bestScore = Infinity;
  
  // 尝试不同的断行策略
  for (const breakPattern of breakPoints) {
    const lines = tryBreakText(text, maxCharsPerLine, breakPattern);
    const score = evaluateBreakQuality(lines, maxCharsPerLine);
    
    if (score < bestScore) {
      bestScore = score;
      bestLines = lines;
    }
  }
  
  // 如果所有策略都不理想，使用强制断行
  if (bestLines.length === 0 || bestScore > 100) {
    bestLines = forceWrapLongText(text, maxCharsPerLine);
  }
  
  // 后处理：合并过短的行
  return mergeShortLines(bestLines, maxCharsPerLine);
}

// 尝试按指定模式断行
function tryBreakText(text: string, maxCharsPerLine: number, breakPattern: RegExp): string[] {
  const parts = text.split(breakPattern).filter(part => part.length > 0);
  const lines: string[] = [];
  let currentLine = '';
  let currentLength = 0;
  
  for (const part of parts) {
    const partLength = getTextDisplayLength(part);
    
    if (currentLength + partLength <= maxCharsPerLine * 2) {
      currentLine += part;
      currentLength += partLength;
    } else {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      if (partLength > maxCharsPerLine * 2) {
        // 部分太长，需要进一步分割
        const subLines = forceWrapLongText(part, maxCharsPerLine);
        lines.push(...subLines.slice(0, -1));
        currentLine = subLines[subLines.length - 1];
        currentLength = getTextDisplayLength(currentLine);
      } else {
        currentLine = part;
        currentLength = partLength;
      }
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

// 评估断行质量（分数越低越好）
function evaluateBreakQuality(lines: string[], maxCharsPerLine: number): number {
  let score = 0;
  
  for (const line of lines) {
    const length = getTextDisplayLength(line);
    
    // 惩罚过短的行（少于3个字符）
    if (length < 6) {
      score += 50;
    }
    
    // 惩罚过长的行
    if (length > maxCharsPerLine * 2) {
      score += 30;
    }
    
    // 奖励长度适中的行
    if (length >= maxCharsPerLine && length <= maxCharsPerLine * 1.8) {
      score -= 10;
    }
  }
  
  // 惩罚行数过多
  if (lines.length > 3) {
    score += (lines.length - 3) * 20;
  }
  
  return score;
}

// 合并过短的行
function mergeShortLines(lines: string[], maxCharsPerLine: number): string[] {
  if (lines.length <= 1) return lines;
  
  const merged: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    let currentLine = lines[i];
    let currentLength = getTextDisplayLength(currentLine);
    
    // 尝试合并下一行
    while (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextLength = getTextDisplayLength(nextLine);
      
      // 如果当前行很短，或者合并后不会太长，则合并
      if (currentLength < 6 || (currentLength + nextLength <= maxCharsPerLine * 2)) {
        currentLine += nextLine;
        currentLength += nextLength;
        i++;
      } else {
        break;
      }
    }
    
    merged.push(currentLine);
    i++;
  }
  
  return merged;
}

// 强制换行长文本
function forceWrapLongText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let currentLength = 0;
  
  for (const char of text) {
    const charLength = /[\u4e00-\u9fff]/.test(char) ? 2 : 1;
    
    if (currentLength + charLength <= maxCharsPerLine * 2) {
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

// 获取文本显示长度（中文字符按2计算）
function getTextDisplayLength(text: string): number {
  let length = 0;
  for (const char of text) {
    length += /[\u4e00-\u9fff]/.test(char) ? 2 : 1;
  }
  return length;
}

// 文本换行 - 保持向后兼容
function wrapText(text: string, maxChars: number): string[] {
  return smartWrapText(text, maxChars);
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
  
  // 中心节点 - 不截断文本
  nodes.push({
    id: 'center',
    text: centerTitle,
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
      // 其他一级标题作为一级节点 - 不截断文本
      const text = trimmed.replace(/^#+\s*/, '');
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text: text,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('## ')) {
      // 二级标题 -> 一级节点（主要分类） - 不截断文本
      const text = trimmed.replace(/^#+\s*/, '');
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text: text,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('### ')) {
      // 三级标题 -> 二级节点（如果有当前一级节点） - 不截断文本
      if (currentLevel1Node) {
        const text = trimmed.replace(/^#+\s*/, '');
        const childNode = {
          id: `node-${nodeId++}`,
          text: text,
          level: 2,
          children: []
        };
        currentLevel1Node.children.push(childNode);
        nodes.push(childNode);
      }
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      // 列表项 -> 二级节点 - 不截断文本
      if (currentLevel1Node) {
        const text = trimmed.replace(/^[-•]\s*/, '');
        const childNode = {
          id: `node-${nodeId++}`,
          text: text,
          level: 2,
          children: []
        };
        currentLevel1Node.children.push(childNode);
        nodes.push(childNode);
      }
    } else if (trimmed.length > 5 && trimmed.length < 200 && !trimmed.startsWith('#')) {
      // 普通段落 -> 如果没有当前一级节点，创建一个 - 不截断文本
      if (!currentLevel1Node) {
        currentLevel1Node = {
          id: `node-${nodeId++}`,
          text: trimmed,
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