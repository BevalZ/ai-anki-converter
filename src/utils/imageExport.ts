import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { AnkiCard } from '@/store/useAppStore';
import ReactDOM from 'react-dom/client';
import React from 'react';
import CardContent from '@/components/CardContent';

// Type alias for compatibility
type Card = AnkiCard;

// Simple canvas-based image generation without html2canvas dependency
interface CanvasRenderingOptions {
  width: number;
  height: number;
  backgroundColor: string;
  padding: number;
  fontSize: number;
  fontFamily: string;
}

export type ImageFormat = 'png' | 'jpeg' | 'svg';

export interface ImageExportOptions {
  format: ImageFormat;
  quality?: number; // For JPEG format (0-1)
  scale?: number; // Scale factor for resolution
  backgroundColor?: string;
  width?: number; // Canvas width
  height?: number; // Canvas height
}

// Create canvas-based card rendering
function renderCardToCanvas(
  card: Card, 
  isBack: boolean = false, 
  options: CanvasRenderingOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = options.width;
  canvas.height = options.height;
  
  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set font
  ctx.font = `${options.fontSize}px ${options.fontFamily}`;
  ctx.fillStyle = '#1f2937';
  
  const content = isBack ? card.back : card.front;
  const title = isBack ? 'BACK' : 'FRONT';
  
  let y = options.padding;
  
  // Draw title
  ctx.font = `bold ${Math.floor(options.fontSize * 0.8)}px ${options.fontFamily}`;
  ctx.fillStyle = '#6b7280';
  ctx.fillText(title, options.padding, y + options.fontSize);
  y += options.fontSize * 1.5;
  
  // Draw content
  ctx.font = `${options.fontSize}px ${options.fontFamily}`;
  ctx.fillStyle = '#1f2937';
  
  // Simple text wrapping
  const words = content.replace(/<[^>]*>/g, '').split(' ');
  const maxWidth = canvas.width - (options.padding * 2);
  let line = '';
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, options.padding, y + options.fontSize);
      line = word + ' ';
      y += options.fontSize * 1.2;
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    ctx.fillText(line, options.padding, y + options.fontSize);
    y += options.fontSize * 1.5;
  }
  
  // Draw difficulty badge if present
  if (card.difficulty) {
    const badgeText = card.difficulty.toUpperCase();
    const badgeColor = getDifficultyColor(card.difficulty);
    
    ctx.fillStyle = badgeColor;
    const badgeWidth = ctx.measureText(badgeText).width + 16;
    const badgeHeight = options.fontSize + 8;
    
    // Draw badge background
    ctx.fillRect(options.padding, y, badgeWidth, badgeHeight);
    
    // Draw badge text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(options.fontSize * 0.7)}px ${options.fontFamily}`;
    ctx.fillText(badgeText, options.padding + 8, y + badgeHeight - 6);
  }
  
  return canvas;
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'hard': return '#ef4444';
    default: return '#6b7280';
  }
}

// Create SVG representation of a card
function createCardSVG(card: Card, isBack: boolean = false): string {
  const content = isBack ? card.back : card.front;
  const title = isBack ? 'Back' : 'Front';
  const difficultyColor = card.difficulty ? getDifficultyColor(card.difficulty) : '#6b7280';
  
  // Escape HTML entities for SVG
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const escapedContent = escapeHtml(content.replace(/<[^>]*>/g, ''));
  const escapedTitle = escapeHtml(title);
  
  return `
    <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .card-bg { fill: white; stroke: #e5e7eb; stroke-width: 1; }
          .title-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; fill: #6b7280; }
          .content-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; fill: #1f2937; }
          .difficulty-bg { fill: ${difficultyColor}; }
          .difficulty-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; fill: white; }
        </style>
      </defs>
      
      <!-- Card background -->
      <rect x="0" y="0" width="400" height="250" rx="12" class="card-bg" />
      
      <!-- Title -->
      <text x="24" y="40" class="title-text">${escapedTitle.toUpperCase()}</text>
      
      <!-- Content -->
      <foreignObject x="24" y="60" width="352" height="140">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #1f2937; line-height: 1.6; word-wrap: break-word;">
          ${content}
        </div>
      </foreignObject>
      
      <!-- Difficulty badge -->
      ${card.difficulty ? `
        <rect x="24" y="210" width="60" height="24" rx="4" class="difficulty-bg" />
        <text x="54" y="226" text-anchor="middle" class="difficulty-text">${card.difficulty.toUpperCase()}</text>
      ` : ''}
    </svg>
  `;
}

