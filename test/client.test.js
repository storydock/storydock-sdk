import test from "node:test";
import assert from "node:assert/strict";

import { StorydockApiError, createStorydockClient } from "../dist/index.js";

const publishedSchemaDocument = {
  id: "art_123",
  type: "article",
  status: "published",
  slug: "example-slug",
  url: "/story/example-slug",
  language: "en",
  title: "Example Title",
  subtitle: "Example Subtitle",
  excerpt: "Example excerpt",
  featuredImage: {
    id: "img_1",
    url: "https://cdn.example.com/example.jpg",
    alt: "Example image",
  },
  authors: [
    {
      id: "author_1",
      name: "Jane Doe",
      slug: "jane-doe",
    },
  ],
  categories: [
    {
      id: "cat_1",
      name: "Engineering",
      slug: "engineering",
    },
  ],
  tags: [
    {
      id: "tag_1",
      name: "Headless CMS",
      slug: "headless-cms",
    },
  ],
  contentHtml: "<p>Hello from Storydock</p>",
  body: [],
  seo: {
    metaTitle: "Example Title",
    metaDescription: "Example excerpt",
  },
  settings: {
    featured: true,
  },
  readingTimeMinutes: 4,
  publishedAt: "2026-03-19T09:00:00Z",
  updatedAt: "2026-03-19T10:30:00Z",
  createdAt: "2026-03-18T18:20:00Z",
};

function buildFeedResponse(page, documents = [publishedSchemaDocument]) {
  return {
    page,
    data: documents,
  };
}

