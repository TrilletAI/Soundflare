import { defineCollections, defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';

export default defineConfig({
  mdxOptions: {
    // Enable proper code block processing
    remarkCodeTabOptions: {
      parseMdx: true,
    },
  },
});

export const docs = defineDocs({
  dir: 'content/docs',
});

// Blog posts: title/description come from the default schema; date, author,
// and tags are kept via loose() and validated in src/lib/blog.ts
export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.loose(),
});