// Create DOM element that matches the website's card style
function createCardElement(card: Card, isBack: boolean = false): HTMLElement {
  const cardElement = document.createElement('div');
  cardElement.style.cssText = `
    width: 400px;
    height: 256px;
    background: ${isBack 
      ? 'linear-gradient(to bottom right, rgb(240, 253, 244), rgb(220, 252, 231))' 
      : 'linear-gradient(to bottom right, rgb(239, 246, 255), rgb(219, 234, 254))'}
    ;
    border: 2px solid ${isBack ? 'rgb(187, 247, 208)' : 'rgb(191, 219, 254)'};
    border-radius: 8px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    text-align: center;
    overflow: auto;
    max-height: 100%;
    width: 100%;
  `;

  const titleElement = document.createElement('div');
  titleElement.style.cssText = `
    font-size: 14px;
    color: ${isBack ? 'rgb(22, 163, 74)' : 'rgb(37, 99, 235)'};
    font-weight: 500;
    margin-bottom: 8px;
  `;
  titleElement.textContent = isBack ? '背面' : '正面';

  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
    color: rgb(17, 24, 39);
    font-size: 18px;
    font-weight: 500;
    word-break: break-words;
    line-height: 1.6;
  `;

  // Handle content rendering
  if (isBack) {
    // For back content, we need to render it similar to CardContent component
    const hasHtmlOrMarkdown = /<[^>]*>|```|\*\*|__|\[.*\]\(.*\)|#{1,6}\s/.test(card.back);
    if (hasHtmlOrMarkdown) {
      // Simple HTML/Markdown rendering for export
      let processedContent = card.back
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: rgb(29, 78, 216); background-color: rgb(239, 246, 255); padding: 2px 4px; border-radius: 4px;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: rgb(147, 51, 234); font-weight: 500;">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background-color: rgb(243, 244, 246); color: rgb(220, 38, 38); padding: 4px 8px; border-radius: 4px; font-size: 14px; font-family: monospace; border: 1px solid rgb(209, 213, 219);">$1</code>')
        .replace(/\n/g, '<br>');
      contentElement.innerHTML = processedContent;
    } else {
      contentElement.textContent = card.back;
    }
  } else {
    contentElement.textContent = card.front;
  }

  contentWrapper.appendChild(titleElement);
  contentWrapper.appendChild(contentElement);
  cardElement.appendChild(contentWrapper);

  return cardElement;
}

// Export single card as image
export async function exportCardAsImage(
  card: Card,
  options: ImageExportOptions = { format: 'png' }
): Promise<void> {
  try {
    if (options.format === 'svg') {
      // Export as SVG
      const frontSVG = createCardSVG(card, false);
      const backSVG = createCardSVG(card, true);
      
      const combinedSVG = `
        <svg width="400" height="520" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 0)">
            ${frontSVG.replace('<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
          </g>
          <g transform="translate(0, 260)">
            ${backSVG.replace('<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
          </g>
        </svg>
      `;
      
      const blob = new Blob([combinedSVG], { type: 'image/svg+xml' });
      saveAs(blob, `${card.front.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.svg`);
      return;
    }

    // Create container for both front and back cards
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 440px;
    `;

    // Create front and back card elements
    const frontCard = createCardElement(card, false);
    const backCard = createCardElement(card, true);
    
    container.appendChild(frontCard);
    container.appendChild(backCard);
    
    // Temporarily add to DOM for rendering
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    try {
      // Generate image using html2canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 440,
        height: 552 // 256 * 2 + 20 (gap) + 20 * 2 (padding)
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${card.front.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.${options.format}`;
          saveAs(blob, filename);
        }
      }, `image/${options.format}`, options.quality || 0.9);
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
    return;

    // Canvas rendering options (fallback)
    const renderOptions: CanvasRenderingOptions = {
      width: options.width || 400,
      height: options.height || 250,
      backgroundColor: options.backgroundColor || '#ffffff',
      padding: 20,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif'
    };

    // Create canvases for front and back
    const frontCanvas = renderCardToCanvas(card, false, renderOptions);
    const backCanvas = renderCardToCanvas(card, true, renderOptions);

    // Create combined canvas
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d')!;
    
    combinedCanvas.width = renderOptions.width;
    combinedCanvas.height = renderOptions.height * 2 + 20; // 20px gap between cards
    
    // Fill background
    ctx.fillStyle = options.backgroundColor || '#f9fafb';
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
    
    // Draw front and back cards
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, 0, renderOptions.height + 20);

    // Convert to blob and download
    combinedCanvas.toBlob((blob) => {
      if (blob) {
        const filename = `${card.front.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.${options.format}`;
        saveAs(blob, filename);
      }
    }, `image/${options.format}`, options.quality || 0.9);

  } catch (error) {
    console.error('Error exporting card as image:', error);
    throw new Error('Failed to export card as image');
  }
}

