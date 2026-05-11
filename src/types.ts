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

export interface StoryImageAsset {
  id?: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface StoryAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: StoryImageAsset;
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
  ogImage?: string;
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

export interface PublishedStoryDocument {
  id: string;
  type: string;
  status: string;
  slug: string;
  url: string;
  language: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  featuredImage?: StoryImageAsset | null;
  authors: StoryAuthor[];
  categories: StoryTaxonomyItem[];
  tags: StoryTaxonomyItem[];
  contentHtml: string;
  body: StoryBodyBlock[];
  seo: StorySeo;
  settings?: StorySettings;
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
}

export interface PublishedStoriesFeedResponse {
  page: number;
  data: PublishedStoryDocument[];
}

export interface StorySummary {
  id: string;
  headline: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  featuredImageUrl: string | null;
  readingTimeMinutes: number;
  primaryCategory: string | null;
  finalQualityScore: number | null;
  qualityReviewIterations: number;
}

export interface SourceAttribution {
  id: string;
  storyId: string;
  sourceId: string;
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
  contentHtml: string;
  body: StoryBodyBlock[];
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