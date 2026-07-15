import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// CV content collection. Entries are written by `scripts/build-cv.mjs` at
// build/dev time; the locale is encoded in the filename (cv.es.md / cv.en.md).
// We deliberately omit `schema` so Astro treats every markdown field as
// opaque rendered text. Passing an empty object schema (e.g. `schema: {}`)
// is truthy in Astro 6 and triggers `safeParseAsync`, which `{}` does not
// have — so absence is the KISS-correct choice when no validation matters.
//
// generateId: Astro 6's glob loader slugs `cv.es.md` to `cves` (drops the
// inner dot). We override that to keep the full filename as the id, so the
// page can do `entries.find(e => e.id === 'cv.es.md')`.
const cv = defineCollection({
  loader: glob({
    pattern: 'cv.*.md',
    base: 'src/content',
    generateId: ({ entry }) => entry,
  }),
});

export const collections = { cv };
