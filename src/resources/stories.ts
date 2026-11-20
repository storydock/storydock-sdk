import { HttpClient } from "../client.js";
import { StorydockApiError } from "../errors.js";
import type {
  GetStoryInput,
  ListStoriesInput,
  PaginatedStoriesResponse,
  PublishedStoriesFeedResponse,
  PublishedStoryDocument,
  SourceAttribution,
  Story,
  StorySummary,
} from "../types.js";

const PRIMARY_PUBLISHED_SCHEMA_PATH = "/api/feeds/published-schema";
const FALLBACK_PUBLISHED_SCHEMA_PATH = "/api/feed/published-schema";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
// The published-schema feed returns at most 200 stories per page.
const MAX_PAGE_SIZE = 200;
// Slug lookups page through the feed and stop after this many pages (10,000 stories).
const MAX_STORY_LOOKUP_PAGES = 50;

export class StoriesResource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(input: ListStoriesInput = {}): Promise<PaginatedStoriesResponse> {
    const page = normalizePositiveInteger(input.page, DEFAULT_PAGE);
    const pageSize = normalizePositiveInteger(input.pageSize, DEFAULT_PAGE_SIZE);
    const take = Math.min(pageSize, MAX_PAGE_SIZE);
    const response = await this.fetchPublishedStoriesPage(page, take, input.language);
    const storyPage = response.data.map(mapDocumentToStorySummary);
    // The feed does not report a total, so a full page means there may be another one.
    const hasMore = response.data.length === take;
    const knownCount = (page - 1) * take + response.data.length;

    return {
      data: storyPage,
      pagination: {
        page,
        pageSize: take,
        totalCount: hasMore ? knownCount + 1 : knownCount,
        totalPages: hasMore ? page + 1 : Math.max(1, page),
      },
    };
  }

  async get(slug: string, input: GetStoryInput = {}): Promise<Story> {
    if (!slug || !slug.trim()) {
      throw new Error("slug is required");
    }

    const normalizedSlug = slug.trim();
    const document = await this.findStoryBySlug(normalizedSlug, input.language);

    if (!document) {
      throw new StorydockApiError(`Story not found: ${normalizedSlug}`, {
        status: 404,
        statusText: "Not Found",
        url: PRIMARY_PUBLISHED_SCHEMA_PATH,
        bodyText: null,
      });
    }

    return mapDocumentToStory(document);
  }

  private async fetchPublishedStoriesPage(
    page: number,
    take: number,
    language?: string
  ): Promise<PublishedStoriesFeedResponse> {
    const query = { page, take, language: language?.trim() || undefined };
    try {
      return normalizeFeedResponse(
        await this.httpClient.getJson<PublishedStoriesFeedResponse | PublishedStoryDocument[]>({
          path: PRIMARY_PUBLISHED_SCHEMA_PATH,
          query,
        }),
        page
      );
    } catch (error) {
      if (!(error instanceof StorydockApiError) || error.status !== 404) {
        throw error;
      }

      return normalizeFeedResponse(
        await this.httpClient.getJson<PublishedStoriesFeedResponse | PublishedStoryDocument[]>({
          path: FALLBACK_PUBLISHED_SCHEMA_PATH,
          query,
        }),
        page
      );
    }
  }

  private async findStoryBySlug(slug: string, language?: string): Promise<PublishedStoryDocument | undefined> {
    for (let page = DEFAULT_PAGE; page <= MAX_STORY_LOOKUP_PAGES; page += 1) {
      const response = await this.fetchPublishedStoriesPage(page, MAX_PAGE_SIZE, language);
      const match = response.data.find((candidate) => candidate.slug === slug);

      if (match) {
        return match;
      }

      if (response.data.length < MAX_PAGE_SIZE) {
        return undefined;
      }
    }

    return undefined;
  }
}

function normalizeFeedResponse(
  response: PublishedStoriesFeedResponse | PublishedStoryDocument[],
  requestedPage: number
): PublishedStoriesFeedResponse {
  if (Array.isArray(response)) {
    return {
      page: requestedPage,
      data: response,
    };
  }

  return {
    page: normalizePositiveInteger(response.page, requestedPage),
    data: Array.isArray(response.data) ? response.data : [],
  };
}

function mapDocumentToStorySummary(document: PublishedStoryDocument): StorySummary {
  return {
    id: document.id,
    language: document.language,
    headline: document.title,
    slug: document.slug,
    summary: document.excerpt,
    teaser: document.teaser ?? "",
    publishedAt: document.publishedAt ?? null,
    featuredImageUrl: document.featuredImage?.url ?? null,
    readingTimeMinutes: document.readingTimeMinutes,
    primaryCategory: document.categories[0]?.name ?? null,
    finalQualityScore: document.finalQualityScore ?? null,
    qualityReviewIterations: document.qualityReviewIterations ?? 0,
    translations: document.translations ?? [],
  };
}

function mapSourceAttributions(document: PublishedStoryDocument): SourceAttribution[] {
  return (document.sourceAttributions ?? []).map((source) => ({
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl ?? null,
    quote: source.quote ?? null,
    credibilityScore: source.credibilityScore,
  }));
}

function mapDocumentToStory(document: PublishedStoryDocument): Story {
  return {
    id: document.id,
    type: document.type,
    url: document.url,
    language: document.language,
    title: document.title,
    subtitle: document.subtitle ?? null,
    excerpt: document.excerpt,
    teaser: document.teaser ?? "",
    contentHtml: document.contentHtml,
    body: document.body,
    tableOfContents: document.tableOfContents ?? [],
    featuredImage: document.featuredImage ?? null,
    authors: document.authors,
    categories: document.categories,
    tagItems: document.tags,
    seo: document.seo,
    settings: document.settings ?? null,
    updatedAt: document.updatedAt,
    eventId: "",
    ownerUserId: null,
    ownerUsername: document.authors[0]?.name ?? null,
    headline: document.title,
    slug: document.slug,
    content: document.contentHtml,
    summary: document.excerpt,
    wordCount: document.wordCount ?? 0,
    status: mapStatus(document.status),
    publishedAt: document.publishedAt ?? null,
    createdAt: document.createdAt,
    lastModified: document.updatedAt,
    tags: document.tags.map((tag) => tag.name),
    primaryCategory: document.categories[0]?.name ?? null,
    featuredImageUrl: document.featuredImage?.url ?? null,
    featuredImageAttribution: document.featuredImage?.attribution ?? null,
    featuredImageAlt: document.featuredImage?.alt ?? null,
    featuredImageLicense: document.featuredImage?.license ?? null,
    seoTitle: document.seo.metaTitle,
    seoDescription: document.seo.metaDescription,
    canonicalUrl: document.seo.canonicalUrl ?? null,
    readingTimeMinutes: document.readingTimeMinutes,
    finalQualityScore: document.finalQualityScore ?? null,
    qualityReviewIterations: document.qualityReviewIterations ?? 0,
    viewCount: document.viewCount ?? 0,
    sourceAttributions: mapSourceAttributions(document),
    translations: document.translations ?? [],
  };
}

function mapStatus(status: string): number {
  if (status === "published") {
    return 1;
  }

  return 0;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}