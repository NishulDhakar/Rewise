import fs from 'fs';
import path from 'path';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readTime: string;
}

/**
 * Fetches all blog posts from the local content directory,
 * parsing their exported metadata and returning them sorted by date.
 */
export async function getBlogPosts(): Promise<BlogPostMeta[]> {
  const blogDir = path.join(process.cwd(), 'src/content/blogs');
  
  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir);

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.mdx'))
      .map(async (file) => {
        const slug = file.replace(/\.mdx$/, '');
        // Import MDX module dynamically to access its exported metadata
        const module = await import(`@/content/blogs/${slug}.mdx`);
        
        return {
          slug,
          title: module.metadata?.title || 'Untitled Post',
          description: module.metadata?.description || '',
          date: module.metadata?.date || new Date().toISOString().split('T')[0],
          author: module.metadata?.author || 'Rewise Author',
          readTime: module.metadata?.readTime || '3 min read',
        } as BlogPostMeta;
      })
  );

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
