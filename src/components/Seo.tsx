import { Helmet } from "react-helmet-async";
import { brand } from "../data/brand";

interface SeoProps {
  title: string;
  description: string;
  // Canonical path, no host (e.g. "/browse" or "/artists/annunciata-park")
  path?: string;
  // OG image URL (absolute)
  image?: string;
  // schema.org JSON-LD object — will be stringified inline
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  // Override <meta name="robots">
  robots?: string;
  // Article-specific
  articleAuthor?: string;
  articlePublishedAt?: string;
}

const SITE = "https://arssacra.local";
const DEFAULT_OG = `${SITE}/og-default.png`;

export function Seo({
  title,
  description,
  path,
  image,
  jsonLd,
  robots,
  articleAuthor,
  articlePublishedAt,
}: SeoProps) {
  const fullTitle = title.includes(brand.name) ? title : `${title} · ${brand.name}`;
  const canonical = path ? `${SITE}${path}` : undefined;
  const og = image ?? DEFAULT_OG;
  const isArticle = !!articlePublishedAt;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {robots && <meta name="robots" content={robots} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={brand.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={isArticle ? "article" : "website"} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={og} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={og} />

      {isArticle && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}
      {isArticle && articlePublishedAt && (
        <meta property="article:published_time" content={articlePublishedAt} />
      )}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
