import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css';

interface CardContentProps {
  content: string;
  isBack?: boolean;
  className?: string;
}

export default function CardContent({ content, isBack = false, className = '' }: CardContentProps) {
  // Check if content contains HTML tags or markdown
  const hasHtmlOrMarkdown = /<[^>]*>|```|\*\*|__|\[.*\]\(.*\)|#{1,6}\s/.test(content);
  
  if (hasHtmlOrMarkdown) {
    return (
      <div className={`card-content ${isBack ? 'card-back' : 'card-front'} ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            // Custom styling for different elements
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b-2 border-blue-500 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 text-blue-600 dark:text-blue-400">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 text-purple-600 dark:text-purple-400">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-900 dark:text-white mb-3 leading-relaxed">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-purple-600 dark:text-purple-400 font-medium">
                {children}
              </em>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-2 py-1 rounded text-sm font-mono border">
                    {children}
                  </code>
                );
              }
              return (
                <code className={className}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-700 shadow-lg">
                {children}
              </pre>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900 dark:text-white">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-100 dark:bg-gray-800">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                {children}
              </td>
            ),
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
              >
                {children}
              </a>
            ),
            // Custom component for highlighting important text
            mark: ({ children }) => (
              <mark className="bg-yellow-200 dark:bg-yellow-600/30 text-gray-900 dark:text-white px-1 py-0.5 rounded font-medium">
                {children}
              </mark>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
  
  // Fallback to plain text rendering
  return (
    <div className={`text-gray-900 dark:text-white leading-relaxed ${className}`}>
      {content}
    </div>
  );
}

// CSS styles for additional customization
export const cardContentStyles = `
  .card-content {
    line-height: 1.6;
  }
  
  .card-content .hljs {
    background: #1f2937 !important;
    color: #f9fafb !important;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  
  .card-content .hljs-keyword {
    color: #8b5cf6 !important;
  }
  
  .card-content .hljs-string {
    color: #10b981 !important;
  }
  
  .card-content .hljs-number {
    color: #f59e0b !important;
  }
  
  .card-content .hljs-comment {
    color: #6b7280 !important;
    font-style: italic;
  }
  
  .card-content .hljs-function {
    color: #3b82f6 !important;
  }
  
  .card-back {
    /* Additional styles for card back */
  }
  
  .card-front {
    /* Additional styles for card front */
  }
`;