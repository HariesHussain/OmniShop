import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL, buildBreadcrumbSchema, buildMetaForPath, buildOrganizationSchema, buildWebsiteSchema, defaultMeta } from '@/seo/seoConfig';

const SeoManager = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const meta = { ...defaultMeta, ...buildMetaForPath(pathname, searchParams) };
  const canonical = `${SITE_URL}${meta.canonicalPath || pathname}`;
  const robots = meta.robots || defaultMeta.robots;

  return (
    <Helmet prioritizeSeoTags>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta name="application-name" content={BRAND_NAME} />
      <meta name="generator" content="OmniShop SEO Manager" />

      <meta property="og:type" content={meta.ogType || 'website'} />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(buildOrganizationSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(buildWebsiteSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(pathname))}</script>
    </Helmet>
  );
};

export default SeoManager;
