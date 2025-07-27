import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Globe, Zap, Save, Eye, EyeOff, Plus, Trash2, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/store/useAppStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const defaultProviders = [
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

export default function Settings() {
  const { 
    llmProviders, 
    selectedProvider, 
    isProcessing,
    updateLLMProviders, 
    setSelectedProvider,
    setProviderSelectedModel,
    retrieveProviderModels,
    validateApiKey,
    updateProviderApiKey,
    initializeApp,
    isInitialized
  } = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    models: [''],
    description: ''
  });
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    defaultCardType: 'basic' as 'basic' | 'cloze' | 'definition',
    defaultDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    maxCardsPerGeneration: 10,
    enableAIEnhancements: true
  });

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleProviderUpdate = (providerId: string, field: string, value: string) => {
    if (field === 'apiKey') {
      updateProviderApiKey(providerId, value);
    } else {
      const updatedProviders = llmProviders.map(provider => {
        if (provider.id === providerId) {
          return { ...provider, [field]: value };
        }
        return provider;
      });
      updateLLMProviders(updatedProviders);
    }
  };

  // Initialize app on component mount
  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  // Get validation status indicator
  const getValidationIndicator = (provider: any) => {
    if (provider.isValidating) {
      return (
        <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
          <Clock className="h-4 w-4 animate-pulse" />
          <span className="text-xs">{t('validating')}</span>
        </div>
      );
    }
    
    if (provider.isValidated === true) {
      return (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">{t('validated')}</span>
        </div>
      );
    }
    
    if (provider.isValidated === false) {
      return (
        <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" />
          <span className="text-xs">{provider.validationError || t('validationFailed')}</span>
        </div>
      );
    }
    
    return null;
  };

  // Sort providers by priority (recently configured first)
  const sortedProviders = [...llmProviders].sort((a, b) => {
    const aTime = a.lastConfigured || 0;
    const bTime = b.lastConfigured || 0;
    return bTime - aTime;
  });

  const handleModelUpdate = (providerId: string, modelIndex: number, value: string) => {
    const updatedProviders = llmProviders.map(provider => {
      if (provider.id === providerId) {
        const newModels = [...provider.models];
        newModels[modelIndex] = value;
        return { ...provider, models: newModels };
      }
      return provider;
    });
    updateLLMProviders(updatedProviders);
  };

  const addModel = (providerId: string) => {
    const updatedProviders = llmProviders.map(provider => {
      if (provider.id === providerId) {
        return { ...provider, models: [...provider.models, ''] };
      }
      return provider;
    });
    updateLLMProviders(updatedProviders);
  };

  const removeModel = (providerId: string, modelIndex: number) => {
    const updatedProviders = llmProviders.map(provider => {
      if (provider.id === providerId) {
        const newModels = provider.models.filter((_, index) => index !== modelIndex);
        return { ...provider, models: newModels };
      }
      return provider;
    });
    updateLLMProviders(updatedProviders);
  };

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.baseUrl || !newProvider.apiKey) {
      toast.error(t('pleaseFillAllRequiredFields'));
      return;
    }

    const provider = {
      id: newProvider.name.toLowerCase().replace(/\s+/g, '-'),
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      apiKey: newProvider.apiKey,
      models: newProvider.models.filter(model => model.trim() !== ''),
      description: newProvider.description
    };

    updateLLMProviders([...llmProviders, provider]);
    setNewProvider({ name: '', baseUrl: '', apiKey: '', models: [''], description: '' });
    setShowAddProvider(false);
    toast.success(t('providerAddedSuccessfully'));
  };

  const removeProvider = (providerId: string) => {
    const updatedProviders = llmProviders.filter(provider => provider.id !== providerId);
    updateLLMProviders(updatedProviders);
    
    if (selectedProvider === providerId && updatedProviders.length > 0) {
      setSelectedProvider(updatedProviders[0].id);
    }
    
    toast.success(t('providerRemovedSuccessfully'));
  };

  const resetToDefaults = () => {
    updateLLMProviders(defaultProviders.map(provider => ({ ...provider, apiKey: '' })));
    setSelectedProvider('openai');
    toast.success(t('resetToDefaultProviders'));
  };

  const saveSettings = () => {
    // In a real app, you'd save these to localStorage or a backend
    localStorage.setItem('ankiConverterSettings', JSON.stringify(settings));
    toast.success(t('settingsSavedSuccessfully'));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      // For system theme, we need to detect the system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (theme !== systemTheme) {
        toggleTheme();
      }
    } else if (newTheme !== theme) {
      toggleTheme();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('settings')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('settingsDescription')}
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Language Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('language')}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('language')}
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                >
                  {Object.entries(SUPPORTED_LOCALES).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.nativeName} ({info.name})
                    </option>
                  ))}
                </select>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('selectPreferredLanguage')}
                </p>
              </div>
            </div>
          </div>

          {/* LLM Providers Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('aiProvider')}</h2>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => setShowAddProvider(true)}
                    className="flex items-center justify-center px-3 py-3 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[44px] sm:min-h-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addProvider')}
                  </button>
                  <button
                    onClick={resetToDefaults}
                    className="flex items-center justify-center px-3 py-3 sm:py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium min-h-[44px] sm:min-h-0"
                  >
                    {t('resetDefaults')}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {llmProviders.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noProvidersConfigured')}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                    {t('addProviderToStart')}
                  </p>
                  <button
                    onClick={() => setShowAddProvider(true)}
                    className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0"
                  >
                    {t('addFirstProvider')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {sortedProviders.map((provider, index) => (
                    <div
                      key={provider.id}
                      className={cn(
                        'border-2 rounded-lg p-3 sm:p-4 relative',
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-600'
                      )}
                    >
                      {/* Priority Badge */}
                      {index === 0 && provider.lastConfigured && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          {t('recentlyConfigured')}
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="radio"
                            name="selectedProvider"
                            checked={selectedProvider === provider.id}
                            onChange={() => setSelectedProvider(provider.id)}
                            className="text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{provider.name}</h3>
                              {getValidationIndicator(provider)}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{provider.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col lg:flex-row space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-2 shrink-0">
                          <button
                            onClick={() => setEditingProvider(
                              editingProvider === provider.id ? null : provider.id
                            )}
                            className="flex-1 sm:flex-none px-3 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 rounded-lg min-h-[36px] flex items-center justify-center"
                          >
                            {editingProvider === provider.id ? t('done') : t('edit')}
                          </button>
                          <button
                            onClick={() => removeProvider(provider.id)}
                            className="flex-1 sm:flex-none px-3 py-2 text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {editingProvider === provider.id && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('providerName')}
                              </label>
                              <input
                                type="text"
                                value={provider.name}
                                onChange={(e) => handleProviderUpdate(provider.id, 'name', e.target.value)}
                                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('baseUrl')}
                              </label>
                              <input
                                type="url"
                                value={provider.baseUrl}
                                onChange={(e) => handleProviderUpdate(provider.id, 'baseUrl', e.target.value)}
                                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('apiKey')}
                              </label>
                              {provider.apiKey && (
                                <button
                                  onClick={() => validateApiKey(provider.id)}
                                  disabled={provider.isValidating}
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 self-start sm:self-auto"
                                >
                                  {provider.isValidating ? t('validating') : t('revalidate')}
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                value={provider.apiKey || ''}
                                onChange={(e) => handleProviderUpdate(provider.id, 'apiKey', e.target.value)}
                                className={cn(
                                  "w-full px-3 py-3 sm:py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0",
                                  provider.isValidated === false
                                    ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                                    : provider.isValidated === true
                                    ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                )}
                                placeholder={t('enterApiKey')}
                              />
                              <button
                                type="button"
                                onClick={() => toggleApiKeyVisibility(provider.id)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] sm:min-h-0"
                              >
                                {showApiKeys[provider.id] ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            {provider.validationError && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {provider.validationError}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('description')}
                            </label>
                            <textarea
                              value={provider.description}
                              onChange={(e) => handleProviderUpdate(provider.id, 'description', e.target.value)}
                              className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                              rows={2}
                            />
                          </div>

                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('availableModels')}
                              </label>
                              <button
                                onClick={() => retrieveProviderModels(provider.id)}
                                disabled={!provider.apiKey || isProcessing}
                                className="flex items-center justify-center space-x-1 px-3 py-3 sm:py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] sm:min-h-0"
                              >
                                <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                                <span>{t('retrieveModels')}</span>
                              </button>
                            </div>
                            
                            {provider.models.length > 0 && (
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {t('selectedModel')}
                                </label>
                                <select
                                  value={provider.selectedModel || provider.models[0] || ''}
                                  onChange={(e) => setProviderSelectedModel(provider.id, e.target.value)}
                                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                                >
                                  {provider.models.map((model) => (
                                    <option key={model} value={model}>
                                      {model}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              {provider.models.map((model, index) => (
                                <div key={index} className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => handleModelUpdate(provider.id, index, e.target.value)}
                                    className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] sm:min-h-0"
                                    placeholder={t('modelName')}
                                  />
                                  <button
                                    onClick={() => removeModel(provider.id, index)}
                                    className="px-3 py-3 sm:py-2 text-red-600 hover:text-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[44px] sm:min-h-0 flex items-center justify-center"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addModel(provider.id)}
                                className="w-full px-3 py-3 sm:py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-sm sm:text-base min-h-[44px] sm:min-h-0 flex items-center justify-center"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('addModel')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Application Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings')}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('defaultCardType')}
                  </label>
                  <select
                    value={settings.defaultCardType}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultCardType: e.target.value as any }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]">
                    <option value="basic">{t('basic')}</option>
                    <option value="cloze">{t('cloze')}</option>
                    <option value="definition">{t('definition')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('defaultDifficulty')}
                  </label>
                  <select
                    value={settings.defaultDifficulty}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultDifficulty: e.target.value as any }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]">
                    <option value="easy">{t('easy')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="hard">{t('hard')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('maxCardsPerGeneration')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxCardsPerGeneration}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxCardsPerGeneration: parseInt(e.target.value) }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('theme')}
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]">
                    <option value="light">{t('light')}</option>
                    <option value="dark">{t('dark')}</option>
                    <option value="system">{t('system')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <label className="flex items-center space-x-3 cursor-pointer p-3 sm:p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[48px] sm:min-h-0">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t('autoSaveCards')}</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 sm:p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[48px] sm:min-h-0">
                  <input
                    type="checkbox"
                    checked={settings.enableAIEnhancements}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableAIEnhancements: e.target.checked }))}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                  />
                  <span className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t('enableAIEnhancements')}</span>
                </label>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={saveSettings}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-medium text-base sm:text-sm min-h-[52px] sm:min-h-0 transition-colors"
                >
                  <Save className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span>{t('saveSettings')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Provider Modal */}
        {showAddProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('addNewProvider')}</h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('providerName')} *
                  </label>
                  <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                    placeholder={t('providerNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('baseUrl')} *
                  </label>
                  <input
                    type="url"
                    value={newProvider.baseUrl}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                    placeholder={t('baseUrlPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('apiKey')} *
                  </label>
                  <input
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                    placeholder={t('yourApiKey')}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('description')}
                  </label>
                  <textarea
                    value={newProvider.description}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                    rows={3}
                    placeholder={t('briefDescription')}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('models')}
                  </label>
                  {newProvider.models.map((model, index) => (
                    <div key={index} className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => {
                          const newModels = [...newProvider.models];
                          newModels[index] = e.target.value;
                          setNewProvider(prev => ({ ...prev, models: newModels }));
                        }}
                        className="flex-1 px-3 sm:px-4 py-3 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                        placeholder={t('modelName')}
                      />
                      {newProvider.models.length > 1 && (
                        <button
                          onClick={() => {
                            const newModels = newProvider.models.filter((_, i) => i !== index);
                            setNewProvider(prev => ({ ...prev, models: newModels }));
                          }}
                          className="px-3 py-3 sm:py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewProvider(prev => ({ ...prev, models: [...prev.models, ''] }))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                    {t('addModel')}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAddProvider(false);
                    setNewProvider({ name: '', baseUrl: '', apiKey: '', models: [''], description: '' });
                  }}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-base sm:text-sm font-medium min-h-[44px] sm:min-h-0 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddProvider}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium text-base sm:text-sm min-h-[44px] sm:min-h-0 transition-colors"
                >
                  {t('addProvider')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}