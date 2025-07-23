import { useState, useEffect } from 'react';
import { Download, FileText, Package, Share2, Copy, CheckCircle, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remark } from 'remark';
import remarkHtml from 'remark-html';



export default function Export() {
  const { cards, getBucketCards } = useAppStore();
  const { t } = useTranslation();
  
  const exportFormats = [
    {
      id: 'apkg',
      name: t('exportFormats.anki'),
      description: t('exportFormats.ankiDescription'),
      icon: Package,
      recommended: true
    },
    {
      id: 'csv',
      name: t('exportFormats.csv'),
      description: t('exportFormats.csvDescription'),
      icon: FileText,
      recommended: false
    },
    {
      id: 'json',
      name: t('exportFormats.json'),
      description: t('exportFormats.jsonDescription'),
      icon: FileText,
      recommended: false
    },
    {
      id: 'txt',
      name: t('exportFormats.txt'),
      description: t('exportFormats.txtDescription'),
      icon: FileText,
      recommended: false
    }
  ];
  const [searchParams] = useSearchParams();
  const [selectedFormat, setSelectedFormat] = useState('apkg');
  const [deckName, setDeckName] = useState('My Anki Deck');
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isBucketMode, setIsBucketMode] = useState(false);
  
  // Determine if we're in bucket mode
  useEffect(() => {
    const bucketParam = searchParams.get('bucket');
    setIsBucketMode(bucketParam === 'true');
    if (bucketParam === 'true') {
      setDeckName(t('selectedCardsFromBucket'));
    }
  }, [searchParams]);
  
  // Get the appropriate cards to export
  const cardsToExport = isBucketMode ? getBucketCards() : cards;

  // Convert markdown/HTML content to HTML for export
  const convertToHtml = async (content: string): Promise<string> => {
    const hasHtmlOrMarkdown = /<[^>]*>|```|\*\*|__|\[.*\]\(.*\)|#{1,6}\s/.test(content);
    
    if (hasHtmlOrMarkdown) {
      try {
        const result = await remark()
          .use(remarkGfm)
          .use(remarkHtml, { sanitize: false })
          .process(content);
        return String(result);
      } catch (error) {
        console.warn('Failed to convert markdown to HTML:', error);
        return content;
      }
    }
    
    return content;
  };

  const generateCSV = async () => {
    const headers = [t('front'), t('back'), t('type'), t('difficulty'), t('tags')];
    const rows = await Promise.all(
      cardsToExport.map(async (card) => {
        const frontHtml = await convertToHtml(card.front);
        const backHtml = await convertToHtml(card.back);
        return [
          `"${frontHtml.replace(/"/g, '""')}"`,
          `"${backHtml.replace(/"/g, '""')}"`,
          card.type,
          card.difficulty,
          card.tags.join(';')
        ];
      })
    );
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateJSON = async () => {
    const cardsWithHtml = await Promise.all(
      cardsToExport.map(async (card) => {
        const frontHtml = await convertToHtml(card.front);
        const backHtml = await convertToHtml(card.back);
        return {
          front: card.front,
          back: card.back,
          frontHtml,
          backHtml,
          type: card.type,
          difficulty: card.difficulty,
          tags: card.tags,
          createdAt: card.createdAt
        };
      })
    );
    
    return JSON.stringify({
      deckName,
      exportDate: new Date().toISOString(),
      cards: cardsWithHtml
    }, null, 2);
  };

  const generateTXT = async () => {
    const cardsText = await Promise.all(
      cardsToExport.map(async (card, index) => {
        const frontHtml = await convertToHtml(card.front);
        const backHtml = await convertToHtml(card.back);
        return `${t('card')} ${index + 1}:\n${t('question')}: ${frontHtml}\n${t('answer')}: ${backHtml}\n${t('type')}: ${card.type}\n${t('difficulty')}: ${card.difficulty}\n${t('tags')}: ${card.tags.join(', ')}\n\n`;
      })
    );
    return cardsText.join('');
  };

  const generateAnkiPackage = async () => {
    const zip = new JSZip();
    
    // Create a simple Anki deck structure
    const deckData = {
      __type__: 'Deck',
      children: [],
      collapsed: false,
      conf: 1,
      desc: '',
      dyn: 0,
      extendNew: 10,
      extendRev: 50,
      id: Date.now(),
      lrnToday: [0, 0],
      mod: Math.floor(Date.now() / 1000),
      name: deckName,
      newToday: [0, 0],
      revToday: [0, 0],
      timeToday: [0, 0],
      usn: -1
    };
    
    // Create notes data with HTML content
    const notes = await Promise.all(
      cardsToExport.map(async (card, index) => {
        const frontHtml = await convertToHtml(card.front);
        const backHtml = await convertToHtml(card.back);
        return {
          id: Date.now() + index,
          guid: crypto.randomUUID(),
          mid: 1,
          mod: Math.floor(Date.now() / 1000),
          usn: -1,
          tags: card.tags,
          flds: [frontHtml, backHtml],
          sfld: frontHtml,
          csum: 0,
          flags: 0,
          data: ''
        };
      })
    );
    
    // Create collection data
    const collection = {
      id: Date.now(),
      crt: Math.floor(Date.now() / 1000),
      mod: Math.floor(Date.now() / 1000),
      scm: Math.floor(Date.now() / 1000),
      ver: 11,
      dty: 0,
      usn: 0,
      ls: 0,
      conf: {},
      models: {
        '1': {
          id: 1,
          name: 'Basic',
          type: 0,
          mod: Math.floor(Date.now() / 1000),
          usn: -1,
          sortf: 0,
          did: Date.now(),
          tmpls: [{
            name: 'Card 1',
            ord: 0,
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}<hr id="answer">{{Back}}',
            did: null,
            bqfmt: '',
            bafmt: ''
          }],
          flds: [
            { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20 },
            { name: 'Back', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20 }
          ],
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
          latexPre: '',
          latexPost: ''
        }
      },
      decks: {
        [Date.now()]: deckData
      },
      dconf: {},
      tags: {}
    };
    
    // Add files to zip
    zip.file('collection.anki2', JSON.stringify({ collection, notes }));
    zip.file('media', '{}');
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const handleExport = async () => {
    if (cardsToExport.length === 0) {
      toast.error(isBucketMode ? t('noCardsInBucketToExport') : t('noCardsToExport'));
      return;
    }

    setIsExporting(true);
    
    try {
      let content: string | Blob;
      let filename: string;
      let mimeType: string;

      switch (selectedFormat) {
        case 'csv':
          content = await generateCSV();
          filename = `${deckName.replace(/[^a-z0-9]/gi, '_')}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = await generateJSON();
          filename = `${deckName.replace(/[^a-z0-9]/gi, '_')}.json`;
          mimeType = 'application/json';
          break;
        case 'txt':
          content = await generateTXT();
          filename = `${deckName.replace(/[^a-z0-9]/gi, '_')}.txt`;
          mimeType = 'text/plain';
          break;
        case 'apkg':
          content = await generateAnkiPackage();
          filename = `${deckName.replace(/[^a-z0-9]/gi, '_')}.apkg`;
          mimeType = 'application/zip';
          break;
        default:
          throw new Error(t('unsupportedFormat'));
      }

      if (typeof content === 'string') {
        const blob = new Blob([content], { type: mimeType });
        saveAs(blob, filename);
      } else {
        saveAs(content, filename);
      }

      toast.success(t('exportedCardsSuccessfully'));
    } catch (error) {
      toast.error(t('failedToExportCards'));
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (cardsToExport.length === 0) {
      toast.error(isBucketMode ? t('noCardsInBucketToShare') : t('noCardsToShare'));
      return;
    }

    // Generate a shareable URL (mock implementation)
    const shareData = {
      deckName,
      cards: cardsToExport.map(card => ({
        front: card.front,
        back: card.back,
        type: card.type,
        difficulty: card.difficulty,
        tags: card.tags
      }))
    };
    
    // In a real app, you'd upload this to a server and get a share URL
    const encodedData = btoa(JSON.stringify(shareData));
    const mockShareUrl = `${window.location.origin}/shared/${encodedData.slice(0, 12)}`;
    
    setShareUrl(mockShareUrl);
    setShowShareDialog(true);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('shareUrlCopied'));
    } catch (error) {
      toast.error(t('failedToCopyUrl'));
    }
  };

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isBucketMode ? t('exportSelectedCards') : t('exportCards')}
            </h1>
            {isBucketMode && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                <ShoppingCart className="h-4 w-4" />
                <span>{t('fromBucket')}</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isBucketMode 
              ? t('exportBucketDescription')
              : t('exportDescription')
            }
          </p>
        </div>

        {cardsToExport.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <Download className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isBucketMode ? t('noCardsInBucket') : t('noCardsToExport')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isBucketMode 
                  ? t('noCardsInBucketDescription')
                  : t('noCardsToExportDescription')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Export Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deck Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('deckSettings')}</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('deckName')}
                  </label>
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('enterDeckName')}
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('exportFormat')}</h2>
                <div className="space-y-3">
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <label
                        key={format.id}
                        className={cn(
                          'flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        )}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          checked={selectedFormat === format.id}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">{format.name}</span>
                            {format.recommended && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                {t('recommended')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{format.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Export Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('exportActions')}</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>{t('exporting')}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>{t('download')} {selectedFormatData?.name}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>{t('shareDeck')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('exportPreview')}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('totalCards')}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cardsToExport.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('deckName')}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{deckName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('format')}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedFormatData?.name}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('cardTypes')}:</h3>
                    <div className="space-y-1">
                      {['basic', 'cloze', 'definition'].map(type => {
                        const count = cards.filter(card => card.type === type).length;
                        if (count === 0) return null;
                        return (
                          <div key={type} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="capitalize">{type}:</span>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{t('difficultyLevels')}:</h3>
                    <div className="space-y-1">
                      {['easy', 'medium', 'hard'].map(difficulty => {
                        const count = cards.filter(card => card.difficulty === difficulty).length;
                        if (count === 0) return null;
                        return (
                          <div key={difficulty} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="capitalize">{difficulty}:</span>
                            <span>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('deckSharedSuccessfully')}</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('deckSharedDescription')}
              </p>
              
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}