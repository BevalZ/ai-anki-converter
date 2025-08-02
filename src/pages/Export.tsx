import { useState, useEffect } from 'react';
import { Download, FileText, Package, Share2, Zap, ShoppingCart, CheckCircle, Copy, AlertCircle, Image, Eye } from 'lucide-react';
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
import ankiConnectService from '@/services/ankiConnectService';
import { exportCardsAsImages, createCardPreview, ImageFormat, ImageExportOptions } from '@/utils/imageExport';



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
      id: 'image',
      name: 'Images',
      description: 'Export cards as images (PNG, JPEG, SVG)',
      icon: Image,
      recommended: false
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

  const imageFormats = [
    { id: 'png' as ImageFormat, name: 'PNG', description: 'High quality with transparency support' },
    { id: 'jpeg' as ImageFormat, name: 'JPEG', description: 'Smaller file size, good for photos' },
    { id: 'svg' as ImageFormat, name: 'SVG', description: 'Vector format, scalable and small' }
  ];
  const [searchParams] = useSearchParams();
  const [selectedFormat, setSelectedFormat] = useState('apkg');
  const [deckName, setDeckName] = useState('My Anki Deck');
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isBucketMode, setIsBucketMode] = useState(false);
  const [isImportingToAnki, setIsImportingToAnki] = useState(false);
  const [ankiConnected, setAnkiConnected] = useState(false);
  const [showAnkiDialog, setShowAnkiDialog] = useState(false);
  const [selectedAnkiDeck, setSelectedAnkiDeck] = useState('');
  const [availableDecks, setAvailableDecks] = useState<string[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  
  // Image export states
  const [selectedImageFormat, setSelectedImageFormat] = useState<ImageFormat>('png');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [cardPreviews, setCardPreviews] = useState<Map<string, string>>(new Map());
  
  // CSV export options
  const [includeCSVHeaders, setIncludeCSVHeaders] = useState(false);
  
  // Determine if we're in bucket mode
  useEffect(() => {
    const bucketParam = searchParams.get('bucket');
    const bucketCards = getBucketCards();
    
    // If explicitly set via URL parameter, use that
    if (bucketParam === 'true') {
      setIsBucketMode(true);
      setDeckName(t('selectedCardsFromBucket'));
    } 
    // If no URL parameter but bucket has cards, default to bucket mode
    else if (bucketParam !== 'false' && bucketCards.length > 0) {
      setIsBucketMode(true);
      setDeckName(t('selectedCardsFromBucket'));
    }
    // Otherwise use all cards mode
    else {
      setIsBucketMode(false);
      setDeckName('My Anki Deck');
    }
  }, [searchParams, t]);

  // Update deck name when bucket mode changes
  useEffect(() => {
    if (isBucketMode) {
      setDeckName(t('selectedCardsFromBucket'));
    }
  }, [isBucketMode, t]);

  // Check AnkiConnect connection on component mount
  useEffect(() => {
    const checkAnkiConnection = async () => {
      try {
        const connected = await ankiConnectService.checkConnection();
        setAnkiConnected(connected);
        if (connected) {
          const decks = await ankiConnectService.getDeckNames();
          setAvailableDecks(decks);
          if (decks.length > 0) {
            setSelectedAnkiDeck(decks[0]);
          }
        }
      } catch (error) {
        setAnkiConnected(false);
      }
    };
    
    checkAnkiConnection();
  }, []);
  
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

  // Format content as styled HTML div for Anki import
  const formatAsStyledDiv = (content: string): string => {
    const baseStyle = "font-family: Arial; font-size: 16px;";
    return `<div style='${baseStyle}'>${content}</div>`;
  };

  // Properly escape content for CSV export
  const escapeCSVField = (content: string, isHtmlField = false): string => {
    let processed = content;
    
    if (!isHtmlField) {
      // For non-HTML fields (like questions), clean up formatting
      processed = content
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      // For HTML fields, preserve structure but clean line breaks
      processed = content
        .replace(/\r?\n/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Always wrap in quotes and escape internal quotes
    return `"${processed.replace(/"/g, '""')}"`;
  };

  const generateCSV = async () => {
    const rows = await Promise.all(
      cardsToExport.map(async (card) => {
        // Convert markdown to HTML for the back content
        const backHtml = await convertToHtml(card.back);
        
        // Format the front (question) - keep it simple, no HTML conversion needed
        const frontText = card.front
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
          .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .trim();
        
        // Format the back as styled HTML div
        const styledBackHtml = formatAsStyledDiv(backHtml);
        
        // Create CSV row with only front and back (Anki format)
        const frontField = escapeCSVField(frontText, false);
        const backField = escapeCSVField(styledBackHtml, true);
        
        return [frontField, backField];
      })
    );
    
    // Optionally include headers (only for front and back)
    const allRows = includeCSVHeaders 
      ? [[
          escapeCSVField(t('front')),
          escapeCSVField(t('back'))
        ], ...rows]
      : rows;
    
    return allRows.map(row => row.join(',')).join('\n');
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
        case 'image':
          await handleImageExport();
          return;
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

  const handleImageExport = async () => {
    if (selectedCards.size === 0) {
      // If no cards selected, export all cards
      const allCardIds = new Set(cardsToExport.map(card => card.id));
      setSelectedCards(allCardIds);
      
      const options: ImageExportOptions = {
        format: selectedImageFormat,
        quality: selectedImageFormat === 'jpeg' ? 0.9 : undefined,
        width: 800,
        height: 600
      };
      
      await exportCardsAsImages(cardsToExport, options, deckName);
    } else {
      // Export only selected cards
      const selectedCardsList = cardsToExport.filter(card => selectedCards.has(card.id));
      
      const options: ImageExportOptions = {
        format: selectedImageFormat,
        quality: selectedImageFormat === 'jpeg' ? 0.9 : undefined,
        width: 800,
        height: 600
      };
      
      await exportCardsAsImages(selectedCardsList, options, deckName);
    }
  };

  const generateCardPreviews = async () => {
    const previews = new Map<string, string>();
    
    for (const card of cardsToExport) {
      try {
        const previewUrl = await createCardPreview(card, {
          format: selectedImageFormat,
          width: 400,
          height: 300
        });
        previews.set(card.id, previewUrl);
      } catch (error) {
        console.error(`Failed to generate preview for card ${card.id}:`, error);
      }
    }
    
    setCardPreviews(previews);
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const selectAllCards = () => {
    const allCardIds = new Set(cardsToExport.map(card => card.id));
    setSelectedCards(allCardIds);
  };

  const deselectAllCards = () => {
    setSelectedCards(new Set());
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

  const handleAnkiImport = async () => {
    if (cardsToExport.length === 0) {
      toast.error(isBucketMode ? t('noCardsInBucketToExport') : t('noCardsToExport'));
      return;
    }

    if (!ankiConnected) {
      toast.error('无法连接到Anki。请确保Anki正在运行并且已安装AnkiConnect插件。');
      return;
    }

    setShowAnkiDialog(true);
  };

  const confirmAnkiImport = async () => {
    if (!selectedAnkiDeck && !newDeckName) {
      toast.error('请选择或创建一个牌组');
      return;
    }

    setIsImportingToAnki(true);
    
    try {
      const targetDeck = newDeckName || selectedAnkiDeck;
      
      const result = await ankiConnectService.addNotes(cardsToExport, targetDeck);
      
      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 张卡片到Anki`);
        if (result.failed > 0) {
          toast.warning(`${result.failed} 张卡片导入失败`);
        }
      } else {
        toast.error('所有卡片导入失败');
      }
      
      setShowAnkiDialog(false);
      setNewDeckName('');
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsImportingToAnki(false);
    }
  };

  const refreshAnkiConnection = async () => {
    try {
      const connected = await ankiConnectService.checkConnection();
      setAnkiConnected(connected);
      if (connected) {
        const decks = await ankiConnectService.getDeckNames();
        setAvailableDecks(decks);
        if (decks.length > 0 && !selectedAnkiDeck) {
          setSelectedAnkiDeck(decks[0]);
        }
        toast.success('已连接到Anki');
      } else {
        toast.error('无法连接到Anki');
      }
    } catch (error) {
      setAnkiConnected(false);
      toast.error('连接Anki失败');
    }
  };

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
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
            
            {/* Mode Toggle Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsBucketMode(true);
                  setDeckName(t('selectedCardsFromBucket'));
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isBucketMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={getBucketCards().length === 0}
              >
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Bucket ({getBucketCards().length})</span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setIsBucketMode(false);
                  setDeckName('My Anki Deck');
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !isBucketMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>所有卡片 ({cards.length})</span>
                </div>
              </button>
            </div>
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
                
                {/* Image Format Options */}
                {selectedFormat === 'image' && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Image Format Options</h3>
                    <div className="space-y-3">
                      {imageFormats.map((format) => (
                        <label
                          key={format.id}
                          className={cn(
                            'flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                            selectedImageFormat === format.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="imageFormat"
                            value={format.id}
                            checked={selectedImageFormat === format.id}
                            onChange={(e) => setSelectedImageFormat(e.target.value as ImageFormat)}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{format.name}</span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{format.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => {
                          setShowImagePreview(true);
                          generateCardPreviews();
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview Cards</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* CSV Format Options */}
                {selectedFormat === 'csv' && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">CSV导出选项</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={includeCSVHeaders}
                          onChange={(e) => setIncludeCSVHeaders(e.target.checked)}
                          className="text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">包含表头</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">在CSV文件第一行添加列标题（正面、背面、类型、难度、标签）</p>
                        </div>
                      </label>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                          <p><strong>Anki专用格式：</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>仅导出两列：问题和答案</li>
                            <li>答案包装在带样式的HTML div中</li>
                            <li>问题为纯文本，答案为HTML格式</li>
                            <li>完全兼容Anki导入格式</li>
                            <li>保持原有的文本格式和代码高亮</li>
                          </ul>
                          <p className="mt-2"><strong>示例格式：</strong></p>
                          <code className="text-xs bg-white dark:bg-gray-800 p-1 rounded">
                            问题,"&lt;div style='...'&gt;答案内容&lt;/div&gt;"
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('exportActions')}</h2>
                
                {/* AnkiConnect Status */}
                <div className="mb-4 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        ankiConnected ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Anki {ankiConnected ? '已连接' : '未连接'}
                      </span>
                    </div>
                    <button
                      onClick={refreshAnkiConnection}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      刷新
                    </button>
                  </div>
                  {!ankiConnected && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      请确保Anki正在运行并已安装AnkiConnect插件
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span className="text-sm">{t('exporting')}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span className="text-sm">{t('download')}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleAnkiImport}
                    disabled={!ankiConnected || isImportingToAnki}
                    className={cn(
                      "flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm",
                      ankiConnected
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed",
                      isImportingToAnki && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isImportingToAnki ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>导入中</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>导入Anki</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">{t('shareDeck')}</span>
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

        {/* Anki Import Dialog */}
        {showAnkiDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">导入到Anki</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                将 {cardsToExport.length} 张卡片导入到Anki牌组中
              </p>
              
              <div className="space-y-4">
                {/* 选择现有牌组 */}
                {availableDecks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      选择现有牌组
                    </label>
                    <select
                      value={selectedAnkiDeck}
                      onChange={(e) => {
                        setSelectedAnkiDeck(e.target.value);
                        setNewDeckName('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">选择牌组...</option>
                      {availableDecks.map((deck) => (
                        <option key={deck} value={deck}>
                          {deck}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* 或创建新牌组 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    或创建新牌组
                  </label>
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => {
                      setNewDeckName(e.target.value);
                      setSelectedAnkiDeck('');
                    }}
                    placeholder="输入新牌组名称"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                {!ankiConnected && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      无法连接到Anki，请检查Anki是否运行
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAnkiDialog(false);
                    setNewDeckName('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={confirmAnkiImport}
                  disabled={(!selectedAnkiDeck && !newDeckName) || isImportingToAnki || !ankiConnected}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImportingToAnki ? '导入中...' : '确认导入'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Dialog */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Image className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Card Preview - {selectedImageFormat.toUpperCase()}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllCards}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllCards}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => setShowImagePreview(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cardsToExport.map((card) => {
                    const previewUrl = cardPreviews.get(card.id);
                    const isSelected = selectedCards.has(card.id);
                    
                    return (
                      <div
                        key={card.id}
                        className={cn(
                          'border-2 rounded-lg p-3 cursor-pointer transition-colors',
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        )}
                        onClick={() => toggleCardSelection(card.id)}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCardSelection(card.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Card {cardsToExport.indexOf(card) + 1}
                          </span>
                        </div>
                        
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={`Card ${card.id} preview`}
                            className="w-full h-32 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded border flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Generating preview...</span>
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                          {card.front.substring(0, 50)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCards.size} of {cardsToExport.length} cards selected
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowImagePreview(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowImagePreview(false);
                      setIsExportingImages(true);
                      try {
                        await handleImageExport();
                        toast.success('Images exported successfully!');
                      } catch (error) {
                        toast.error('Failed to export images');
                        console.error('Image export error:', error);
                      } finally {
                        setIsExportingImages(false);
                      }
                    }}
                    disabled={selectedCards.size === 0 && cardsToExport.length > 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Export Selected ({selectedCards.size || cardsToExport.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}