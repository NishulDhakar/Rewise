import Link from 'next/link';
import type { Metadata } from 'next';
import { getBlogPosts } from '@/utils/blog';
import { BookOpen, ArrowLeft, Calendar, Clock, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rewise Blog — Productivity, Memory & Spaced Repetition',
  description: 'Articles and guides on spaced repetition, learning efficiency, time saving, and cognitive science.',
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-bg-dark text-text-white flex flex-col font-instrument">
      {/* Header Navigation */}
      <header className="border-b border-border-subtle bg-bg-dark/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center font-sans justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-gray hover:text-brand-cyan transition-colors group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded border border-brand-cyan/30 text-brand-cyan font-sans bg-brand-cyan/5">
              BLOG
            </span>
            <span className="font-sans text-lg font-black tracking-widest text-text-white">
              RE<span className="text-brand-cyan">WISE</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 w-full">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-text-white">
            Master the Art of <span className="text-transparent text-font-instrument bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">Remembering</span>
          </h1>
          <p className="text-text-gray text-base font-light font-sans leading-relaxed">
            Exploring the intersection of memory science, learning optimization, and digital productivity rules to make your knowledge permanent.
          </p>
        </div>

        {/* Blog Post List */}
        {posts.length === 0 ? (
          <div className="text-center py-20 border border-border-subtle rounded-2xl bg-card-dark/40">
            <BookOpen className="w-12 h-12 text-text-dim mx-auto mb-4" />
            <p className="text-text-gray font-light">No articles published yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-card-dark border border-border-subtle hover:border-border-glow transition-all duration-300 shadow-lg "
              >
                {/* Decorative background glow on hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-cyan/0 via-brand-purple/0 to-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div>
                  {/* Article Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-gray mb-4 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Article Title */}
                  <h2 className="text-xl font-bold mb-3 text-text-white group-hover:text-brand-cyan transition-colors leading-snug">
                    <Link href={`/blogs/${post.slug}`} className="focus:outline-none">
                      {/* Make whole card clickable with parent relative */}
                      <span className="absolute inset-0 rounded-2xl" aria-hidden="true" />
                      {post.title}
                    </Link>
                  </h2>

                  {/* Article Description */}
                  <p className="text-text-gray/85 text-sm font-sans font-light leading-relaxed mb-6">
                    {post.description}
                  </p>
                </div>

                {/* Author Info & CTA */}
                <div className="flex items-center font-sans justify-between border-t border-border-subtle/50 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-text-gray">
                    <div className="w-6 h-6 rounded-full bg-border-subtle flex items-center justify-center">
                      <User className="w-3 h-3 text-text-white" />
                    </div>
                    <span>{post.author}</span>
                  </div>
                  <span className="text-xs font-sans text-brand-cyan group-hover:translate-x-1 transition-transform font-sans font-semibold flex items-center gap-1">
                    Read Article →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle/50 py-8 bg-card-dark/20 text-center text-xs text-text-dim font-sans">
        <p>© 2026 Rewise. Spaced Repetition Todo App.</p>
      </footer>
    </div>
  );
}