// Export multiple cards as images
export async function exportCardsAsImages(
  cards: Card[],
  options: ImageExportOptions = { format: 'png' },
  deckName: string = 'anki_cards'
): Promise<void> {
  try {
    if (options.format === 'svg') {
      // Create a combined SVG for all cards
      const cardHeight = 260;
      const totalHeight = cards.length * cardHeight;
      
      let combinedSVG = `<svg width="400" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
      
      cards.forEach((card, index) => {
        const frontSVG = createCardSVG(card, false);
        const backSVG = createCardSVG(card, true);
        const yOffset = index * cardHeight;
        
        combinedSVG += `
          <g transform="translate(0, ${yOffset})">
            ${frontSVG.replace('<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
          </g>
          <g transform="translate(0, ${yOffset + 260})">
            ${backSVG.replace('<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">', '').replace('</svg>', '')}
          </g>
        `;
      });
      
      combinedSVG += '</svg>';
      
      const blob = new Blob([combinedSVG], { type: 'image/svg+xml' });
      saveAs(blob, `${deckName}_${cards.length}.svg`);
      return;
    }

    // Create container for all cards
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 440px;
    `;

    // Create card elements for each card
    cards.forEach(card => {
      const frontCard = createCardElement(card, false);
      const backCard = createCardElement(card, true);
      
      container.appendChild(frontCard);
      container.appendChild(backCard);
      
      // Add separator between cards (except for the last card)
      if (cards.indexOf(card) < cards.length - 1) {
        const separator = document.createElement('div');
        separator.style.cssText = `
          height: 1px;
          background: rgb(229, 231, 235);
          margin: 10px 0;
        `;
        container.appendChild(separator);
      }
    });
    
    // Temporarily add to DOM for rendering
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    try {
      // Calculate total height
      const cardHeight = 256;
      const gap = 20;
      const separatorHeight = 21; // 1px + 10px margin top + 10px margin bottom
      const totalHeight = 40 + (cards.length * (cardHeight * 2 + gap)) + ((cards.length - 1) * separatorHeight);
      
      // Generate image using html2canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 440,
        height: totalHeight
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${deckName}_${cards.length}.${options.format}`;
          saveAs(blob, filename);
        }
      }, `image/${options.format}`, options.quality || 0.9);
    } finally {
      // Clean up
      document.body.removeChild(container);
    }

  } catch (error) {
    console.error('Error exporting cards as images:', error);
    throw new Error('Failed to export cards as images');
  }
}

// Create preview thumbnail for a card
export async function createCardPreview(
  card: Card, 
  options?: { format?: ImageFormat; width?: number; height?: number }
): Promise<string> {
  try {
    const renderOptions: CanvasRenderingOptions = {
      width: options?.width || 200,
      height: options?.height || 150,
      backgroundColor: '#ffffff',
      padding: 12,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif'
    };

    // Create preview canvas (front side only)
    const canvas = renderCardToCanvas(card, false, renderOptions);
    
    return canvas.toDataURL('image/png', 0.8);
  } catch (error) {
    console.error('Error creating card preview:', error);
    return '';
  }
}