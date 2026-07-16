import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

// This file is required to use MDX in Next.js App Router
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom elements mapping for consistent premium cyber look
    h1: ({ children }) => (
      <h1 className="text-3xl font-extrabold mt-10 mb-6 text-text-white tracking-tight border-b border-border-subtle pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-cyan tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl  font-semibold mt-6 mb-3 text-brand-purple tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg  font-medium mt-4 mb-2 text-text-white">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-text-gray font-sans leading-relaxed mb-5 text-base ">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6  font-sans mb-5 space-y-2 text-text-gray">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-5 space-y-2 text-text-gray font-sans">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed pl-1">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-brand-cyan bg-card-dark/65 px-5 py-3 my-6 italic rounded-r border-dashed text-text-gray shadow-md">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-card-dark px-1.5 py-0.5 rounded text-brand-cyan font-sans text-xs border border-border-subtle">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-card-dark p-4 rounded-xl overflow-x-auto my-8 border border-border-subtle text-xs font-sans shadow-inner">
        {children}
      </pre>
    ),
    a: ({ href, children }) => {
      const isInternal = href?.startsWith('/') || href?.startsWith('#');
      if (isInternal) {
        return (
          <Link href={href || '/'} className="text-brand-cyan hover:text-brand-cyan/80 hover:underline decoration-brand-cyan/40 decoration-wavy transition-all font-medium">
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:text-brand-cyan/80 hover:underline decoration-brand-cyan/40 decoration-wavy transition-all font-medium inline-flex items-center gap-0.5">
          {children}
        </a>
      );
    },
    hr: () => <hr className="my-10 border-border-subtle border-dashed" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-lg border border-border-subtle">
        <table className="min-w-full font-sans border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-card-dark/80 text-text-white border-b border-border-subtle">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border-subtle bg-card-dark/20">{children}</tbody>,
    tr: ({ children }) => <tr className="hover:bg-card-dark/40 transition-colors">{children}</tr>,
    th: ({ children }) => <th className="px-5 py-3 text-left font-bold tracking-wider">{children}</th>,
    td: ({ children }) => <td className="px-5 py-3 text-text-gray font-light">{children}</td>,
    ...components,
  };
}
