import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { getPostBySlug, getPublishedPosts } from "../blog-posts-data";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const posts = getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Post Not Found | Raise Ready" };
  return {
    title: `${post.title} | Raise Ready`,
    description: post.metaDescription || post.excerpt,
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      <Navigation />
      <main>
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide max-w-4xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-brand-cream/70 hover:text-brand-cream mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
            <div className="inline-block bg-gold/20 text-brand-gold text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {post.category
                .split("-")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-brand-cream/80 mb-6 max-w-2xl">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-brand-cream/60">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime} read
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-brand-cream">
          <div className="container-wide max-w-4xl">
            <article
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-navy prose-a:text-brand-gold prose-strong:text-brand-navy"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-brand-gold hover:text-brand-navy font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all articles
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
