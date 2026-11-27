'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Pages of the other V Grand businesses (and the chooser) bring their own header and footer. */
const OWN_CHROME = /^\/(group|restaurant|hospital)(\/|$)/;

export function isGroupPath(path: string | null): boolean {
  return !!path && OWN_CHROME.test(path);
}

/** Renders the V Grand Infra navbar / footer / WhatsApp button everywhere except the group pages. */
export default function InfraOnly({ children }: { children: ReactNode }) {
  return isGroupPath(usePathname()) ? null : <>{children}</>;
}
