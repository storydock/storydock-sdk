import { HttpClient } from "./client.js";
import { StoriesResource } from "./resources/stories.js";
import type { ClientOptions, GetStoryInput, ListStoriesInput, PaginatedStoriesResponse, Story } from "./types.js";

export { StorydockApiConfigurationError, StorydockApiError } from "./errors.js";
export type {
  ClientOptions,
  FetchLike,
  GetStoryInput,
  LanguageInput,
  ListStoriesInput,
  PaginatedStoriesResponse,
  PaginationInput,
  PublishedSourceAttribution,
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
  StoryTableOfContentsItem,
  StoryTaxonomyItem,
  StoryTranslation,
} from "./types.js";

export class StorydockClient {
  readonly stories: StoriesResource;

  constructor(options: ClientOptions) {
    const httpClient = new HttpClient(options);
    this.stories = new StoriesResource(httpClient);
  }

  listStories(input?: ListStoriesInput): Promise<PaginatedStoriesResponse> {
    return this.stories.list(input);
  }

  getStory(slug: string, input?: GetStoryInput): Promise<Story> {
    return this.stories.get(slug, input);
  }
}

export function createStorydockClient(options: ClientOptions): StorydockClient {
  return new StorydockClient(options);
}