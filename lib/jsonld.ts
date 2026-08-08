import { siteConfig, absoluteUrl } from './site';

type JsonLd = Record<string, unknown>;

/**
 * Serialize JSON-LD safely for embedding in a <script> tag. JSON.stringify
 * does not escape `<`, so user-controlled strings could otherwise break out of
 * the script element (reflected XSS). Escaping `<` as `\u003c` is safe for
 * both the parser and the JSON content.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: absoluteUrl('/icon.svg'),
    sameAs: [siteConfig.github, 'https://x.com/vijayyyyy_7'],
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/search?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function webApplicationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${siteConfig.url}/#webapplication`,
    name: siteConfig.name,
    url: siteConfig.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${siteConfig.url}/#organization` },
  };
}

export function softwareApplicationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${siteConfig.url}/#softwareapplication`,
    name: siteConfig.name,
    url: siteConfig.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'AI-powered technology recommendations',
      'Provider comparison',
      'Database and API discovery',
      'Tech stack builder',
    ],
    publisher: { '@id': `${siteConfig.url}/#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function itemListSchema(
  items: { name: string; slug: string }[],
  listName?: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(`/browse/providers/${item.slug}`),
    })),
  };
}

export function faqSchema(questions: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