test("builds requests against the fixed SDK API base and appends query params", async () => {
  let capturedUrl = null;

  const client = createStorydockClient({
    fetch: async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify(buildFeedResponse(2, [])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.listStories({ page: 2, pageSize: 5 });

  assert.equal(capturedUrl, "https://api.storydock.ai/api/feeds/published-schema?page=2&take=5");
});

test("sends bearer tokens when configured", async () => {
  let authHeader = null;

  const client = createStorydockClient({
    apiToken: "token-123",
    fetch: async (_input, init) => {
      const headers = new Headers(init?.headers);
      authHeader = headers.get("Authorization");

      return new Response(JSON.stringify(buildFeedResponse(1, [])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.listStories();

  assert.equal(authHeader, "Bearer token-123");
});

test("falls back to the singular published-schema route when plural returns 404", async () => {
  const requestedUrls = [];

  const client = createStorydockClient({
    fetch: async (input) => {
      requestedUrls.push(String(input));

      if (requestedUrls.length === 1) {
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          statusText: "Not Found",
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(buildFeedResponse(1, [publishedSchemaDocument])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const stories = await client.listStories({ page: 1, pageSize: 5 });

  assert.deepEqual(requestedUrls, [
    "https://api.storydock.ai/api/feeds/published-schema?page=1&take=5",
    "https://api.storydock.ai/api/feed/published-schema?page=1&take=5",
  ]);
  assert.equal(stories.data[0]?.headline, "Example Title");
});

test("maps published schema stories and exposes contentHtml for rendering", async () => {
  const client = createStorydockClient({
    fetch: async () =>
      new Response(JSON.stringify(buildFeedResponse(1, [publishedSchemaDocument])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  const story = await client.getStory("example-slug");

  assert.equal(story.headline, "Example Title");
  assert.equal(story.contentHtml, "<p>Hello from Storydock</p>");
  assert.equal(story.content, "<p>Hello from Storydock</p>");
  assert.deepEqual(story.tagItems, [
    {
      id: "tag_1",
      name: "Headless CMS",
      slug: "headless-cms",
    },
  ]);
  assert.deepEqual(story.tags, ["Headless CMS"]);
});

test("searches across feed pages when looking up a story by slug", async () => {
  const requestedUrls = [];
  const firstPageDocuments = Array.from({ length: 200 }, (_, index) => ({
    ...publishedSchemaDocument,
    id: `art_${index}`,
    slug: `story-${index}`,
    title: `Story ${index}`,
    url: `/story/story-${index}`,
  }));

  const client = createStorydockClient({
    fetch: async (input) => {
      const url = String(input);
      requestedUrls.push(url);

      if (url.endsWith("page=1&take=200")) {
        return new Response(JSON.stringify(buildFeedResponse(1, firstPageDocuments)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(buildFeedResponse(2, [publishedSchemaDocument])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const story = await client.getStory("example-slug");

  assert.equal(story.slug, "example-slug");
  assert.deepEqual(requestedUrls, [
    "https://api.storydock.ai/api/feeds/published-schema?page=1&take=200",
    "https://api.storydock.ai/api/feeds/published-schema?page=2&take=200",
  ]);
});

test("throws a typed API error on non-2xx responses", async () => {
  const client = createStorydockClient({
    fetch: async () =>
      new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" },
      }),
  });

  await assert.rejects(() => client.getStory("missing"), (error) => {
    assert.ok(error instanceof StorydockApiError);
    assert.equal(error.status, 404);
    assert.equal(error.statusText, "Not Found");
    assert.match(error.bodyText ?? "", /not found/i);
    return true;
  });
});

test("uses the fixed SDK API base URL", async () => {
  let capturedUrl = null;

  const client = createStorydockClient({
    fetch: async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify(buildFeedResponse(1, [])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.listStories();

  assert.equal(capturedUrl, "https://api.storydock.ai/api/feeds/published-schema?page=1&take=20");
});
test("passes the language filter to the feed for lists and slug lookups", async () => {
  const requestedUrls = [];

  const client = createStorydockClient({
    fetch: async (input) => {
      requestedUrls.push(String(input));
      return new Response(JSON.stringify(buildFeedResponse(1, [{ ...publishedSchemaDocument, language: "ko" }])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const stories = await client.listStories({ page: 1, pageSize: 10, language: "ko" });
  const story = await client.getStory("example-slug", { language: "ko" });

  assert.deepEqual(requestedUrls, [
    "https://api.storydock.ai/api/feeds/published-schema?page=1&take=10&language=ko",
    "https://api.storydock.ai/api/feeds/published-schema?page=1&take=200&language=ko",
  ]);
  assert.equal(stories.data[0]?.language, "ko");
  assert.equal(story.language, "ko");
});

test("omits a blank language filter", async () => {
  let capturedUrl = null;

  const client = createStorydockClient({
    fetch: async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify(buildFeedResponse(1, [])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.listStories({ language: "   " });

  assert.equal(capturedUrl, "https://api.storydock.ai/api/feeds/published-schema?page=1&take=20");
});

test("keeps paginating past 200 stories while pages are full", async () => {
  const fullPage = Array.from({ length: 200 }, (_, index) => ({
    ...publishedSchemaDocument,
    id: `art_${index}`,
    slug: `story-${index}`,
  }));

  const client = createStorydockClient({
    fetch: async () =>
      new Response(JSON.stringify(buildFeedResponse(2, fullPage)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  const stories = await client.listStories({ page: 2, pageSize: 200 });

  assert.equal(stories.pagination.page, 2);
  assert.equal(stories.pagination.totalPages, 3);
  assert.equal(stories.pagination.totalCount, 401);
});

test("maps teaser, table of contents, translations, attributions, and quality fields", async () => {
  const document = {
    ...publishedSchemaDocument,
    teaser: "Example teaser",
    featuredImage: {
      ...publishedSchemaDocument.featuredImage,
      attribution: "Photo: Example",
      license: "CC-BY",
    },
    authors: [{ id: "author_1", name: "Jane Doe", slug: "jane-doe", avatar: "https://cdn.example.com/jane.png" }],
    tableOfContents: [{ blockId: "blk_1", title: "First section", level: 2 }],
    wordCount: 812,
    viewCount: 42,
    finalQualityScore: 93.5,
    qualityReviewIterations: 2,
    sourceAttributions: [
      { sourceName: "Example Wire", sourceUrl: "https://wire.example.com/a", credibilityScore: 0.9, quote: null },
    ],
    translations: [{ language: "ko", title: "예시 제목", slug: "example-slug-ko", url: "/story/example-slug-ko" }],
  };

  const client = createStorydockClient({
    fetch: async () =>
      new Response(JSON.stringify(buildFeedResponse(1, [document])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  const story = await client.getStory("example-slug");
  const list = await client.listStories();

  assert.equal(story.teaser, "Example teaser");
  assert.deepEqual(story.tableOfContents, [{ blockId: "blk_1", title: "First section", level: 2 }]);
  assert.equal(story.wordCount, 812);
  assert.equal(story.viewCount, 42);
  assert.equal(story.finalQualityScore, 93.5);
  assert.equal(story.qualityReviewIterations, 2);
  assert.equal(story.featuredImageAttribution, "Photo: Example");
  assert.equal(story.featuredImageLicense, "CC-BY");
  assert.equal(story.authors[0]?.avatar, "https://cdn.example.com/jane.png");
  assert.deepEqual(story.sourceAttributions, [
    { sourceName: "Example Wire", sourceUrl: "https://wire.example.com/a", quote: null, credibilityScore: 0.9 },
  ]);
  assert.deepEqual(story.translations, document.translations);
  assert.equal(list.data[0]?.teaser, "Example teaser");
  assert.deepEqual(list.data[0]?.translations, document.translations);
  assert.equal(list.data[0]?.finalQualityScore, 93.5);
});

test("defaults new fields when talking to an older API", async () => {
  const client = createStorydockClient({
    fetch: async () =>
      new Response(JSON.stringify(buildFeedResponse(1, [publishedSchemaDocument])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  const story = await client.getStory("example-slug");

  assert.equal(story.teaser, "");
  assert.deepEqual(story.tableOfContents, []);
  assert.deepEqual(story.translations, []);
  assert.deepEqual(story.sourceAttributions, []);
  assert.equal(story.wordCount, 0);
  assert.equal(story.finalQualityScore, null);
});
