import { useState } from 'react';
import { ShoppingCart, X, Download, Trash2, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

export default function CardBucket() {
  const {
    cards,
    bucketCards,
    removeFromBucket,
    clearBucket,
    getBucketCards,
    isBucketVisible,
    setBucketVisible
  } = useAppStore();
  const { t } = useTranslation();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  const bucketCardData = getBucketCards();
  const bucketCount = bucketCards.length;
  
  // Only render if there are cards in the bucket and it's visible
  if (bucketCount === 0) {
    return null;
  }
  
  if (!isBucketVisible) {
    return null;
  }
  
  const handleExportBucket = () => {
    navigate('/export?bucket=true');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bucket Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          {bucketCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {bucketCount}
            </span>
          )}
        </button>
        
        {/* Hide Button */}
        <button
          onClick={() => setBucketVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1 text-xs"
        >
          <EyeOff className="h-3 w-3" />
        </button>
      </div>
      
      {/* Expanded Bucket */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>{t('exportBucket')} ({bucketCount})</span>
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Card List */}
          <div className="max-h-64 overflow-y-auto">
            {bucketCardData.map((card) => (
              <div
                key={card.id}
                className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {card.front}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {card.back}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        card.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        card.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      )}>
                        {card.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {card.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromBucket(card.id)}
                    className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={handleExportBucket}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>{t('exportSelectedCards')}</span>
            </button>
            <button
              onClick={clearBucket}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('clearBucket')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}