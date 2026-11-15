'use client';

import { useEffect } from 'react';
import { trackFb } from '@/lib/fbq';

export default function FbViewContent({ id, name, category }: { id: string; name: string; category?: string }) {
  useEffect(() => {
    trackFb('ViewContent', {
      content_ids: [id],
      content_type: 'product',
      content_name: name,
      content_category: category || 'Property',
    });
  }, [id, name, category]);
  return null;
}
