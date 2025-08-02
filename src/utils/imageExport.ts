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
    background-color: ${backgroundColor};
    border: 2px solid ${borderColor};
    border-radius: 8px;
    padding: 20px;
    padding-bottom: 24px;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
    position: relative;
    box-sizing: border-box;
    margin: 0;
  `;

  const titleElement = document.createElement('div');
  titleElement.style.cssText = `
    font-size: 14px;
    color: ${isBack ? '#16a34a' : '#2563eb'};
    font-weight: bold;
    margin-bottom: 12px;
    text-align: center;
    font-family: Arial, sans-serif;
    flex-shrink: 0;
  `;
  titleElement.textContent = isBack ? '背面' : '正面';

  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
    color: #111827;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-family: Arial, sans-serif;
    flex: 1;
    min-height: 0;
  `;

  // Handle content rendering with optimized spacing and layout
  if (isBack) {
    // Enhanced processing for back content with basic HTML support
    let processedContent = card.back;
    
    // Check if content has HTML or markdown
    const hasFormatting = /<[^>]*>|```|\*\*|__|\[.*\]\(.*\)|#{1,6}\s/.test(processedContent);
    
    if (hasFormatting) {
      // Create a content container for formatted content
      const formattedContainer = document.createElement('div');
      formattedContainer.style.cssText = `
        width: 100%;
        text-align: left;
        line-height: 1.4;
        font-size: 15px;
      `;
      
      // Optimized HTML/Markdown processing with reduced spacing
      processedContent = processedContent
        // Headers with reduced margins
        .replace(/^### (.*$)/gm, '<h3 style="font-size: 15px; font-weight: 600; color: #8b5cf6; margin: 6px 0 3px 0;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="font-size: 16px; font-weight: 600; color: #2563eb; margin: 8px 0 4px 0;">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 style="font-size: 17px; font-weight: bold; color: #111827; margin: 8px 0 4px 0; border-bottom: 2px solid #2563eb; padding-bottom: 2px;">$1</h1>')
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #1e40af; background-color: #dbeafe; padding: 1px 3px; border-radius: 2px;">$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #8b5cf6; font-weight: 500;">$1</em>')
        // Inline code
        .replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; color: #dc2626; padding: 1px 4px; border-radius: 2px; font-family: monospace; font-size: 13px; border: 1px solid #e5e7eb;">$1</code>')
        // Code blocks with reduced padding
        .replace(/```[\s\S]*?```/g, (match) => {
          const codeContent = match.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          return `<pre style="background-color: #1f2937; color: #f9fafb; padding: 8px; border-radius: 4px; margin: 4px 0; font-family: monospace; font-size: 12px; line-height: 1.3; overflow-x: auto;">${codeContent}</pre>`;
        })
        // Lists with reduced spacing
        .replace(/^- (.*$)/gm, '<li style="margin: 1px 0; line-height: 1.3;">$1</li>')
        .replace(/(<li.*?<\/li>\s*)+/g, '<ul style="margin: 3px 0; padding-left: 16px;">$&</ul>')
        // Blockquotes with reduced padding
        .replace(/^> (.*$)/gm, '<blockquote style="border-left: 3px solid #3b82f6; padding-left: 8px; margin: 4px 0; background-color: #eff6ff; padding: 4px 8px; border-radius: 0 4px 4px 0; font-style: italic; color: #374151; font-size: 14px;">$1</blockquote>')
        // Optimized line breaks - reduce double spacing
        .replace(/\n\n/g, '<div style="height: 6px;"></div>')
        .replace(/\n/g, '<br>');
      
      formattedContainer.innerHTML = processedContent;
      contentElement.appendChild(formattedContainer);
    } else {
      // Plain text content - center align for simple content
      contentElement.style.textAlign = 'center';
      contentElement.style.display = 'flex';
      contentElement.style.alignItems = 'center';
      contentElement.style.justifyContent = 'center';
      contentElement.textContent = processedContent;
    }
  } else {
    // Front content is always simple text - center aligned
    contentElement.style.textAlign = 'center';
    contentElement.style.display = 'flex';
    contentElement.style.alignItems = 'center';
    contentElement.style.justifyContent = 'center';
    contentElement.textContent = card.front;
  }

  cardElement.appendChild(titleElement);
  cardElement.appendChild(contentElement);

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

// Export multiple cards as images (each card as separate image in ZIP)
export async function exportCardsAsImages(
  cards: Card[],
  options: ImageExportOptions = { format: 'png' },
  deckName: string = 'anki_cards'
): Promise<void> {
  try {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Process each card individually
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      try {
        // Generate image for this card
        const imageBlob = await generateSingleCardImage(card, options);
        
        if (imageBlob) {
          // Create filename for this card
          const cardName = card.front.substring(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
          const filename = `${String(i + 1).padStart(3, '0')}_${cardName}.${options.format}`;
          
          // Add to ZIP
          zip.file(filename, imageBlob);
        }
      } catch (error) {
        console.error(`Failed to export card ${i + 1}:`, error);
        // Continue with other cards even if one fails
      }
    }
    
    // Generate and download ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFilename = `${deckName}_${cards.length}_cards.zip`;
    saveAs(zipBlob, zipFilename);

  } catch (error) {
    console.error('Error exporting cards as images:', error);
    throw new Error('Failed to export cards as images');
  }
}

// Helper function to generate image for a single card
async function generateSingleCardImage(
  card: Card,
  options: ImageExportOptions
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      if (options.format === 'svg') {
        // Generate SVG for single card
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
        resolve(blob);
        return;
      }

      // Create container for single card (front and back)
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
      
      // Add to DOM temporarily
      container.style.position = 'fixed';
      container.style.left = '0px';
      container.style.top = '0px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);

      // Wait for rendering then capture
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            removeContainer: false,
            foreignObjectRendering: false
          });

          canvas.toBlob((blob) => {
            // Clean up DOM
            document.body.removeChild(container);
            resolve(blob);
          }, `image/${options.format}`, options.quality || 0.9);
        } catch (error) {
          // Clean up DOM on error
          document.body.removeChild(container);
          console.error('Error generating single card image:', error);
          resolve(null);
        }
      }, 300);

    } catch (error) {
      console.error('Error in generateSingleCardImage:', error);
      resolve(null);
    }
  });
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