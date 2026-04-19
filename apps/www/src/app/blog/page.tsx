import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { getPublishedPosts } from "./blog-posts-data";

export const metadata = {
  title: "Blog | Raise Ready",
  description: "Insights and resources for startup founders and fundraising",
};

const categories = [
  { id: "all", name: "All Articles", count: 15 },
  { id: "fundraising", name: "Fundraising", count: 2 },
  { id: "financial-modeling", name: "Financial Modeling", count: 11 },
  { id: "startup-growth", name: "Startup Growth", count: 1 },
  { id: "investor-insights", name: "Investor Insights", count: 1 },
];

const blogPosts = getPublishedPosts();

export default function BlogPage() {
  return (
    <>
      <Navigation />

      <main>
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              Insights & Resources
            </h1>
            <p className="text-lg text-brand-cream/90 max-w-2xl">
              Expert advice, practical guides, and insights for startup founders
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar - Categories */}
              <div className="lg:col-span-1">
                <div className="card p-6 sticky top-6">
                  <h2 className="text-lg font-serif font-bold mb-4">
                    Categories
                  </h2>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          cat.id === "all"
                            ? "bg-gold/20 text-brand-gold font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="block">{cat.name}</span>
                        <span className="text-sm text-gray-500">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Featured Posts */}
                <div className="mb-12">
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    Featured Articles
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {blogPosts
                      .filter((post) => post.featured)
                      .map((post) => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="card p-6 group hover:shadow-xl"
                        >
                          <div className="bg-gradient-to-br from-gold/10 to-brand-navy/10 h-40 rounded-lg mb-4 group-hover:from-gold/20 group-hover:to-brand-navy/20 transition-colors" />
                          <div className="inline-block bg-gold/20 text-brand-gold text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            {post.category
                              .split("-")
                              .map(
                                (w) =>
                                  w.charAt(0).toUpperCase() + w.slice(1)
                              )
                              .join(" ")}
                          </div>
                          <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-brand-gold transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              {post.author}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {post.date}
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>

                {/* All Posts */}
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    Latest Articles
                  </h2>
                  <div className="space-y-4">
                    {blogPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="card p-6 group hover:shadow-lg flex items-start gap-4"
                      >
                        <div className="w-32 h-32 bg-gradient-to-br from-gold/10 to-brand-navy/10 rounded-lg flex-shrink-0 hidden sm:block group-hover:from-gold/20 group-hover:to-brand-navy/20 transition-colors" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-lg font-serif font-bold group-hover:text-brand-gold transition-colors flex-1">
                              {post.title}
                            </h3>
                            <ArrowRight className="w-5 h-5 text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {post.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="bg-gold/20 text-brand-gold px-2 py-1 rounded">
                              {post.category
                                .split("-")
                                .map(
                                  (w) =>
                                    w.charAt(0).toUpperCase() + w.slice(1)
                                )
                                .join(" ")}
                            </span>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {post.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.date}
                            </div>
                            <span>{post.readTime} read</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-narrow">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold mb-4">
                Stay Updated
              </h2>
              <p className="text-lg text-brand-cream/90">
                Get insights and resources delivered to your inbox
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1 bg-brand-cream/10 text-brand-cream border-cream/30 placeholder-cream/50"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
