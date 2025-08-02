import axios from 'axios';
import { AnkiCard, LLMProvider } from '@/store/useAppStore';
import { detectLanguage } from '@/lib/utils';

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface GenerateCardsOptions {
  text: string;
  cardType: 'basic' | 'cloze' | 'definition';
  difficulty: 'easy' | 'medium' | 'hard';
  maxCards: number;
}

class AIService {
  private async makeRequest(
    provider: LLMProvider,
    prompt: string,
    model?: string
  ): Promise<AIResponse> {
    try {
      if (!provider.apiKey) {
        throw new Error('API key not configured for this provider');
      }

      const selectedModel = model || provider.selectedModel || provider.models[0];
      if (!selectedModel) {
        throw new Error('No models available for this provider');
      }

      let response;
      
      // Handle different provider APIs
      if (provider.id === 'openai' || provider.baseUrl.includes('openai')) {
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else if (provider.id === 'anthropic' || provider.baseUrl.includes('anthropic')) {
        response = await axios.post(
          `${provider.baseUrl}/messages`,
          {
            model: selectedModel,
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          {
            headers: {
              'x-api-key': provider.apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.content[0].text
        };
      } else if (provider.id === 'google' || provider.baseUrl.includes('googleapis')) {
        response = await axios.post(
          `${provider.baseUrl}/models/${selectedModel}:generateContent?key=${provider.apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.candidates[0].content.parts[0].text
        };
      } else if (provider.id === 'deepseek') {
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else if (provider.id === 'grok') {
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else if (provider.id === 'siliconflow') {
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else if (provider.id === 'ollama') {
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: false
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      } else {
        // Generic OpenAI-compatible API
        response = await axios.post(
          `${provider.baseUrl}/chat/completions`,
          {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return {
          success: true,
          data: response.data.choices[0].message.content
        };
      }
    } catch (error: any) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Unknown error occurred'
      };
    }
  }

  async summarizeText(provider: LLMProvider, text: string): Promise<AIResponse> {
    const detectedLanguage = detectLanguage(text);
    const prompt = `Please provide a concise summary of the following text. Focus on the key points and main ideas. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

${text}

Summary:`;
    
    return this.makeRequest(provider, prompt);
  }

  async rearrangeContent(provider: LLMProvider, text: string): Promise<AIResponse> {
    const detectedLanguage = detectLanguage(text);
    
    const prompt = detectedLanguage === 'zh' 
      ? `请分析以下文本内容，将其重新整理为有层次感和逻辑性的结构化内容，便于后续生成思维导图。

文本内容：
${text}

请按照以下要求整理内容：

1. **识别核心主题**：提取文本的核心主题作为标题
2. **分层组织**：将内容按逻辑关系分为2-4个主要类别
3. **细化要点**：每个类别下包含2-5个具体要点
4. **使用标准格式**：
   - 使用 # 表示核心主题（一级标题）
   - 使用 ## 表示主要类别（二级标题）
   - 使用 - 表示具体要点（列表项）

输出格式示例：
# 核心主题

## 第一个主要类别
- 具体要点1
- 具体要点2
- 具体要点3

## 第二个主要类别
- 具体要点1
- 具体要点2

## 第三个主要类别
- 具体要点1
- 具体要点2
- 具体要点3

要求：
- 保持逻辑清晰，层次分明
- 每个要点简洁明了，便于理解
- 确保内容完整性，不遗漏重要信息
- 适合后续生成思维导图的结构

请直接输出整理后的内容，不要其他解释：`
      : `Please analyze the following text content and reorganize it into a structured format with clear hierarchy and logic, suitable for subsequent mind map generation.

Text content:
${text}

Please organize the content according to the following requirements:

1. **Identify core theme**: Extract the core theme of the text as the title
2. **Hierarchical organization**: Organize content into 2-4 main categories based on logical relationships
3. **Detailed points**: Include 2-5 specific points under each category
4. **Use standard format**:
   - Use # for core theme (level 1 heading)
   - Use ## for main categories (level 2 headings)
   - Use - for specific points (list items)

Output format example:
# Core Theme

## First Main Category
- Specific point 1
- Specific point 2
- Specific point 3

## Second Main Category
- Specific point 1
- Specific point 2

## Third Main Category
- Specific point 1
- Specific point 2
- Specific point 3

Requirements:
- Maintain clear logic and distinct hierarchy
- Each point should be concise and easy to understand
- Ensure content completeness without missing important information
- Structure suitable for subsequent mind map generation

Please output the organized content directly without other explanations:`;
    
    const response = await this.makeRequest(provider, prompt);
    
    if (response.success && response.data) {
      try {
        // 解析结构化内容，提取知识点
        const content = response.data.trim();
        const lines = content.split('\n').filter(line => line.trim());
        const points: string[] = [];
        
        // 提取所有的二级标题和列表项作为知识点
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('## ')) {
            // 二级标题作为主要知识点
            points.push(trimmed.replace('## ', ''));
          } else if (trimmed.startsWith('- ')) {
            // 列表项作为具体知识点
            points.push(trimmed.replace('- ', ''));
          }
        }
        
        return {
          success: true,
          data: {
            points: points,
            count: points.length,
            structuredContent: content // 保存完整的结构化内容
          }
        };
      } catch (parseError) {
        console.error('Failed to parse structured content:', parseError);
        // 如果解析失败，返回原始内容
        return {
          success: true,
          data: {
            points: [response.data],
            count: 1,
            structuredContent: response.data
          }
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to rearrange content'
    };
  }

  async generateCards(provider: LLMProvider, options: GenerateCardsOptions): Promise<AIResponse> {
    const { text, cardType, difficulty, maxCards } = options;
    const detectedLanguage = detectLanguage(text);
    
    let prompt = '';
    
    switch (cardType) {
      case 'basic':
        prompt = `Create ${maxCards} flashcards from the following text. Each card should have a clear question and answer. Format as JSON array with objects containing "front" (question) and "back" (answer) fields. Difficulty level: ${difficulty}. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

For the "back" field, please use HTML/Markdown formatting to make the content more visually appealing:
- Use **bold** for important terms
- Use *italic* for emphasis
- Use \`code\` for technical terms or code snippets
- Use \`\`\`language\ncode block\n\`\`\` for longer code examples
- Use bullet points with - for lists
- Use > for important quotes or highlights
- Use ### for section headers when appropriate

Text:
${text}

Flashcards (JSON format):`;
        break;
        
      case 'cloze':
        prompt = `Create ${maxCards} cloze deletion flashcards from the following text. Replace key terms with {{c1::term}} format. Format as JSON array with objects containing "front" (text with cloze deletions) and "back" (complete text) fields. Difficulty level: ${difficulty}. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

For the "back" field, please use HTML/Markdown formatting to make the content more visually appealing:
- Use **bold** for important terms
- Use *italic* for emphasis
- Use \`code\` for technical terms or code snippets
- Use \`\`\`language\ncode block\n\`\`\` for longer code examples
- Use bullet points with - for lists
- Use > for important quotes or highlights
- Use ### for section headers when appropriate

Text:
${text}

Cloze cards (JSON format):`;
        break;
        
      case 'definition':
        prompt = `Create ${maxCards} definition flashcards from the following text. Each card should have a term on the front and its definition on the back. Format as JSON array with objects containing "front" (term) and "back" (definition) fields. Difficulty level: ${difficulty}. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

For the "back" field, please use HTML/Markdown formatting to make the content more visually appealing:
- Use **bold** for important terms
- Use *italic* for emphasis
- Use \`code\` for technical terms or code snippets
- Use \`\`\`language\ncode block\n\`\`\` for longer code examples
- Use bullet points with - for lists
- Use > for important quotes or highlights
- Use ### for section headers when appropriate

Text:
${text}

Definition cards (JSON format):`;
        break;
    }
    
    const response = await this.makeRequest(provider, prompt);
    
    if (response.success && response.data) {
      try {
        // Extract JSON from the response
        const jsonMatch = response.data.match(/\[.*\]/s);
        if (jsonMatch) {
          const cardsData = JSON.parse(jsonMatch[0]);
          const cards: AnkiCard[] = cardsData.map((card: any, index: number) => ({
            id: `${Date.now()}-${index}`,
            front: card.front || '',
            back: card.back || '',
            type: cardType,
            difficulty,
            tags: [],
            createdAt: new Date()
          }));
          
          return {
            success: true,
            data: cards
          };
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response into cards'
        };
      }
    }
    
    return response;
  }

  async enhanceCard(provider: LLMProvider, card: AnkiCard): Promise<AIResponse> {
    const detectedLanguage = detectLanguage(card.front + ' ' + card.back);
    const prompt = `Please improve this flashcard by making it clearer, more engaging, and educationally effective. Maintain the same format but enhance the content. IMPORTANT: Please respond in ${detectedLanguage} language to match the card's language.

Front: ${card.front}
Back: ${card.back}
Type: ${card.type}
Difficulty: ${card.difficulty}

Improved card (JSON format with "front" and "back" fields):`;
    
    const response = await this.makeRequest(provider, prompt);
    
    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\{.*\}/s);
        if (jsonMatch) {
          const enhancedCard = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: {
              front: enhancedCard.front || card.front,
              back: enhancedCard.back || card.back
            }
          };
        }
      } catch (parseError) {
        console.error('Failed to parse enhanced card:', parseError);
      }
    }
    
    return {
      success: false,
      error: 'Failed to enhance card'
    };
  }

  async generateQuestions(provider: LLMProvider, text: string, count: number = 5): Promise<AIResponse> {
    const detectedLanguage = detectLanguage(text);
    const prompt = `Generate ${count} thoughtful questions based on the following text. These questions should test understanding and encourage critical thinking. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

${text}

Questions (JSON array format with "question" field):`;
    
    const response = await this.makeRequest(provider, prompt);
    
    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[.*\]/s);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: questions.map((q: any) => q.question || q)
          };
        }
      } catch (parseError) {
        console.error('Failed to parse questions:', parseError);
      }
    }
    
    return {
      success: false,
      error: 'Failed to generate questions'
    };
  }

  async testConnection(provider: LLMProvider): Promise<AIResponse> {
    const testPrompt = 'Hello! Please respond with "Connection successful" to test the API.';
    return this.makeRequest(provider, testPrompt);
  }

  async getAvailableModels(provider: LLMProvider): Promise<AIResponse> {
    try {
      if (!provider.apiKey) {
        throw new Error('API key not configured for this provider');
      }

      let response;
      
      // Handle different provider APIs for model listing
      if (provider.id === 'openai' || provider.baseUrl.includes('openai')) {
        response = await axios.get(
          `${provider.baseUrl}/models`,
          {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const models = response.data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => model.id)
          .sort();
        
        return {
          success: true,
          data: models
        };
      } else if (provider.id === 'anthropic' || provider.baseUrl.includes('anthropic')) {
        // Anthropic doesn't have a public models endpoint, return known models
        return {
          success: true,
          data: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-2.1', 'claude-2.0']
        };
      } else if (provider.id === 'google' || provider.baseUrl.includes('googleapis')) {
        response = await axios.get(
          `${provider.baseUrl}/models?key=${provider.apiKey}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const models = response.data.models
          .filter((model: any) => model.name.includes('gemini'))
          .map((model: any) => model.name.replace('models/', ''))
          .sort();
        
        return {
          success: true,
          data: models
        };
      } else if (provider.id === 'deepseek') {
        // DeepSeek doesn't have a public models endpoint, return known models
        return {
          success: true,
          data: ['deepseek-chat', 'deepseek-coder']
        };
      } else if (provider.id === 'grok') {
        // Grok doesn't have a public models endpoint, return known models
        return {
          success: true,
          data: ['grok-beta']
        };
      } else if (provider.id === 'siliconflow') {
        // Try to get models from SiliconFlow API
        try {
          response = await axios.get(
            `${provider.baseUrl}/models`,
            {
              headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const models = response.data.data
            ? response.data.data.map((model: any) => model.id || model.name).sort()
            : ['deepseek-chat', 'qwen-turbo', 'glm-4-chat'];
          
          return {
            success: true,
            data: models
          };
        } catch (error) {
          // If models endpoint doesn't exist, return default models
          return {
            success: true,
            data: ['deepseek-chat', 'qwen-turbo', 'glm-4-chat']
          };
        }
      } else if (provider.id === 'ollama') {
        // Try to get models from Ollama API
        try {
          response = await axios.get(
            `${provider.baseUrl.replace('/v1', '')}/api/tags`,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          const models = response.data.models
            ? response.data.models.map((model: any) => model.name).sort()
            : ['llama2', 'codellama', 'mistral'];
          
          return {
            success: true,
            data: models
          };
        } catch (error) {
          // If Ollama is not running or models endpoint doesn't exist, return default models
          return {
            success: true,
            data: ['llama2', 'codellama', 'mistral']
          };
        }
      } else {
        // Generic OpenAI-compatible API
        try {
          response = await axios.get(
            `${provider.baseUrl}/models`,
            {
              headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const models = response.data.data
            ? response.data.data.map((model: any) => model.id || model.name).sort()
            : response.data.models || [];
          
          return {
            success: true,
            data: models
          };
        } catch (error) {
          // If models endpoint doesn't exist, return default models
          return {
            success: true,
            data: ['gpt-3.5-turbo', 'gpt-4']
          };
        }
      }
    } catch (error: any) {
      console.error('Model retrieval error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to retrieve models'
      };
    }
  }

  async generateMindMapSummary(provider: LLMProvider, text: string): Promise<AIResponse> {
    const language = detectLanguage(text);
    
    const prompt = language === 'zh' 
      ? `请分析以下文本内容，生成思维导图所需的信息：

文本内容：
${text}

请按照以下JSON格式返回结果：
{
  "title": "核心主题（10字以内）",
  "summary": "一句话总结核心内容（20字以内）"
}

要求：
1. title应该是文本的核心主题，简洁明了
2. summary应该是对整个内容的精炼总结，适合作为卡片正面
3. 只返回JSON格式，不要其他解释`
      : `Please analyze the following text content and generate information needed for a mind map:

Text content:
${text}

Please return the result in the following JSON format:
{
  "title": "Core theme (within 10 words)",
  "summary": "One-sentence summary of core content (within 20 words)"
}

Requirements:
1. title should be the core theme of the text, concise and clear
2. summary should be a refined summary of the entire content, suitable for the front of a card
3. Only return JSON format, no other explanations`;

    try {
      const response = await this.makeRequest(provider, prompt);
      
      if (response.success && response.data) {
        try {
          const parsed = JSON.parse(response.data);
          return {
            success: true,
            data: {
              title: parsed.title || '思维导图',
              summary: parsed.summary || '内容总结'
            }
          };
        } catch (parseError) {
          // 如果JSON解析失败，尝试提取内容
          const content = response.data;
          const titleMatch = content.match(/["']title["']\s*:\s*["']([^"']+)["']/);
          const summaryMatch = content.match(/["']summary["']\s*:\s*["']([^"']+)["']/);
          
          return {
            success: true,
            data: {
              title: titleMatch?.[1] || '思维导图',
              summary: summaryMatch?.[1] || text.substring(0, 30) + '...'
            }
          };
        }
      } else {
        return response;
      }
    } catch (error: any) {
      console.error('Mind map summary generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate mind map summary'
      };
    }
  }
}

export const aiService = new AIService();
export default aiService;