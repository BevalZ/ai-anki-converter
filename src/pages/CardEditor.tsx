import { useState } from 'react';
import { Edit, Trash2, CheckSquare, Square, Sparkles, Save, X, Plus, Tag, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import CardContent from '@/components/CardContent';



export default function CardEditor() {
  const {
    cards,
    selectedCards,
    bucketCards,
    updateCard,
    deleteCard,
    deleteCards,
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    enhanceCard,
    toggleBucketCard,
    addSelectedToBucket,
    llmProviders,
    selectedProvider
  } = useAppStore();
  const { t } = useTranslation();

  const cardTypes = [
    { id: 'basic', label: t('basic') },
    { id: 'cloze', label: t('cloze') },
    { id: 'definition', label: t('definition') },
  ];

  const difficultyLevels = [
    { id: 'easy', label: t('easy'), color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    { id: 'medium', label: t('medium'), color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    { id: 'hard', label: t('hard'), color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
  ];

  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    front: string;
    back: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'basic' | 'cloze' | 'definition';
  }>({
    front: '',
    back: '',
    tags: [],
    difficulty: 'medium',
    type: 'basic'
  });
  const [newTag, setNewTag] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const currentProvider = llmProviders.find(p => p.id === selectedProvider);
  const hasApiKey = currentProvider?.apiKey && currentProvider.apiKey.length > 0;

  const startEditing = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setEditForm({
          front: card.front,
          back: card.back,
          tags: [...card.tags],
          difficulty: card.difficulty,
          type: card.type
        });
      setEditingCard(cardId);
    }
  };

  const saveCard = () => {
    if (!editingCard) return;
    
    if (!editForm.front.trim() || !editForm.back.trim()) {
      toast.error(t('bothFrontBackRequired'));
      return;
    }

    updateCard(editingCard, editForm);
    setEditingCard(null);
    toast.success(t('cardUpdatedSuccessfully'));
  };

  const cancelEditing = () => {
    setEditingCard(null);
    setEditForm({
      front: '',
      back: '',
      tags: [],
      difficulty: 'medium',
      type: 'basic'
    });
  };

  const addTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEnhanceCard = async (cardId: string) => {
    if (!hasApiKey) {
      toast.error(t('configureApiKey'));
      return;
    }

    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    setIsEnhancing(true);
    try {
      await enhanceCard(cardId);
      toast.success(t('cardEnhancedSuccessfully'));
    } catch (error) {
      toast.error(t('failedToEnhanceCard'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCards.length === 0) {
      toast.error(t('noCardsSelected'));
      return;
    }

    deleteCards(selectedCards);
    toast.success(`${selectedCards.length} ${t('cardsDeleted')}`);
  };

  const handleBulkAddToBucket = () => {
    if (selectedCards.length === 0) {
      toast.error(t('noCardsSelected'));
      return;
    }

    addSelectedToBucket();
    toast.success(`${selectedCards.length} cards added to bucket`);
  };

  const allSelected = cards.length > 0 && selectedCards.length === cards.length;
  const someSelected = selectedCards.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('cardEditor')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('cardEditorDescription')}
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <Edit className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noCardsToEdit')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('noCardsToEditDescription')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={allSelected ? clearSelection : selectAllCards}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span>
                      {allSelected ? t('deselectAll') : t('selectAll')} ({cards.length})
                    </span>
                  </button>
                  
                  {someSelected && (
                    <span className="text-sm text-blue-600 font-medium">
                      {`${selectedCards.length} ${t('selected')}`}
                    </span>
                  )}
                </div>

                {someSelected && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBulkAddToBucket}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>{t('addSelectedToBucket')}</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t('deleteSelected')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={cn(
                    'bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-colors',
                    selectedCards.includes(card.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  {editingCard === card.id ? (
                    /* Edit Mode */
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('front')}
                          </label>
                          <textarea
                            value={editForm.front}
                            onChange={(e) => setEditForm(prev => ({ ...prev, front: e.target.value }))}
                            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder={t('enterQuestionFrontSide')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('back')}
                          </label>
                          <textarea
                            value={editForm.back}
                            onChange={(e) => setEditForm(prev => ({ ...prev, back: e.target.value }))}
                            className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder={t('enterAnswerBackSide')}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('type')}
                            </label>
                            <select
                              value={editForm.type}
                              onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {cardTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('difficulty')}
                            </label>
                            <select
                              value={editForm.difficulty}
                              onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {difficultyLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('tags')}
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editForm.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                              >
                                {tag}
                                <button
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addTag()}
                              placeholder={t('addTag')}
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={addTag}
                              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            onClick={saveCard}
                            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            <Save className="h-4 w-4" />
                            <span>{t('save')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <button
                          onClick={() => toggleCardSelection(card.id)}
                          className="flex-shrink-0 mr-3 mt-1"
                        >
                          {selectedCards.includes(card.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="mb-3">
                            <div className="text-sm text-blue-600 font-medium mb-1">{t('front')}</div>
                            <p className="text-gray-900 dark:text-white">{card.front}</p>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-sm text-green-600 font-medium mb-1">{t('back')}</div>
                            <div className="text-gray-900 dark:text-white">
                              <CardContent content={card.back} isBack={true} />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="capitalize">{card.type}</span>
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              difficultyLevels.find(d => d.id === card.difficulty)?.color
                            )}>
                              {card.difficulty}
                            </span>
                            {card.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Tag className="h-3 w-3" />
                                <span>{card.tags.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => startEditing(card.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            title={t('editCard')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEnhanceCard(card.id)}
                            disabled={!hasApiKey || isEnhancing}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('enhanceWithAI')}
                          >
                            <Sparkles className={cn(
                              'h-4 w-4',
                              isEnhancing && 'animate-pulse'
                            )} />
                          </button>
                          
                          <button
                            onClick={() => {
                              toggleBucketCard(card.id);
                              const isInBucket = bucketCards.includes(card.id);
                              toast.success(isInBucket ? t('removedFromBucket') : t('addedToBucket'));
                            }}
                            className={cn(
                              'p-2 rounded transition-colors',
                              bucketCards.includes(card.id)
                                 ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                                 : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                            )}
                            title={bucketCards.includes(card.id) ? t('removeFromBucket') : t('addToBucket')}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            title={t('deleteCard')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}