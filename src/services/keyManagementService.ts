import { LLMProvider } from '@/store/useAppStore';
import { aiService } from './aiService';

interface KeyValidationResult {
  isValid: boolean;
  error?: string;
  models?: string[];
}

interface StoredProviderConfig {
  id: string;
  apiKey: string;
  selectedModel?: string;
  lastValidated: number;
  models?: string[];
}

class KeyManagementService {
  private readonly STORAGE_KEY = 'ai_anki_provider_configs';
  private readonly VALIDATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MODEL_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Validate an API key by making a lightweight test request
   */
  async validateApiKey(provider: LLMProvider): Promise<KeyValidationResult> {
    try {
      if (!provider.apiKey) {
        return { isValid: false, error: 'API key is required' };
      }

      // Test connection with a simple request
      const testResult = await aiService.testConnection(provider);
      
      if (!testResult.success) {
        return { 
          isValid: false, 
          error: testResult.error || 'Failed to validate API key' 
        };
      }

      // If validation successful, try to get available models
      const modelsResult = await aiService.getAvailableModels(provider);
      const models = modelsResult.success ? modelsResult.data : provider.models;

      return {
        isValid: true,
        models: models || provider.models
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message || 'Validation failed'
      };
    }
  }

  /**
   * Automatically discover available models for a provider
   */
  async discoverModels(provider: LLMProvider): Promise<string[]> {
    try {
      const result = await aiService.getAvailableModels(provider);
      return result.success ? result.data : provider.models;
    } catch (error) {
      console.error('Model discovery failed:', error);
      return provider.models;
    }
  }

  /**
   * Securely store provider configuration
   */
  async storeProviderConfig(provider: LLMProvider, models?: string[]): Promise<void> {
    try {
      const configs = this.getStoredConfigs();
      const config: StoredProviderConfig = {
        id: provider.id,
        apiKey: await this.encryptApiKey(provider.apiKey || ''),
        selectedModel: provider.selectedModel,
        lastValidated: Date.now(),
        models: models || provider.models
      };

      configs[provider.id] = config;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
      
      // Update last configured provider
      localStorage.setItem('last_configured_provider', provider.id);
    } catch (error) {
      console.error('Failed to store provider config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Retrieve stored provider configuration
   */
  async getProviderConfig(providerId: string): Promise<StoredProviderConfig | null> {
    try {
      const configs = this.getStoredConfigs();
      const config = configs[providerId];
      
      if (!config) return null;

      // Decrypt API key
      const decryptedApiKey = await this.decryptApiKey(config.apiKey);
      
      return {
        ...config,
        apiKey: decryptedApiKey
      };
    } catch (error) {
      console.error('Failed to retrieve provider config:', error);
      return null;
    }
  }

  /**
   * Get all stored configurations
   */
  private getStoredConfigs(): Record<string, StoredProviderConfig> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored configs:', error);
      return {};
    }
  }

  /**
   * Get the last configured provider ID
   */
  getLastConfiguredProvider(): string | null {
    return localStorage.getItem('last_configured_provider');
  }

  /**
   * Check if a provider configuration is still valid (not expired)
   */
  isConfigurationValid(config: StoredProviderConfig): boolean {
    const now = Date.now();
    return (now - config.lastValidated) < this.VALIDATION_CACHE_TTL;
  }

  /**
   * Check if model cache is still valid
   */
  isModelCacheValid(config: StoredProviderConfig): boolean {
    const now = Date.now();
    return (now - config.lastValidated) < this.MODEL_CACHE_TTL;
  }

  /**
   * Load all provider configurations and restore them
   */
  async loadAllConfigurations(): Promise<Record<string, { apiKey: string; models: string[]; selectedModel?: string }>> {
    const configs = this.getStoredConfigs();
    const result: Record<string, { apiKey: string; models: string[]; selectedModel?: string }> = {};

    for (const [providerId, config] of Object.entries(configs)) {
      try {
        const decryptedApiKey = await this.decryptApiKey(config.apiKey);
        result[providerId] = {
          apiKey: decryptedApiKey,
          models: config.models || [],
          selectedModel: config.selectedModel
        };
      } catch (error) {
        console.error(`Failed to decrypt config for provider ${providerId}:`, error);
      }
    }

    return result;
  }

  /**
   * Clear stored configuration for a provider
   */
  clearProviderConfig(providerId: string): void {
    const configs = this.getStoredConfigs();
    delete configs[providerId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
  }

  /**
   * Clear all stored configurations
   */
  clearAllConfigurations(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('last_configured_provider');
  }

  /**
   * Simple encryption for API keys (using Web Crypto API would be better for production)
   */
  private async encryptApiKey(apiKey: string): Promise<string> {
    // For now, use base64 encoding. In production, use Web Crypto API
    return btoa(apiKey);
  }

  /**
   * Simple decryption for API keys
   */
  private async decryptApiKey(encryptedKey: string): Promise<string> {
    try {
      return atob(encryptedKey);
    } catch (error) {
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Validate and refresh provider configuration if needed
   */
  async refreshProviderConfig(provider: LLMProvider): Promise<{ isValid: boolean; models?: string[]; error?: string }> {
    const storedConfig = await this.getProviderConfig(provider.id);
    
    // If no stored config or validation expired, validate again
    if (!storedConfig || !this.isConfigurationValid(storedConfig)) {
      const validation = await this.validateApiKey(provider);
      
      if (validation.isValid) {
        await this.storeProviderConfig(provider, validation.models);
        return { isValid: true, models: validation.models };
      } else {
        return { isValid: false, error: validation.error };
      }
    }

    // If model cache expired, refresh models
    if (!this.isModelCacheValid(storedConfig)) {
      const models = await this.discoverModels(provider);
      await this.storeProviderConfig(provider, models);
      return { isValid: true, models };
    }

    return { isValid: true, models: storedConfig.models };
  }
}

export const keyManagementService = new KeyManagementService();
export default keyManagementService;