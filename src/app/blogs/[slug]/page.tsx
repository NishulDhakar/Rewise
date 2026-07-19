import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

// 1. Generate Metadata dynamically for SEO optimization (meta tags, OG tags, etc.)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Dynamic import to read MDX metadata
    const { metadata } = await import(`@/content/blogs/${slug}.mdx`);

    return {
      title: `${metadata.title} — Rewise`,
      description: metadata.description,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        type: 'article',
        publishedTime: metadata.date,
        authors: [metadata.author],
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description,
      },
    };
  } catch (error) {
    return {
      title: 'Post Not Found — Rewise',
    };
  }
}

// 2. Generate Static Params at build time to statically pre-render all posts (extreme speed & SEO crawler friendly)
export function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'src/content/blogs');

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir);
  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => ({
      slug: file.replace(/\.mdx$/, ''),
    }));
}

// 3. Render the Blog Post Page
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let Post;
  let metadata;

  try {
    const module = await import(`@/content/blogs/${slug}.mdx`);
    Post = module.default;
    metadata = module.metadata;
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text-white flex flex-col font-instrument">
      {/* Header Navigation */}
      <header className="border-b border-border-subtle bg-bg-dark/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/blogs"
            className="flex items-center gap-2 font-sans text-text-gray hover:text-brand-cyan transition-colors group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-4">
            <AnimatedThemeToggler className="flex items-center justify-center p-2 rounded-lg border border-border-subtle bg-card-dark hover:border-brand-cyan hover:text-brand-cyan transition-all text-xs glow-btn font-semibold text-text-gray" />
            <span className="font-sans text-lg font-black tracking-widest text-text-white">
              RE<span className="text-brand-cyan">WISE</span>
            </span>
          </div>
        </div>
      </header>

      {/* Article Content Wrapper */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 md:py-16 w-full">
        <article className="relative">
          {/* Post Header */}
          <header className="mb-10 pb-8 border-b border-border-subtle">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-text-gray mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                {new Date(metadata.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                {metadata.readTime}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-white" />
                {metadata.author}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-text-white mb-6 leading-tight">
              {metadata.title}
            </h1>

            {/* Description */}
            <p className="text-text-gray font-medium text-md font-sans leading-relaxed">
              {metadata.description}
            </p>
          </header>

          {/* Render MDX Content */}
          <div className="pb-16">
            <Post />
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle/50 py-8 bg-card-dark/20 text-center text-xs text-text-dim font-sans">
        <p>© 2026 Rewise. Spaced Repetition Todo App.</p>
      </footer>
    </div>
  );
}
