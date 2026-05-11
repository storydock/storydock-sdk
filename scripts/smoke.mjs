import { createStorydockClient } from "../dist/index.js";

const apiToken = process.env.STORYDOCK_API_TOKEN || undefined;

const client = createStorydockClient({
  apiToken,
  userAgent: "sdk-smoke-test",
  timeoutMs: 10000,
});

console.log("Using API base: https://api.storydock.ai");
console.log(apiToken ? "Using API token from STORYDOCK_API_TOKEN" : "No API token provided; requests will be anonymous");

try {
  const stories = await client.listStories({ page: 1, pageSize: 5 });
  console.log(`Stories OK: ${stories.data.length} returned, total ${stories.pagination.totalCount}`);

  if (stories.data.length > 0) {
    const firstStory = await client.getStory(stories.data[0].slug);
    console.log(`Story OK: ${firstStory.slug} (${firstStory.title})`);
    console.log(`Story contentHtml length: ${firstStory.contentHtml.length}`);
  } else {
    console.log("Story detail skipped: no published stories found");
  }

  console.log("Smoke test passed");
} catch (error) {
  console.error("Smoke test failed");
  console.error(error);
  process.exitCode = 1;
}