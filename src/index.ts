import { HttpClient } from "./client.js";
import { StoriesResource } from "./resources/stories.js";
import type { ClientOptions, PaginatedStoriesResponse, PaginationInput, Story } from "./types.js";

export { StorydockApiConfigurationError, StorydockApiError } from "./errors.js";
export type {
  ClientOptions,
  FetchLike,
  PaginatedStoriesResponse,
  PaginationInput,
  PublishedStoryDocument,
  PublishedStoriesFeedResponse,
  SourceAttribution,
  StoryAuthor,
  StoryBodyBlock,
  StoryImageAsset,
  StorySeo,
  StorySettings,
  StoriesPagination,
  Story,
  StorySummary,
  StoryTaxonomyItem,
} from "./types.js";

export class StorydockClient {
  readonly stories: StoriesResource;

  constructor(options: ClientOptions) {
    const httpClient = new HttpClient(options);
    this.stories = new StoriesResource(httpClient);
  }

  listStories(input?: PaginationInput): Promise<PaginatedStoriesResponse> {
    return this.stories.list(input);
  }

  getStory(slug: string): Promise<Story> {
    return this.stories.get(slug);
  }
}

export function createStorydockClient(options: ClientOptions): StorydockClient {
  return new StorydockClient(options);
}