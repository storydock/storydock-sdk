import { HttpClient } from "../client.js";
import { StorydockApiError } from "../errors.js";
import type {
  PaginatedStoriesResponse,
  PaginationInput,
  PublishedStoriesFeedResponse,
  PublishedStoryDocument,
  Story,
  StorySummary,
} from "../types.js";

const PRIMARY_PUBLISHED_SCHEMA_PATH = "/api/feeds/published-schema";
const FALLBACK_PUBLISHED_SCHEMA_PATH = "/api/feed/published-schema";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PUBLISHED_STORIES = 200;
const STORY_LOOKUP_PAGE_SIZE = 50;

export class StoriesResource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(input: PaginationInput = {}): Promise<PaginatedStoriesResponse> {
    const page = normalizePositiveInteger(input.page, DEFAULT_PAGE);
    const pageSize = normalizePositiveInteger(input.pageSize, DEFAULT_PAGE_SIZE);
    const take = Math.min(pageSize, MAX_PUBLISHED_STORIES);
    const response = await this.fetchPublishedStoriesPage(page, take);
    const storyPage = response.data.map(mapDocumentToStorySummary);
    const hasMore = response.data.length === take && page * take < MAX_PUBLISHED_STORIES;
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

  async get(slug: string): Promise<Story> {
    if (!slug || !slug.trim()) {
      throw new Error("slug is required");
    }

    const normalizedSlug = slug.trim();
    const document = await this.findStoryBySlug(normalizedSlug);

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

  private async fetchPublishedStoriesPage(page: number, take: number): Promise<PublishedStoriesFeedResponse> {
    try {
      return normalizeFeedResponse(
        await this.httpClient.getJson<PublishedStoriesFeedResponse | PublishedStoryDocument[]>({
          path: PRIMARY_PUBLISHED_SCHEMA_PATH,
          query: { page, take },
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
          query: { page, take },
        }),
        page
      );
    }
  }

  private async findStoryBySlug(slug: string): Promise<PublishedStoryDocument | undefined> {
    const maxPages = Math.max(1, Math.ceil(MAX_PUBLISHED_STORIES / STORY_LOOKUP_PAGE_SIZE));

    for (let page = DEFAULT_PAGE; page <= maxPages; page += 1) {
      const response = await this.fetchPublishedStoriesPage(page, STORY_LOOKUP_PAGE_SIZE);
      const match = response.data.find((candidate) => candidate.slug === slug);

      if (match) {
        return match;
      }

      if (response.data.length < STORY_LOOKUP_PAGE_SIZE) {
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
    headline: document.title,
    slug: document.slug,
    summary: document.excerpt,
    publishedAt: document.publishedAt,
    featuredImageUrl: document.featuredImage?.url ?? null,
    readingTimeMinutes: document.readingTimeMinutes,
    primaryCategory: document.categories[0]?.name ?? null,
    finalQualityScore: null,
    qualityReviewIterations: 0,
  };
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
    contentHtml: document.contentHtml,
    body: document.body,
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
    wordCount: 0,
    status: mapStatus(document.status),
    publishedAt: document.publishedAt,
    createdAt: document.createdAt,
    lastModified: document.updatedAt,
    tags: document.tags.map((tag) => tag.name),
    primaryCategory: document.categories[0]?.name ?? null,
    featuredImageUrl: document.featuredImage?.url ?? null,
    featuredImageAttribution: null,
    featuredImageAlt: document.featuredImage?.alt ?? null,
    featuredImageLicense: null,
    seoTitle: document.seo.metaTitle,
    seoDescription: document.seo.metaDescription,
    canonicalUrl: document.seo.canonicalUrl ?? null,
    readingTimeMinutes: document.readingTimeMinutes,
    finalQualityScore: null,
    qualityReviewIterations: 0,
    viewCount: 0,
    sourceAttributions: [],
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