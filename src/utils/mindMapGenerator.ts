// 思维导图生成工具
export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  x?: number;
  y?: number;
}

export interface MindMapData {
  title: string;
  nodes: MindMapNode[];
}

// 生成思维导图SVG
export function generateMindMapSVG(data: MindMapData): string {
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 计算节点位置
  const positionedNodes = calculateNodePositions(data.nodes, centerX, centerY);
  
  // 生成SVG内容
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .mind-map-title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #1f2937; text-anchor: middle; }
          .mind-map-node-1 { font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; fill: #2563eb; text-anchor: middle; }
          .mind-map-node-2 { font-family: Arial, sans-serif; font-size: 12px; font-weight: 500; fill: #7c3aed; text-anchor: middle; }
          .mind-map-node-3 { font-family: Arial, sans-serif; font-size: 11px; font-weight: 400; fill: #059669; text-anchor: middle; }
          .mind-map-line { stroke: #6b7280; stroke-width: 2; fill: none; }
          .mind-map-bg-0 { fill: #dbeafe; stroke: #2563eb; stroke-width: 2; }
          .mind-map-bg-1 { fill: #e0e7ff; stroke: #7c3aed; stroke-width: 1.5; }
          .mind-map-bg-2 { fill: #d1fae5; stroke: #059669; stroke-width: 1; }
        </style>
      </defs>
      
      <!-- 背景 -->
      <rect width="${width}" height="${height}" fill="#f9fafb" />
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
    const radius1 = 150;
    
    level1Nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // 从顶部开始
      const x = centerX + Math.cos(angle) * radius1;
      const y = centerY + Math.sin(angle) * radius1;
      positioned.push({ ...node, x, y });
      
      // 第二级子节点
      const level2Nodes = node.children;
      if (level2Nodes.length > 0) {
        const subAngleStep = Math.PI / 3 / Math.max(level2Nodes.length, 1);
        const radius2 = 100;
        
        level2Nodes.forEach((subNode, subIndex) => {
          const subAngle = angle + (subIndex - (level2Nodes.length - 1) / 2) * subAngleStep;
          const subX = x + Math.cos(subAngle) * radius2;
          const subY = y + Math.sin(subAngle) * radius2;
          positioned.push({ ...subNode, x: subX, y: subY });
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
    connections += `<line x1="${centerNode.x}" y1="${centerNode.y}" x2="${node.x}" y2="${node.y}" class="mind-map-line" />`;
    
    // 连接一级节点到二级节点
    nodes.filter(n => n.level === 2 && n.text.includes(node.text.substring(0, 10))).forEach(subNode => {
      connections += `<line x1="${node.x}" y1="${node.y}" x2="${subNode.x}" y2="${subNode.y}" class="mind-map-line" />`;
    });
  });
  
  return connections;
}

// 绘制节点
function drawNodes(nodes: MindMapNode[]): string {
  let nodeElements = '';
  
  nodes.forEach(node => {
    if (!node.x || !node.y) return;
    
    const textLength = node.text.length;
    const padding = 8;
    const charWidth = node.level === 0 ? 10 : node.level === 1 ? 8 : 7;
    const rectWidth = Math.max(textLength * charWidth + padding * 2, 60);
    const rectHeight = node.level === 0 ? 40 : node.level === 1 ? 32 : 24;
    
    // 背景矩形
    nodeElements += `
      <rect 
        x="${node.x - rectWidth / 2}" 
        y="${node.y - rectHeight / 2}" 
        width="${rectWidth}" 
        height="${rectHeight}" 
        rx="6" 
        class="mind-map-bg-${node.level}" 
      />
    `;
    
    // 文本 - 处理长文本换行
    const maxCharsPerLine = node.level === 0 ? 12 : node.level === 1 ? 10 : 8;
    const lines = wrapText(node.text, maxCharsPerLine);
    const lineHeight = node.level === 0 ? 18 : node.level === 1 ? 14 : 12;
    const startY = node.y - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      nodeElements += `
        <text 
          x="${node.x}" 
          y="${startY + index * lineHeight}" 
          class="mind-map-node-${node.level}" 
          dominant-baseline="middle"
        >${escapeXml(line)}</text>
      `;
    });
  });
  
  return nodeElements;
}

// 文本换行
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  
  const words = text.split('');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const char of words) {
    if (currentLine.length + 1 <= maxChars) {
      currentLine += char;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = char;
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
  
  // 中心节点
  nodes.push({
    id: 'center',
    text: title,
    level: 0,
    children: []
  });
  
  // 解析内容生成节点
  let currentLevel1Node: MindMapNode | null = null;
  let nodeId = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 检测标题级别
    if (trimmed.startsWith('##')) {
      // 二级标题 -> 一级节点
      const text = trimmed.replace(/^#+\s*/, '').substring(0, 20);
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('#')) {
      // 一级标题 -> 一级节点
      const text = trimmed.replace(/^#+\s*/, '').substring(0, 20);
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      // 列表项 -> 二级节点
      if (currentLevel1Node) {
        const text = trimmed.replace(/^[-•]\s*/, '').substring(0, 15);
        const childNode = {
          id: `node-${nodeId++}`,
          text,
          level: 2,
          children: []
        };
        currentLevel1Node.children.push(childNode);
        nodes.push(childNode);
      }
    } else if (trimmed.length > 10 && trimmed.length < 50) {
      // 普通段落 -> 一级节点
      const text = trimmed.substring(0, 20);
      currentLevel1Node = {
        id: `node-${nodeId++}`,
        text,
        level: 1,
        children: []
      };
      nodes.push(currentLevel1Node);
    }
  }
  
  // 如果没有解析出子节点，创建默认结构
  if (nodes.length === 1) {
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
    sentences.slice(0, 6).forEach((sentence, index) => {
      const text = sentence.trim().substring(0, 15);
      if (text) {
        nodes.push({
          id: `node-${index + 1}`,
          text,
          level: 1,
          children: []
        });
      }
    });
  }
  
  return {
    title,
    nodes
  };
}