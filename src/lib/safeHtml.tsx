import React from 'react';

/**
 * Safely renders a string containing only <strong> tags as JSX.
 * All other HTML tags are escaped and rendered as plain text.
 * This replaces dangerouslySetInnerHTML for known-safe content.
 */
export function renderSafeHtml(html: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /<strong>(.*?)<\/strong>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push(html.slice(lastIndex, match.index));
    }
    parts.push(React.createElement('strong', { key: key++ }, match[1]));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    parts.push(html.slice(lastIndex));
  }

  return React.createElement(React.Fragment, null, ...parts);
}
