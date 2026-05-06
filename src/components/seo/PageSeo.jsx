import { Helmet } from 'react-helmet-async';
import { BRAND_NAME, DEFAULT_OG_IMAGE, buildCanonicalUrl } from '@/seo/seoConfig';

const PageSeo = ({ title, description, canonicalPath, robots, ogType = 'website', ogImage = DEFAULT_OG_IMAGE, schema, noIndex = false }) => {
  const resolvedCanonical = buildCanonicalUrl(canonicalPath || '/');
  const robotsValue = noIndex ? 'noindex,nofollow' : (robots || 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  const schemas = Array.isArray(schema) ? schema.filter(Boolean) : [schema].filter(Boolean);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsValue} />
      <link rel="canonical" href={resolvedCanonical} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageSeo;