import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.length >= 10 && /^[a-zA-Z0-9-_]+$/.test(apiKey);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function unescapeHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Language detection utility
export function detectLanguage(text: string): string {
  // Remove extra whitespace and get a sample of the text
  const sample = text.trim().substring(0, 500);
  
  // Chinese characters (including Traditional and Simplified)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf]/;
  
  // Japanese characters (Hiragana, Katakana, Kanji)
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/;
  
  // Korean characters
  const koreanRegex = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/;
  
  // Arabic characters
  const arabicRegex = /[\u0600-\u06ff\u0750-\u077f]/;
  
  // Russian/Cyrillic characters
  const russianRegex = /[\u0400-\u04ff]/;
  
  // Spanish specific characters and patterns
  const spanishRegex = /[ñáéíóúü¿¡]/i;
  
  // French specific characters
  const frenchRegex = /[àâäéèêëïîôöùûüÿç]/i;
  
  // German specific characters
  const germanRegex = /[äöüß]/i;
  
  // Italian specific characters
  const italianRegex = /[àèéìíîòóù]/i;
  
  // Portuguese specific characters
  const portugueseRegex = /[ãõáàâéêíóôúç]/i;
  
  // Hindi/Devanagari characters
  const hindiRegex = /[\u0900-\u097f]/;
  
  // Count character occurrences
  const chineseCount = (sample.match(chineseRegex) || []).length;
  const japaneseHiragana = (sample.match(/[\u3040-\u309f]/) || []).length;
  const japaneseKatakana = (sample.match(/[\u30a0-\u30ff]/) || []).length;
  const koreanCount = (sample.match(koreanRegex) || []).length;
  const arabicCount = (sample.match(arabicRegex) || []).length;
  const russianCount = (sample.match(russianRegex) || []).length;
  const hindiCount = (sample.match(hindiRegex) || []).length;
  
  // Check for specific language patterns
  if (chineseCount > 0 && japaneseHiragana === 0 && japaneseKatakana === 0) {
    return 'Chinese';
  }
  
  if (japaneseHiragana > 0 || japaneseKatakana > 0) {
    return 'Japanese';
  }
  
  if (koreanCount > 0) {
    return 'Korean';
  }
  
  if (arabicCount > 0) {
    return 'Arabic';
  }
  
  if (russianCount > 0) {
    return 'Russian';
  }
  
  if (hindiCount > 0) {
    return 'Hindi';
  }
  
  // For Latin-based languages, check for specific patterns
  if (spanishRegex.test(sample)) {
    return 'Spanish';
  }
  
  if (frenchRegex.test(sample)) {
    return 'French';
  }
  
  if (germanRegex.test(sample)) {
    return 'German';
  }
  
  if (italianRegex.test(sample)) {
    return 'Italian';
  }
  
  if (portugueseRegex.test(sample)) {
    return 'Portuguese';
  }
  
  // Default to English if no specific language detected
  return 'English';
}