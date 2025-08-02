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
  
  // Use solid colors instead of gradients for better html2canvas compatibility
  const backgroundColor = isBack ? '#f0fdf4' : '#eff6ff';
  const borderColor = isBack ? '#bbf7d0' : '#bfdbfe';
  
  cardElement.style.cssText = `
    width: 400px;
    min-height: 256px;
    background-color: ${backgroundColor};
    border: 2px solid ${borderColor};
    border-radius: 8px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
    position: relative;
    box-sizing: border-box;
    margin: 0;
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    text-align: center;
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.6;
  `;

  const titleElement = document.createElement('div');
  titleElement.style.cssText = `
    font-size: 14px;
    color: ${isBack ? '#16a34a' : '#2563eb'};
    font-weight: bold;
    margin-bottom: 12px;
    font-family: Arial, sans-serif;
  `;
  titleElement.textContent = isBack ? '背面' : '正面';

  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
    color: #111827;
    font-size: 18px;
    font-weight: 500;
    word-break: break-words;
    line-height: 1.6;
    font-family: Arial, sans-serif;
  `;

  // Handle content rendering - simplified for better html2canvas compatibility
  if (isBack) {
    // Simple text processing for back content
    let processedContent = card.back
      // Remove HTML tags for now
      .replace(/<[^>]*>/g, '')
      // Convert markdown to plain text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
      })
      // Convert line breaks
      .replace(/\n/g, ' ')
      .trim();
    
    contentElement.textContent = processedContent;
  } else {
    // Front content is always simple text
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
      display: block;
      width: 440px;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    `;

    // Create front and back card elements
    const frontCard = createCardElement(card, false);
    const backCard = createCardElement(card, true);
    
    // Add some spacing between cards
    frontCard.style.marginBottom = '20px';
    
    container.appendChild(frontCard);
    container.appendChild(backCard);
    
    // Add to DOM in a visible location temporarily
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    try {
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate image using html2canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 1, // Reduce scale to avoid issues
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
        removeContainer: false,
        foreignObjectRendering: false // Disable foreign object rendering
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
      box-sizing: border-box;
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
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    try {
      // Wait for content to render and calculate actual dimensions
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const actualHeight = container.scrollHeight;
      const actualWidth = container.scrollWidth;
      
      // Make sure container is visible for html2canvas
      container.style.position = 'static';
      container.style.left = 'auto';
      container.style.top = 'auto';
      container.style.zIndex = 'auto';
      
      // Generate image using html2canvas with dynamic dimensions
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: actualWidth,
        height: actualHeight,
        logging: false,
        removeContainer: false
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