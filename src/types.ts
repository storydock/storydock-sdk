export interface ClientOptions {
  apiToken?: string;
  timeoutMs?: number;
  fetch?: FetchLike;
  userAgent?: string;
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface LanguageInput {
  /**
   * Only return stories in this language, e.g. "ko" or "en-US". A bare language also
   * matches its regional variants ("en" matches "en-US") and a regional code also
   * matches stories stored with the bare language.
   */
  language?: string;
}

export interface ListStoriesInput extends PaginationInput, LanguageInput {}

export interface GetStoryInput extends LanguageInput {}

export interface StoryImageAsset {
  id?: string;
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string;
  attribution?: string | null;
  license?: string | null;
}

export interface StoryAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  /** Avatar image URL. */
  avatar?: string | null;
}

export interface StoryTaxonomyItem {
  id: string;
  name: string;
  slug: string;
}

export interface StorySeo {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
}

export interface StorySettings {
  allowComments?: boolean;
  featured?: boolean;
  pinned?: boolean;
  breaking?: boolean;
}

export type StoryBodyBlock = Record<string, unknown>;

export interface StoryTableOfContentsItem {
  blockId: string;
  title: string;
  level: number;
}

export interface PublishedSourceAttribution {
  sourceName: string;
  sourceUrl: string | null;
  credibilityScore: number;
  quote: string | null;
}

/** Another published language version of the same article. */
export interface StoryTranslation {
  language: string;
  title: string;
  slug: string;
  url: string;
}

export interface PublishedStoryDocument {
  id: string;
  type: string;
  status: string;
  slug: string;
  url: string;
  language: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  teaser?: string;
  featuredImage?: StoryImageAsset | null;
  authors: StoryAuthor[];
  categories: StoryTaxonomyItem[];
  tags: StoryTaxonomyItem[];
  contentHtml: string;
  body: StoryBodyBlock[];
  tableOfContents?: StoryTableOfContentsItem[];
  seo: StorySeo;
  settings?: StorySettings;
  wordCount?: number;
  readingTimeMinutes: number;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  finalQualityScore?: number | null;
  qualityReviewIterations?: number;
  viewCount?: number;
  sourceAttributions?: PublishedSourceAttribution[];
  translations?: StoryTranslation[];
}

export interface PublishedStoriesFeedResponse {
  page: number;
  data: PublishedStoryDocument[];
}

export interface StorySummary {
  id: string;
  language: string;
  headline: string;
  slug: string;
  summary: string;
  teaser: string;
  publishedAt: string | null;
  featuredImageUrl: string | null;
  readingTimeMinutes: number;
  primaryCategory: string | null;
  finalQualityScore: number | null;
  qualityReviewIterations: number;
  translations: StoryTranslation[];
}

export interface SourceAttribution {
  /** Not exposed by the public API; always undefined from the SDK. */
  id?: string;
  /** Not exposed by the public API; always undefined from the SDK. */
  storyId?: string;
  /** Not exposed by the public API; always undefined from the SDK. */
  sourceId?: string;
  sourceName: string;
  sourceUrl: string | null;
  quote: string | null;
  credibilityScore: number;
}

export interface Story {
  id: string;
  type: string;
  url: string;
  language: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  teaser: string;
  contentHtml: string;
  body: StoryBodyBlock[];
  tableOfContents: StoryTableOfContentsItem[];
  featuredImage: StoryImageAsset | null;
  authors: StoryAuthor[];
  categories: StoryTaxonomyItem[];
  tagItems: StoryTaxonomyItem[];
  seo: StorySeo;
  settings: StorySettings | null;
  updatedAt: string;
  eventId: string;
  ownerUserId: string | null;
  ownerUsername: string | null;
  headline: string;
  slug: string;
  content: string;
  summary: string;
  wordCount: number;
  status: number;
  publishedAt: string | null;
  createdAt: string;
  lastModified: string | null;
  tags: string[];
  primaryCategory: string | null;
  featuredImageUrl: string | null;
  featuredImageAttribution: string | null;
  featuredImageAlt: string | null;
  featuredImageLicense: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  readingTimeMinutes: number;
  finalQualityScore: number | null;
  qualityReviewIterations: number;
  viewCount: number;
  sourceAttributions: SourceAttribution[];
  /** Other published language versions of this article (for language switchers and hreflang). */
  translations: StoryTranslation[];
}

export interface StoriesPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedStoriesResponse {
  data: StorySummary[];
  pagination: StoriesPagination;
}