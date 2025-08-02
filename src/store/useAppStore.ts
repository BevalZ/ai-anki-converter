import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { aiService } from '@/services/aiService';
import { keyManagementService } from '@/services/keyManagementService';
import { toast } from 'sonner';

export interface AnkiCard {
  id: string;
  front: string;
  back: string;
  type: 'basic' | 'cloze' | 'definition';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
}

export interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  selectedModel?: string;
  description: string;
  isValidated?: boolean;
  validationError?: string;
  isValidating?: boolean;
  lastConfigured?: number;
}

export interface LocaleSettings {
  language: string;
  region?: string;
}

export const SUPPORTED_LOCALES = {
  'en': { name: 'English', nativeName: 'English' },
  'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  'es': { name: 'Spanish', nativeName: 'Español' },
  'fr': { name: 'French', nativeName: 'Français' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'ru': { name: 'Russian', nativeName: 'Русский' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी' }
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

interface AppState {
  // Text processing
  inputText: string;
  processedText: string;
  knowledgePoints: string[];
  
  // Last operation tracking for retry functionality
  lastOperation: {
    type: 'summarize' | 'rearrange' | 'mindmap' | null;
    inputText: string;
  };
  
  // Cards
  cards: AnkiCard[];
  selectedCards: string[];
  
  // Export Bucket
  bucketCards: string[];
  isBucketVisible: boolean;
  
  // LLM Configuration
  llmProviders: LLMProvider[];
  selectedProvider: string;
  
  // Locale Settings
  locale: SupportedLocale;
  
  // UI State
  isProcessing: boolean;
  currentPage: string;
  
  // Mind Map State
  mindMapData: { svg: string; title: string } | null;
  showMindMapModal: boolean;
  
  // Key Management State
  isInitialized: boolean;
  
  // Actions
  setInputText: (text: string) => void;
  setProcessedText: (text: string) => void;
  setKnowledgePoints: (points: string[]) => void;
  
  // New actions for processed text operations
  backfillProcessedText: () => void;
  retryLastOperation: () => Promise<void>;
  generateMindMapFromProcessed: () => Promise<void>;
  addCard: (card: Omit<AnkiCard, 'id' | 'createdAt'>) => void;
  addCards: (cards: AnkiCard[]) => void;
  updateCard: (id: string, updates: Partial<AnkiCard>) => void;
  deleteCard: (id: string) => void;
  deleteCards: (cardIds: string[]) => void;
  clearCards: () => void;
  toggleCardSelection: (cardId: string) => void;
  selectAllCards: () => void;
  clearSelection: () => void;
  
  // Bucket Actions
  addToBucket: (cardId: string) => void;
  removeFromBucket: (cardId: string) => void;
  toggleBucketCard: (cardId: string) => void;
  addSelectedToBucket: () => void;
  clearBucket: () => void;
  getBucketCards: () => AnkiCard[];
  setBucketVisible: (visible: boolean) => void;
  toggleBucketVisible: () => void;
  
  updateLLMProviders: (providers: LLMProvider[]) => void;
  updateProviderModels: (providerId: string, models: string[]) => void;
  setSelectedProvider: (providerId: string) => void;
  setProviderSelectedModel: (providerId: string, model: string) => void;
  setCurrentPage: (page: string) => void;
  setLocale: (locale: SupportedLocale) => void;
  
  // Mind Map Actions
  setMindMapData: (data: { svg: string; title: string } | null) => void;
  setShowMindMapModal: (show: boolean) => void;
  
  // Intelligent Key Management
  validateApiKey: (providerId: string) => Promise<void>;
  updateProviderApiKey: (providerId: string, apiKey: string) => Promise<void>;
  loadStoredConfigurations: () => Promise<void>;
  prioritizeProvider: (providerId: string) => void;
  initializeApp: () => Promise<void>;
  
  // AI Functions
  generateCards: (text: string, type: AnkiCard['type'], difficulty: AnkiCard['difficulty'], maxCards: number, silent?: boolean) => Promise<void>;
  summarizeText: (text: string) => Promise<void>;
  rearrangeContent: (text: string) => Promise<{ points: string[]; count: number } | null>;
  enhanceCard: (cardId: string) => Promise<void>;
  retrieveProviderModels: (providerId: string) => Promise<void>;
  generateMindMap: (text: string) => Promise<void>;
}

const defaultProviders: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    description: 'OpenAI GPT models for high-quality text generation'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    description: 'Anthropic Claude models for thoughtful and helpful responses'
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    models: ['gemini-pro', 'gemini-pro-vision'],
    description: 'Google Gemini models for versatile AI capabilities'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    description: 'DeepSeek AI models for advanced reasoning and coding'
  },
  {
    id: 'grok',
    name: 'Grok (xAI)',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-beta'],
    description: 'Grok AI by xAI for conversational AI with real-time knowledge'
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-chat', 'qwen-turbo', 'glm-4-chat'],
    description: 'SiliconFlow API for various open-source models'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama2', 'codellama', 'mistral'],
    description: 'Local Ollama models for privacy-focused AI'
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Initial state
  inputText: '',
  processedText: '',
  knowledgePoints: [],
  lastOperation: { type: null, inputText: '' },
  cards: [],
  selectedCards: [],
  bucketCards: [],
  isBucketVisible: true,
  llmProviders: defaultProviders,
  selectedProvider: 'openai',
  locale: 'zh-CN',
  isProcessing: false,
  currentPage: 'home',
  mindMapData: null,
  showMindMapModal: false,
  isInitialized: false,
  
  // Text actions
  setInputText: (text) => set({ inputText: text }),
  setProcessedText: (text) => set({ processedText: text }),
  setKnowledgePoints: (points) => set({ knowledgePoints: points }),
  
  // New processed text operations
  backfillProcessedText: () => {
    const state = get();
    if (state.processedText) {
      set({ inputText: state.processedText });
      toast.success('已将处理后的内容回填到输入框');
    }
  },
  
  retryLastOperation: async () => {
    const state = get();
    if (!state.lastOperation.type || !state.lastOperation.inputText) {
      toast.error('没有可重试的操作');
      return;
    }
    
    const { type, inputText } = state.lastOperation;
    
    switch (type) {
      case 'summarize':
        await get().summarizeText(inputText);
        break;
      case 'rearrange':
        await get().rearrangeContent(inputText);
        break;
      case 'mindmap':
        await get().generateMindMap(inputText);
        break;
    }
  },
  
  generateMindMapFromProcessed: async () => {
    const state = get();
    if (!state.processedText) {
      toast.error('没有已处理的内容可生成脑图');
      return;
    }
    
    await get().generateMindMap(state.processedText);
  },
  
  // Card actions
  addCard: (cardData) => {
    const newCard: AnkiCard = {
      ...cardData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    set((state) => ({ cards: [...state.cards, newCard] }));
  },
  
  addCards: (newCards) => {
    set((state) => ({ cards: [...state.cards, ...newCards] }));
  },
  
  updateCard: (id, updates) => {
    set((state) => ({
      cards: state.cards.map(card => 
        card.id === id ? { ...card, ...updates } : card
      )
    }));
  },
  
  deleteCard: (id) => {
    set((state) => ({
      cards: state.cards.filter(card => card.id !== id),
      bucketCards: state.bucketCards.filter(cardId => cardId !== id)
    }));
  },
  
  deleteCards: (cardIds) => {
    set((state) => ({
      cards: state.cards.filter(card => !cardIds.includes(card.id)),
      selectedCards: state.selectedCards.filter(id => !cardIds.includes(id)),
      bucketCards: state.bucketCards.filter(id => !cardIds.includes(id))
    }));
  },
  
  clearCards: () => set({ cards: [], selectedCards: [], bucketCards: [] }),
  
  toggleCardSelection: (cardId) => {
    set((state) => ({
      selectedCards: state.selectedCards.includes(cardId)
        ? state.selectedCards.filter(id => id !== cardId)
        : [...state.selectedCards, cardId]
    }));
  },
  
  selectAllCards: () => {
    set((state) => ({
      selectedCards: state.cards.map(card => card.id)
    }));
  },
  
  clearSelection: () => set({ selectedCards: [] }),
  
  // Bucket actions
  addToBucket: (cardId) => {
    set((state) => ({
      bucketCards: state.bucketCards.includes(cardId)
        ? state.bucketCards
        : [...state.bucketCards, cardId]
    }));
  },
  
  removeFromBucket: (cardId) => {
    set((state) => ({
      bucketCards: state.bucketCards.filter(id => id !== cardId)
    }));
  },
  
  toggleBucketCard: (cardId) => {
    set((state) => ({
      bucketCards: state.bucketCards.includes(cardId)
        ? state.bucketCards.filter(id => id !== cardId)
        : [...state.bucketCards, cardId]
    }));
  },

  addSelectedToBucket: () => {
    set((state) => {
      const newBucketCards = [...new Set([...state.bucketCards, ...state.selectedCards])];
      return { bucketCards: newBucketCards };
    });
  },
  
  clearBucket: () => set({ bucketCards: [] }),
  
  getBucketCards: () => {
    const state = get();
    return state.cards.filter(card => state.bucketCards.includes(card.id));
  },
  
  setBucketVisible: (visible) => set({ isBucketVisible: visible }),
  
  toggleBucketVisible: () => {
    set((state) => ({ isBucketVisible: !state.isBucketVisible }));
  },
  
  // LLM actions
  updateLLMProviders: (providers) => set({ llmProviders: providers }),
  
  updateProviderModels: (providerId, models) => {
    set((state) => ({
      llmProviders: state.llmProviders.map(provider => 
        provider.id === providerId 
          ? { ...provider, models, selectedModel: models[0] }
          : provider
      )
    }));
  },
  
  setSelectedProvider: (providerId) => set({ selectedProvider: providerId }),
  
  setProviderSelectedModel: (providerId, model) => {
    set((state) => ({
      llmProviders: state.llmProviders.map(provider => 
        provider.id === providerId 
          ? { ...provider, selectedModel: model }
          : provider
      )
    }));
  },
  
  // UI actions
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Locale actions
  setLocale: (locale) => set({ locale }),
  
  // Mind Map actions
  setMindMapData: (data) => set({ mindMapData: data }),
  setShowMindMapModal: (show) => set({ showMindMapModal: show }),
  
  // AI Functions with real API integration
  generateCards: async (text, type, difficulty, maxCards, silent) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === state.selectedProvider);
    
    if (!provider) {
      toast.error('No AI provider selected');
      return;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for selected provider');
      return;
    }
    
    set({ isProcessing: true });
    
    try {
      const response = await aiService.generateCards(provider, {
        text,
        cardType: type,
        difficulty,
        maxCards
      });
      
      if (response.success && response.data) {
        const { addCards } = get();
        addCards(response.data);
        if (!silent) {
          toast.success(`Generated ${response.data.length} cards successfully!`);
        }
      } else {
        if (!silent) {
          toast.error(response.error || 'Failed to generate cards');
        }
      }
    } catch (error) {
      console.error('Card generation error:', error);
      if (!silent) {
        toast.error('Failed to generate cards');
      }
    } finally {
      set({ isProcessing: false });
    }
  },
  
  summarizeText: async (text) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === state.selectedProvider);
    
    if (!provider) {
      toast.error('No AI provider selected');
      return;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for selected provider');
      return;
    }
    
    set({ 
      isProcessing: true,
      lastOperation: { type: 'summarize', inputText: text }
    });
    
    try {
      const response = await aiService.summarizeText(provider, text);
      
      if (response.success && response.data) {
        set({ processedText: response.data });
        toast.success('Text summarized successfully!');
      } else {
        toast.error(response.error || 'Failed to summarize text');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      toast.error('Failed to summarize text');
    } finally {
      set({ isProcessing: false });
    }
  },
  
  rearrangeContent: async (text) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === state.selectedProvider);
    
    if (!provider) {
      toast.error('No AI provider selected');
      return null;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for selected provider');
      return null;
    }
    
    set({ 
      isProcessing: true,
      lastOperation: { type: 'rearrange', inputText: text }
    });
    
    try {
      const response = await aiService.rearrangeContent(provider, text);
      
      if (response.success && response.data) {
        const { points, count } = response.data;
        set({ 
          knowledgePoints: points,
          processedText: points.join('\n\n')
        });
        // Don't show toast here, it will be handled in Home.tsx with proper translation
        return { points, count };
      } else {
        toast.error(response.error || 'Failed to extract knowledge points');
        return null;
      }
    } catch (error) {
      console.error('Knowledge points extraction error:', error);
      toast.error('Failed to extract knowledge points');
      return null;
    } finally {
      set({ isProcessing: false });
    }
  },
  
  enhanceCard: async (cardId) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === state.selectedProvider);
    const card = state.cards.find(c => c.id === cardId);
    
    if (!provider) {
      toast.error('No AI provider selected');
      return;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for selected provider');
      return;
    }
    
    if (!card) {
      toast.error('Card not found');
      return;
    }
    
    set({ isProcessing: true });
    
    try {
      const response = await aiService.enhanceCard(provider, card);
      
      if (response.success && response.data) {
        const { updateCard } = get();
        updateCard(cardId, {
          front: response.data.front,
          back: response.data.back
        });
        toast.success('Card enhanced successfully!');
      } else {
        toast.error(response.error || 'Failed to enhance card');
      }
    } catch (error) {
      console.error('Card enhancement error:', error);
      toast.error('Failed to enhance card');
    } finally {
      set({ isProcessing: false });
    }
  },
  
  retrieveProviderModels: async (providerId) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === providerId);
    
    if (!provider) {
      toast.error('Provider not found');
      return;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for this provider');
      return;
    }
    
    set({ isProcessing: true });
    
    try {
      const response = await aiService.getAvailableModels(provider);
      
      if (response.success && response.data) {
        const { updateProviderModels } = get();
        updateProviderModels(providerId, response.data);
        toast.success(`Retrieved ${response.data.length} models for ${provider.name}`);
      } else {
        toast.error(response.error || 'Failed to retrieve models');
      }
    } catch (error) {
      console.error('Model retrieval error:', error);
      toast.error('Failed to retrieve models');
    } finally {
      set({ isProcessing: false });
    }
  },

  generateMindMap: async (text) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === state.selectedProvider);
    
    if (!provider) {
      toast.error('No AI provider selected');
      return;
    }
    
    if (!provider.apiKey) {
      toast.error('API key not configured for selected provider');
      return;
    }
    
    set({ 
      isProcessing: true,
      lastOperation: { type: 'mindmap', inputText: text }
    });
    
    try {
      // 使用AI生成思维导图的核心内容总结
      const summaryResponse = await aiService.generateMindMapSummary(provider, text);
      
      if (summaryResponse.success && summaryResponse.data) {
        const { title } = summaryResponse.data;
        
        // 导入思维导图生成工具
        const { parseTextToMindMap, generateMindMapSVG } = await import('@/utils/mindMapGenerator');
        
        // 生成思维导图数据和SVG
        const mindMapData = parseTextToMindMap(text, title);
        const mindMapSVG = generateMindMapSVG(mindMapData);
        
        // 设置脑图数据并显示弹窗
        const { setMindMapData, setShowMindMapModal } = get();
        setMindMapData({ svg: mindMapSVG, title });
        setShowMindMapModal(true);
        
        toast.success('脑图生成成功！');
      } else {
        toast.error(summaryResponse.error || 'Failed to generate mind map');
      }
    } catch (error) {
      console.error('Mind map generation error:', error);
      toast.error('Failed to generate mind map');
    } finally {
      set({ isProcessing: false });
    }
  },

  // Intelligent Key Management Functions
  validateApiKey: async (providerId) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === providerId);
    
    if (!provider || !provider.apiKey) {
      return;
    }

    // Set validating state
    set((state) => ({
      llmProviders: state.llmProviders.map(p => 
        p.id === providerId 
          ? { ...p, isValidating: true, validationError: undefined }
          : p
      )
    }));

    try {
      const result = await keyManagementService.validateApiKey(provider);
      
      if (result.isValid) {
        // Update provider with validation success and discovered models
        set((state) => ({
          llmProviders: state.llmProviders.map(p => 
            p.id === providerId 
              ? { 
                  ...p, 
                  isValidated: true, 
                  isValidating: false,
                  validationError: undefined,
                  models: result.models || p.models,
                  selectedModel: result.models?.[0] || p.selectedModel
                }
              : p
          )
        }));
        
        // Store configuration
        await keyManagementService.storeProviderConfig(provider, result.models);
        
        // Prioritize this provider
        get().prioritizeProvider(providerId);
        
        toast.success(`${provider.name} API key validated successfully!`);
      } else {
        // Update provider with validation error
        set((state) => ({
          llmProviders: state.llmProviders.map(p => 
            p.id === providerId 
              ? { 
                  ...p, 
                  isValidated: false, 
                  isValidating: false,
                  validationError: result.error
                }
              : p
          )
        }));
        
        toast.error(`${provider.name}: ${result.error}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      
      set((state) => ({
        llmProviders: state.llmProviders.map(p => 
          p.id === providerId 
            ? { 
                ...p, 
                isValidated: false, 
                isValidating: false,
                validationError: 'Validation failed'
              }
            : p
        )
      }));
      
      toast.error(`Failed to validate ${provider.name} API key`);
    }
  },

  updateProviderApiKey: async (providerId, apiKey) => {
    // Update provider with new API key
    set((state) => ({
      llmProviders: state.llmProviders.map(p => 
        p.id === providerId 
          ? { 
              ...p, 
              apiKey, 
              isValidated: undefined,
              validationError: undefined,
              lastConfigured: Date.now()
            }
          : p
      )
    }));

    // Auto-validate if API key is provided
    if (apiKey.trim()) {
      await get().validateApiKey(providerId);
    }
  },

  loadStoredConfigurations: async () => {
    try {
      const configs = await keyManagementService.loadAllConfigurations();
      
      set((state) => ({
        llmProviders: state.llmProviders.map(provider => {
          const config = configs[provider.id];
          if (config) {
            return {
              ...provider,
              apiKey: config.apiKey,
              models: config.models.length > 0 ? config.models : provider.models,
              selectedModel: config.selectedModel || config.models[0] || provider.selectedModel,
              isValidated: true // Assume stored configs are valid
            };
          }
          return provider;
        })
      }));

      // Set the last configured provider as selected
      const lastConfigured = keyManagementService.getLastConfiguredProvider();
      if (lastConfigured) {
        set({ selectedProvider: lastConfigured });
      }
    } catch (error) {
      console.error('Failed to load stored configurations:', error);
    }
  },

  prioritizeProvider: (providerId) => {
    const state = get();
    const provider = state.llmProviders.find(p => p.id === providerId);
    
    if (!provider) return;

    // Update last configured timestamp
    set((state) => ({
      llmProviders: state.llmProviders.map(p => 
        p.id === providerId 
          ? { ...p, lastConfigured: Date.now() }
          : p
      )
    }));

    // Set as selected provider
    set({ selectedProvider: providerId });
  },

  initializeApp: async () => {
    if (get().isInitialized) return;
    
    try {
      await get().loadStoredConfigurations();
      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isInitialized: true }); // Set as initialized even if loading fails
    }
  }
}),
{
  name: 'codeca-app-storage',
  partialize: (state) => ({
    // 持久化的状态
    cards: state.cards,
    bucketCards: state.bucketCards,
    locale: state.locale,
    selectedProvider: state.selectedProvider,
    isBucketVisible: state.isBucketVisible,
    // 新增：持久化文本内容和操作历史
    inputText: state.inputText,
    processedText: state.processedText,
    knowledgePoints: state.knowledgePoints,
    lastOperation: state.lastOperation,
    // 不持久化的状态（每次重新开始）
    // selectedCards - 选择状态
    // isProcessing - UI状态
    // currentPage - 页面状态
  }),
  // 自定义存储以处理Date对象
  storage: createJSONStorage(() => ({
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      
      try {
        const parsed = JSON.parse(str);
        // 恢复Date对象
        if (parsed.state?.cards) {
          parsed.state.cards = parsed.state.cards.map((card: any) => ({
            ...card,
            createdAt: new Date(card.createdAt)
          }));
        }
        return JSON.stringify(parsed);
      } catch {
        return str;
      }
    },
    setItem: (name, value) => {
      try {
        const parsed = JSON.parse(value);
        // 序列化Date对象
        if (parsed.state?.cards) {
          parsed.state.cards = parsed.state.cards.map((card: any) => ({
            ...card,
            createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt
          }));
        }
        localStorage.setItem(name, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(name, value);
      }
    },
    removeItem: (name) => localStorage.removeItem(name)
  })),
  // 版本控制，用于处理数据结构变更
  version: 1,
  migrate: (persistedState: any, version: number) => {
    // 如果需要迁移旧版本数据，可以在这里处理
    if (version === 0) {
      // 从版本0迁移到版本1的逻辑
      return persistedState;
    }
    return persistedState;
  }
}
)
);