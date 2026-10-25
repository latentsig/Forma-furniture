# Forma Furniture frontend

The Next.js, React and TypeScript storefront will live here. Authored application
source is `.ts` and `.tsx`; use TypeScript-based styles and do not add standalone
`.js`, `.css` or `.html` source files. The browser will necessarily receive
compiled JavaScript and rendered HTML at runtime.

The TypeScript storefront replaces the former root static pages. The original
image files remain unchanged under `public/image assets`.

## Run the storefront

Use Node.js 20.9 or later:

```text
npm install
npm run dev
```

The Next.js app serves its unchanged furniture imagery from `public/image assets`
through a TypeScript route that validates paths and only returns raster formats.
`npm test` runs the Vitest unit suite; `npm run test:node` runs the media/catalog
checks with Node's built-in runner.
