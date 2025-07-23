import { useState, useEffect } from 'react';
import { Brain, Sparkles, FileText, Zap, ChevronLeft, ChevronRight, RotateCcw, Trash2, ShoppingCart, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CardContent from '@/components/CardContent';

type TabType = 'input' | 'processed';

const getDifficultyLevels = (t: any) => [
  { id: 'easy', label: t('easy'), color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
  { id: 'medium', label: t('medium'), color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
  { id: 'hard', label: t('hard'), color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
];

export default function Home() {
  const {
    inputText,
    setInputText,
    processedText,
    setProcessedText,
    knowledgePoints,
    cards,
    llmProviders,
    selectedProvider,
    setSelectedProvider,
    setProviderSelectedModel,
    isProcessing,
    generateCards,
    summarizeText,
    rearrangeContent,
    deleteCard,
    bucketCards,
    toggleBucketCard
  } = useAppStore();
  const { t } = useTranslation();

  const [selectedCardType, setSelectedCardType] = useState<'basic' | 'cloze' | 'definition'>('basic');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [maxCards, setMaxCards] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('input');

  // 自动恢复卡片预览状态
  useEffect(() => {
    if (cards.length > 0 && !showCardPreview) {
      setShowCardPreview(true);
    }
  }, [cards.length, showCardPreview]);

  const cardTypes = [
    { id: 'basic', label: t('basicQA'), description: t('basicQADescription') },
    { id: 'cloze', label: t('clozeDeletion'), description: t('clozeDescription') },
    { id: 'definition', label: t('definition'), description: t('definitionDescription') },
  ];
  const difficultyLevels = getDifficultyLevels(t);

  const currentProvider = llmProviders.find(p => p.id === selectedProvider);
  const hasApiKey = currentProvider?.apiKey && currentProvider.apiKey.length > 0;

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast.error(t('pleaseEnterTextToSummarize'));
      return;
    }

    if (!hasApiKey) {
      toast.error(t('pleaseConfigureApiKey'));
      return;
    }

    await summarizeText(inputText);
  };

  const handleRearrange = async () => {
    if (!inputText.trim()) {
      toast.error(t('pleaseEnterTextToRearrange'));
      return;
    }

    if (!hasApiKey) {
      toast.error(t('pleaseConfigureApiKey'));
      return;
    }

    const result = await rearrangeContent(inputText);
    if (result && result.count > 0) {
      setMaxCards(result.count);
      setActiveTab('processed');
      toast.success(t('knowledgePointsExtracted', { count: result.count }));
    }
  };

  const handleGenerateCards = async () => {
    if (!hasApiKey) {
      toast.error(t('pleaseConfigureApiKey'));
      return;
    }

    try {
      // If we have knowledge points, generate cards for each point
      if (knowledgePoints && knowledgePoints.length > 0) {
        const cardsToGenerate = Math.min(knowledgePoints.length, maxCards);
        // Generate cards for each knowledge point without individual toasts
        for (let i = 0; i < cardsToGenerate; i++) {
          const point = knowledgePoints[i];
          await generateCards(point, selectedCardType, selectedDifficulty, 1, true); // Pass silent flag
        }
        // Show single success toast after all cards are generated
        toast.success(t('cardsGeneratedFromKnowledgePoints', { count: cardsToGenerate }));
      } else {
        // Fallback to original behavior
        const textToUse = processedText || inputText;
        
        if (!textToUse.trim()) {
          toast.error(t('pleaseEnterTextToGenerate'));
          return;
        }

        await generateCards(textToUse, selectedCardType, selectedDifficulty, maxCards);
      }
      setShowCardPreview(true);
    } catch (error) {
      console.error('Card generation error:', error);
    }
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const currentCard = cards[currentCardIndex];

  const handleDeleteCard = () => {
    if (currentCard) {
      deleteCard(currentCard.id);
      toast.success(t('cardDeleted'));
      
      // Adjust current index if needed
      if (currentCardIndex >= cards.length - 1 && cards.length > 1) {
        setCurrentCardIndex(cards.length - 2);
      } else if (cards.length === 1) {
        setShowCardPreview(false);
        setCurrentCardIndex(0);
      }
      setIsFlipped(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input and Controls */}
          <div className="space-y-6">
            {/* LLM Provider Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                {t('aiProvider')}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('provider')}
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {llmProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {currentProvider && currentProvider.models.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('model')}
                    </label>
                    <select
                      value={currentProvider.selectedModel || currentProvider.models[0] || ''}
                      onChange={(e) => setProviderSelectedModel(currentProvider.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {currentProvider.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {!hasApiKey && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                    {t('apiKeyNotConfigured')}
                  </p>
                )}
              </div>
            </div>

            {/* Tabbed Text Area */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  {t('content')}
                </h2>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('input')}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                      activeTab === 'input'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {t('inputTab')}
                  </button>
                  <button
                    onClick={() => setActiveTab('processed')}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                      activeTab === 'processed'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {t('processedTab')}
                    {processedText && (
                      <span className="ml-1 inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="relative">
                {activeTab === 'input' ? (
                  <div className="space-y-3">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={t('inputPlaceholder')}
                      className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 overflow-x-auto"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {inputText.length} {t('characters')}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSummarize}
                          disabled={isProcessing || !hasApiKey}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{t('summarizeText')}</span>
                        </button>
                        <button
                          onClick={handleRearrange}
                          disabled={isProcessing || !hasApiKey}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Zap className="h-4 w-4" />
                          <span>{t('rearrangeContent')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processedText ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-48 overflow-auto">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{processedText}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-48 flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('noCardsGenerated')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {processedText ? `${processedText.length} ${t('characters')}` : t('noContent')}
                      </span>
                      <button
                        onClick={() => setProcessedText('')}
                        disabled={!processedText}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('clear')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generation Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cardType')} {t('settings')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cardType')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {cardTypes.map((type) => (
                      <label key={type.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="cardType"
                          value={type.id}
                          checked={selectedCardType === type.id}
                          onChange={(e) => setSelectedCardType(e.target.value as 'basic' | 'cloze' | 'definition')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('difficulty')}
                  </label>
                  <div className="flex space-x-2">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setSelectedDifficulty(level.id as 'easy' | 'medium' | 'hard')}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          selectedDifficulty === level.id
                            ? level.color
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('maxCards')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxCards}
                    onChange={(e) => setMaxCards(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleGenerateCards}
                  disabled={isProcessing || !hasApiKey}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>{t('loading')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>{t('generateCards')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {showCardPreview && cards.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('cardPreview')}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentCardIndex + 1} of {cards.length}
                  </span>
                </div>

                {/* Card Display */}
                <div className="mb-6">
                  <div
                    className="relative h-64 cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className={cn(
                      'relative w-full h-full transition-transform duration-700 transform-gpu preserve-3d',
                      isFlipped ? 'rotate-y-180' : 'rotate-y-0'
                    )}>
                      {/* Front of card */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-700 p-6 flex items-center justify-center backface-hidden">
                        <div className="text-center overflow-auto max-h-full w-full">
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">{t('front')}</div>
                          <p className="text-gray-900 dark:text-white text-lg font-medium break-words">{currentCard?.front}</p>
                        </div>
                      </div>
                      
                      {/* Back of card */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-700 p-6 flex items-center justify-center backface-hidden rotate-y-180">
                        <div className="text-center overflow-auto max-h-full w-full">
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">{t('back')}</div>
                          <CardContent content={currentCard?.back || ''} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center mt-4 space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(!isFlipped);
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>{t('flipCard')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) {
                          toggleBucketCard(currentCard.id);
                          const isInBucket = bucketCards.includes(currentCard.id);
                          toast.success(isInBucket ? t('removedFromExportBucket') : t('addedToExportBucket'));
                        }
                      }}
                      className={cn(
                        'flex items-center space-x-1 px-3 py-1 text-sm transition-colors',
                        currentCard && bucketCards.includes(currentCard.id)
                          ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                          : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
                      )}
                    >
                      {currentCard && bucketCards.includes(currentCard.id) ? (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          <span>{t('inBucket')}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{t('addToBucket')}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard();
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t('deleteCard')}</span>
                    </button>
                  </div>
                </div>

                {/* Card Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t('previous')}</span>
                  </button>
                  
                  <div className="flex space-x-1">
                    {cards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentCardIndex(index);
                          setIsFlipped(false);
                        }}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === currentCardIndex ? 'bg-blue-600' : 'bg-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={nextCard}
                    disabled={currentCardIndex === cards.length - 1}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t('next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Card Info */}
                {currentCard && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <span>{t('type')}:</span>
                        <span className="font-medium capitalize text-gray-900 dark:text-white">{currentCard.type}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>{t('difficulty')}:</span>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          difficultyLevels.find(d => d.id === currentCard.difficulty)?.color
                        )}>
                          {currentCard.difficulty}
                        </span>
                      </span>
                      {currentCard.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>{t('tags')}:</span>
                          <div className="flex space-x-1">
                            {currentCard.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noCardsGenerated')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('noCardsGeneratedDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}