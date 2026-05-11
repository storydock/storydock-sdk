# Storydock SDK

TypeScript SDK for the public Storydock API, packaged as a standalone repository so it can be installed from other projects across the organization.

The package ships both ESM and CommonJS entry points so it can be consumed from different Node.js application setups.

## Status

This package currently wraps the published Storydock schema feed:

- list published stories from the published schema feed
- fetch a story by slug from the published schema feed

The client accepts a workspace API token and sends it as a bearer token.

## Installation

Install from GitHub Packages:

```bash
npm install @storydock/storydock-sdk
```

Each consuming app should have an `.npmrc` entry like this:

```ini
@storydock:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

The token should have at least `read:packages`.

Quick setup in another project:

1. Create or update `.npmrc` with the `@storydock` registry entry.
2. Provide a GitHub token that can read packages.
3. Install the SDK with `npm install @storydock/storydock-sdk`.

If the consuming project uses environment variables for npm auth, this also works:

```ini
@storydock:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

If you want to install directly from the GitHub repository instead of a package registry, npm can do that too.

Repository URL:

```bash
npm install github:storydock/storydock-sdk
```

HTTPS:

```bash
npm install git+https://github.com/storydock/storydock-sdk.git
```

SSH:

```bash
npm install git+ssh://git@github.com/storydock/storydock-sdk.git
```

This repository includes a `prepare` script, so npm will build the SDK during Git-based installs.

For local development in this repository:

```bash
npm install
```

## Usage

```ts
import { createStorydockClient } from "@storydock/storydock-sdk";

const client = createStorydockClient({
	apiToken: process.env.STORYDOCK_API_TOKEN,
});

const stories = await client.listStories({ page: 1, pageSize: 10 });
const story = await client.getStory("example-slug");
document.querySelector("#story")!.innerHTML = story.contentHtml;

console.log(stories.data.map((item) => item.slug));
console.log(story.title);
```

CommonJS projects can use `require`:

```js
const { createStorydockClient } = require("@storydock/storydock-sdk");

const client = createStorydockClient({
	apiToken: process.env.STORYDOCK_API_TOKEN,
});

client.getStory("example-slug").then((story) => {
	console.log(story.contentHtml);
});
```

## Configuration

- The SDK is hardwired to `https://api.storydock.ai`
- `apiToken`: optional workspace-scoped bearer token attached to every request
- `timeoutMs`: optional request timeout, defaults to `8000`
- `fetch`: optional fetch implementation override
- `userAgent`: optional identifier attached as `X-Storydock-Client`

## Development

Run the local build and test suite from the repository root:

```bash
npm run build
npm test
```

## Publishing

Publishing is handled by GitHub Actions when a version tag is pushed.

1. Update the version in `package.json`
2. Commit and push `main`
3. Create a tag such as `v0.1.2`
4. Push the tag to GitHub

```bash
git tag v0.1.2
git push origin v0.1.2
```

The publish workflow uses the repository `GITHUB_TOKEN` to publish to GitHub Packages.

Run the live smoke test:

```bash
npm run smoke
```

Optional environment variables:

```bash
STORYDOCK_API_TOKEN=your-workspace-token-here
```

The smoke script will:

- list stories
- fetch the first story by slug when one exists

## API Surface

```ts
type StorydockClient = {
	listStories(input?: { page?: number; pageSize?: number }): Promise<PaginatedStoriesResponse>;
	getStory(slug: string): Promise<Story>;
};
```

## Notes

- `getStory()` returns `contentHtml`, which is the rendered article HTML intended for direct frontend display.
- `listStories()` maps the SDK pagination input to the backend `page` and `take` query parameters.
- The SDK first requests `/api/feeds/published-schema` and falls back to `/api/feed/published-schema` if the plural route returns `404`.