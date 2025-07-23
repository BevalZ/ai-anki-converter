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
    const prompt = `Please analyze the following text and extract the core knowledge points. Break it down into distinct, important concepts that can be learned separately. Return the result as a JSON array where each item has a "point" field containing the knowledge point. IMPORTANT: Please respond in ${detectedLanguage} language to match the input text language.

${text}

Core knowledge points (JSON array format):`;
    
    const response = await this.makeRequest(provider, prompt);
    
    if (response.success && response.data) {
      try {
        const jsonMatch = response.data.match(/\[.*\]/s);
        if (jsonMatch) {
          const knowledgePoints = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: {
              points: knowledgePoints.map((item: any) => item.point || item),
              count: knowledgePoints.length
            }
          };
        }
      } catch (parseError) {
        console.error('Failed to parse knowledge points:', parseError);
      }
    }
    
    return {
      success: false,
      error: 'Failed to extract knowledge points'
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
}

export const aiService = new AIService();
export default aiService;