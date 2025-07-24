import axios from 'axios';
import { AnkiCard } from '@/store/useAppStore';

interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: any;
}

interface AnkiConnectResponse {
  result: any;
  error: string | null;
}

class AnkiConnectService {
  private readonly baseUrl = 'http://localhost:8765';
  private readonly version = 6;

  private async makeRequest(action: string, params?: any): Promise<AnkiConnectResponse> {
    const request: AnkiConnectRequest = {
      action,
      version: this.version,
      params
    };

    try {
      const response = await axios.post(this.baseUrl, request, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('无法连接到Anki。请确保Anki正在运行并且已安装AnkiConnect插件。');
        }
        throw new Error(`网络错误: ${error.message}`);
      }
      throw new Error('未知错误');
    }
  }

  // 检查AnkiConnect是否可用
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('version');
      return response.error === null && response.result >= 6;
    } catch (error) {
      return false;
    }
  }

  // 获取所有牌组名称
  async getDeckNames(): Promise<string[]> {
    const response = await this.makeRequest('deckNames');
    if (response.error) {
      throw new Error(`获取牌组失败: ${response.error}`);
    }
    return response.result;
  }

  // 创建新牌组
  async createDeck(deckName: string): Promise<void> {
    const response = await this.makeRequest('createDeck', {
      deck: deckName
    });
    if (response.error) {
      throw new Error(`创建牌组失败: ${response.error}`);
    }
  }

  // 获取模型名称
  async getModelNames(): Promise<string[]> {
    const response = await this.makeRequest('modelNames');
    if (response.error) {
      throw new Error(`获取模型失败: ${response.error}`);
    }
    return response.result;
  }

  // 创建基础模型（如果不存在）
  async createBasicModel(): Promise<void> {
    const modelName = 'AI Anki Converter Basic';
    const models = await this.getModelNames();
    
    if (models.includes(modelName)) {
      return; // 模型已存在
    }

    const response = await this.makeRequest('createModel', {
      modelName,
      inOrderFields: ['Front', 'Back', 'Tags'],
      css: `
.card {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  background-color: white;
  padding: 20px;
  max-width: 100%;
}

/* Headings */
h1 { font-size: 1.5em; font-weight: bold; color: #1f2937; margin-bottom: 1rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem; }
h2 { font-size: 1.25em; font-weight: 600; color: #3b82f6; margin-bottom: 0.75rem; }
h3 { font-size: 1.125em; font-weight: 500; color: #8b5cf6; margin-bottom: 0.5rem; }

/* Text formatting */
strong { font-weight: bold; color: #1e40af; background-color: #dbeafe; padding: 2px 4px; border-radius: 3px; }
em { font-style: italic; color: #8b5cf6; font-weight: 500; }
mark { background-color: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 3px; font-weight: 500; }

/* Code */
code { background-color: #f3f4f6; color: #dc2626; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.875em; border: 1px solid #e5e7eb; }
pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 6px; overflow-x: auto; margin: 1rem 0; border: 1px solid #374151; }
pre code { background: none; color: inherit; padding: 0; border: none; }

/* Lists */
ul, ol { margin: 0.75rem 0; padding-left: 1.5rem; }
li { margin: 0.25rem 0; line-height: 1.5; }

/* Blockquotes */
blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; background-color: #eff6ff; padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; font-style: italic; color: #374151; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 1rem 0; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
th { background-color: #f3f4f6; padding: 0.75rem; text-align: left; font-weight: 600; color: #1f2937; border-bottom: 1px solid #d1d5db; }
td { padding: 0.75rem; color: #374151; border-bottom: 1px solid #e5e7eb; }

/* Links */
a { color: #2563eb; text-decoration: underline; font-weight: 500; }
a:hover { color: #1d4ed8; }
      `,
      cardTemplates: [
        {
          Name: 'Card 1',
          Front: '{{Front}}',
          Back: '{{FrontSide}}<hr id="answer">{{Back}}'
        }
      ]
    });

    if (response.error) {
      throw new Error(`创建模型失败: ${response.error}`);
    }
  }

  // 转换markdown/HTML内容
  private async convertToHtml(content: string): Promise<string> {
    const hasHtmlOrMarkdown = /<[^>]*>|```|\*\*|__|\[.*\]\(.*\)|#{1,6}\s/.test(content);
    
    if (hasHtmlOrMarkdown) {
      // 简单的markdown转换
      let html = content
        // 标题
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // 粗体和斜体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 链接
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
        // 换行
        .replace(/\n/g, '<br>');
      
      return html;
    }
    
    return content.replace(/\n/g, '<br>');
  }

  // 添加单张卡片
  async addNote(card: AnkiCard, deckName: string): Promise<number> {
    const frontHtml = await this.convertToHtml(card.front);
    const backHtml = await this.convertToHtml(card.back);
    
    const response = await this.makeRequest('addNote', {
      note: {
        deckName,
        modelName: 'AI Anki Converter Basic',
        fields: {
          Front: frontHtml,
          Back: backHtml,
          Tags: card.tags.join(' ')
        },
        tags: card.tags
      }
    });

    if (response.error) {
      throw new Error(`添加卡片失败: ${response.error}`);
    }

    return response.result;
  }

  // 批量添加卡片
  async addNotes(cards: AnkiCard[], deckName: string): Promise<{ success: number; failed: number; errors: string[] }> {
    // 确保牌组存在
    const deckNames = await this.getDeckNames();
    if (!deckNames.includes(deckName)) {
      await this.createDeck(deckName);
    }

    // 确保模型存在
    await this.createBasicModel();

    const notes = await Promise.all(
      cards.map(async (card) => {
        const frontHtml = await this.convertToHtml(card.front);
        const backHtml = await this.convertToHtml(card.back);
        
        return {
          deckName,
          modelName: 'AI Anki Converter Basic',
          fields: {
            Front: frontHtml,
            Back: backHtml,
            Tags: card.tags.join(' ')
          },
          tags: card.tags
        };
      })
    );

    const response = await this.makeRequest('addNotes', {
      notes
    });

    if (response.error) {
      throw new Error(`批量添加卡片失败: ${response.error}`);
    }

    const results = response.result;
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    results.forEach((result: number | null, index: number) => {
      if (result === null) {
        failed++;
        errors.push(`卡片 ${index + 1}: 添加失败`);
      } else {
        success++;
      }
    });

    return { success, failed, errors };
  }

  // 同步到Anki
  async sync(): Promise<void> {
    const response = await this.makeRequest('sync');
    if (response.error) {
      throw new Error(`同步失败: ${response.error}`);
    }
  }
}

export const ankiConnectService = new AnkiConnectService();
export default ankiConnectService;