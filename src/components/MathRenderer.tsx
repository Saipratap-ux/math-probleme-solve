import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  block = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // If pure block math requested
    if (block) {
      try {
        return katex.renderToString(content, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return content;
      }
    }

    // Split text by display math ($$...$$) first, then inline math ($...$)
    // Match $$...$$ or $...$
    const parts: Array<{ type: 'text' | 'inline' | 'display'; text: string }> = [];
    let currentIndex = 0;

    // Regex for $$...$$ and $...$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
    let match: RegExpExecArray | null;

    while ((match = mathRegex.exec(content)) !== null) {
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          text: content.slice(currentIndex, match.index),
        });
      }

      const matchText = match[0];
      if (matchText.startsWith('$$') && matchText.endsWith('$$')) {
        parts.push({
          type: 'display',
          text: matchText.slice(2, -2).trim(),
        });
      } else if (matchText.startsWith('$') && matchText.endsWith('$')) {
        parts.push({
          type: 'inline',
          text: matchText.slice(1, -1).trim(),
        });
      }

      currentIndex = match.index + matchText.length;
    }

    if (currentIndex < content.length) {
      parts.push({
        type: 'text',
        text: content.slice(currentIndex),
      });
    }

    return parts
      .map((part) => {
        if (part.type === 'display') {
          try {
            return katex.renderToString(part.text, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return `<div class="font-mono text-amber-800">${escapeHtml(part.text)}</div>`;
          }
        }
        if (part.type === 'inline') {
          try {
            return katex.renderToString(part.text, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return `<span class="font-mono text-amber-800">${escapeHtml(part.text)}</span>`;
          }
        }
        // Text part: escape html and preserve line breaks
        return escapeHtml(part.text).replace(/\n/g, '<br />');
      })
      .join('');
  }, [content, block]);

  return (
    <div
      className={`prose-math leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
