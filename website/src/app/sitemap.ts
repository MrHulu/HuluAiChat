import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://huluchat-website.pages.dev';
  const currentDate = new Date();

  const docPages = [
    '/docs',
    '/docs/installation',
    '/docs/quick-start',
    '/docs/features/multi-model',
    '/docs/features/rag',
    '/docs/features/quick-panel',
    '/docs/features/sessions',
    '/docs/faq',
    '/docs/troubleshooting',
  ];

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/#features`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#download`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...docPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ];

  return routes;
}
