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
  const firstPageDocuments = Array.from({ length: 50 }, (_, index) => ({
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

      if (url.endsWith("page=1&take=50")) {
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
    "https://api.storydock.ai/api/feeds/published-schema?page=1&take=50",
    "https://api.storydock.ai/api/feeds/published-schema?page=2&take=50",
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