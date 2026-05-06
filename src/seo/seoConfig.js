export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.omnishop.in').replace(/\/$/, '');
export const BRAND_NAME = 'OmniShop';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/social-preview.svg`;
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@omnishop.in';
export const DEFAULT_PHONE = import.meta.env.VITE_SUPPORT_PHONE || '+91-00000-00000';

const defaultDescription = 'OmniShop is a multi-vendor ecommerce platform with secure checkout, fast delivery, and trusted sellers.';
const defaultRobots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const noIndexRobots = 'noindex,nofollow';

export const defaultMeta = {
  title: `${BRAND_NAME} | Multi-Vendor Ecommerce Platform`,
  description: defaultDescription,
  canonicalPath: '/',
  robots: defaultRobots,
  ogType: 'website',
};

export const routeMeta = {
  '/': {
    title: `${BRAND_NAME} | Shop Electronics, Fashion, Grocery & More`,
    description: 'Discover top products from trusted sellers on OmniShop. Secure payments, fast delivery, and smooth shopping.',
  },
  '/cart': { title: `Your Cart | ${BRAND_NAME}`, description: 'Review your selected products and continue to secure checkout on OmniShop.', robots: noIndexRobots },
  '/checkout': { title: `Checkout | ${BRAND_NAME}`, description: 'Complete your order with secure payment options and verified delivery details.', robots: noIndexRobots },
  '/orders': { title: `My Orders | ${BRAND_NAME}`, description: 'Track your orders, delivery status, and purchase history in your OmniShop account.', robots: noIndexRobots },
  '/success': { title: `Payment Success | ${BRAND_NAME}`, description: 'Your payment was received successfully and the order is now being processed.', robots: noIndexRobots },
  '/cancel': { title: `Payment Cancelled | ${BRAND_NAME}`, description: 'Your payment was cancelled. You can safely return to checkout and try again.', robots: noIndexRobots },
  '/sign-in': { title: `Sign In | ${BRAND_NAME}`, description: 'Sign in to your OmniShop account.', robots: noIndexRobots },
  '/register': { title: `Create Account | ${BRAND_NAME}`, description: 'Create your OmniShop account to start shopping and selling.', robots: noIndexRobots },
  '/reset-password': { title: `Reset Password | ${BRAND_NAME}`, description: 'Reset your OmniShop account password securely.', robots: noIndexRobots },
  '/profile': { title: `My Profile | ${BRAND_NAME}`, description: 'Manage your OmniShop profile and account settings.', robots: noIndexRobots },
  '/settings': { title: `Settings | ${BRAND_NAME}`, description: 'Update account preferences and security settings.', robots: noIndexRobots },
  '/admin': { title: `Admin Dashboard | ${BRAND_NAME}`, description: 'Operational dashboard for OmniShop admins.', robots: 'noindex,nofollow,noarchive' },
  '/seller/dashboard': { title: `Seller Dashboard | ${BRAND_NAME}`, description: 'Manage products, orders, and insights in Seller Dashboard.', robots: 'noindex,nofollow,noarchive' },
  '/seller/apply': { title: `Seller Application | ${BRAND_NAME}`, description: 'Apply to become a verified seller on OmniShop.', robots: noIndexRobots },
  '/delivery': { title: `Delivery Dashboard | ${BRAND_NAME}`, description: 'Delivery assignment and order fulfillment dashboard.', robots: 'noindex,nofollow,noarchive' },
  '/order-tracking': { title: `Order Tracking | ${BRAND_NAME}`, description: 'Track your current delivery progress on OmniShop.', robots: 'noindex,follow' },
  '/p/about': { title: `About OmniShop`, description: 'Learn about OmniShop, our mission, and the shopping experience we build.' },
  '/p/careers': { title: `Careers at OmniShop`, description: 'Explore careers and build the future of ecommerce with OmniShop.' },
  '/p/press': { title: `Press & Media | ${BRAND_NAME}`, description: 'Latest OmniShop press releases, brand assets, and media updates.' },
  '/p/blog': { title: `OmniShop Blog`, description: 'Read shopping guides, trend updates, and ecommerce insights from OmniShop.' },
  '/p/returns': { title: `Returns & Replacements | ${BRAND_NAME}`, description: 'Review OmniShop return and replacement policies before you buy.' },
  '/p/contact': { title: `Contact OmniShop`, description: 'Reach OmniShop support for orders, sellers, delivery, and general help.' },
  '/p/privacy': { title: `Privacy Policy | ${BRAND_NAME}`, description: 'Understand how OmniShop collects, stores, and protects customer data.' },
  '/p/terms': { title: `Terms of Use | ${BRAND_NAME}`, description: 'Review the terms, rights, and responsibilities for using OmniShop.' },
  '/p/refunds': { title: `Refund Policy | ${BRAND_NAME}`, description: 'Read how refunds are processed on OmniShop.' },
};

const normalizePath = (pathname = '/') => pathname.replace(/\/+$/, '') || '/';
const humanize = (segment) => String(segment || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const buildCategoryTitle = (category) => `${humanize(category)} Products | ${BRAND_NAME}`;

export const buildCanonicalUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const buildMetaForPath = (pathname, searchParams = new URLSearchParams()) => {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.startsWith('/product/')) {
    return {
      title: `Product Details | ${BRAND_NAME}`,
      description: 'View product specifications, reviews, price, and delivery details.',
      canonicalPath: normalizedPath,
      ogType: 'product',
      robots: defaultRobots,
    };
  }

  if (normalizedPath === '/') {
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();

    if (search) {
      return {
        title: `${search} | Search Results | ${BRAND_NAME}`,
        description: `Search results for ${search} on OmniShop. Compare trusted sellers, prices, and delivery options.`,
        canonicalPath: `/?search=${encodeURIComponent(search)}`,
      };
    }

    if (category) {
      return {
        title: buildCategoryTitle(category),
        description: `Browse ${humanize(category)} on OmniShop with trusted sellers, secure payments, and fast delivery.`,
        canonicalPath: `/?category=${encodeURIComponent(category)}`,
      };
    }
  }

  if (normalizedPath.startsWith('/p/')) {
    return routeMeta[normalizedPath] || {
      title: `${BRAND_NAME} Information Page`,
      description: defaultDescription,
      canonicalPath: normalizedPath,
    };
  }

  return routeMeta[normalizedPath] || defaultMeta;
};

export const buildBreadcrumbSchema = (pathname) => {
  const segments = normalizePath(pathname).split('/').filter(Boolean);
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
  ];

  let path = '';
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    itemListElement.push({
      '@type': 'ListItem',
      position: index + 2,
      name: humanize(segment),
      item: `${SITE_URL}${path}`,
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  sameAs: [],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      telephone: DEFAULT_PHONE,
      availableLanguage: ['en', 'hi'],
    },
  ],
});

export const buildWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildProductSchema = (product) => {
  if (!product) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images?.length ? product.images : [DEFAULT_OG_IMAGE],
    description: product.description || product.title,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.price || 0),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/product/${product.id}`,
    },
    aggregateRating: product.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: String(product.rating),
          reviewCount: String(product.review_count || 0),
        }
      : undefined,
  };
};

export const buildLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: BRAND_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
});
