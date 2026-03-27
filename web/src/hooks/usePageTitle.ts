import { useEffect } from 'react';

const SITE_NAME = 'OpenFinance';

/**
 * Sets the document title for a page.
 * Used on authenticated pages where full SEO meta tags aren't needed.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | ${SITE_NAME}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
