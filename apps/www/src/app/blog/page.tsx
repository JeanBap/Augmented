import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Blog | Raise Ready",
  description: "Insights and resources for startup founders and fundraising",
};

const categories = [
  { id: "all", name: "All Articles", count: 8 },
  { id: "fundraising", name: "Fundraising", count: 2 },
  { id: "financial-modeling", name: "Financial Modeling", count: 5 },
  { id: "startup-growth", name: "Startup Growth", count: 1 },
  { id: "investor-insights", name: "Investor Insights", count: 1 },
];

const blogPosts = [
  {
    id: 1,
    title: "The Complete Guide to Series A Fundraising",
    excerpt:
      "Everything you need to know about raising your Series A round, from preparation to closing.",
    category: "fundraising",
    author: "Sarah Chen",
    date: "Mar 15, 2024",
    readTime: "8 min",
    featured: true,
  },
  {
    id: 2,
    title: "5 Financial Model Mistakes Founders Make",
    excerpt:
      "Common pitfalls in financial modeling and how to avoid them when pitching to investors.",
    category: "financial-modeling",
    author: "Michael Rodriguez",
    date: "Mar 12, 2024",
    readTime: "6 min",
    featured: true,
  },
  {
    id: 3,
    title: "Understanding Your Unit Economics",
    excerpt:
      "A deep dive into calculating and optimizing the unit economics that matter most.",
    category: "financial-modeling",
    author: "Jessica Wang",
    date: "Mar 8, 2024",
    readTime: "7 min",
    featured: false,
  },
  {
    id: 4,
    title: "How Investors Evaluate Startups",
    excerpt:
      "What VCs are really looking for and how to present your business to maximize investment appeal.",
    category: "investor-insights",
    author: "David Kim",
    date: "Mar 5, 2024",
    readTime: "9 min",
    featured: false,
  },
  {
    id: 5,
    title: "Scaling from Pre-Seed to Series A",
    excerpt:
      "Strategic advice for growing your startup through your earliest funding stages.",
    category: "startup-growth",
    author: "Emily Zhang",
    date: "Mar 1, 2024",
    readTime: "8 min",
    featured: false,
  },
  {
    id: 6,
    title: "The Investor Data Room Checklist",
    excerpt:
      "Everything investors need to see during due diligence and how to organize it effectively.",
    category: "fundraising",
    author: "Alex Thompson",
    date: "Feb 28, 2024",
    readTime: "6 min",
    featured: false,
  },
  {
    id: 7,
    slug: "saas-gross-margin-benchmarks-vc-expectations",
    title: "SaaS Gross Margin Benchmarks: What Investors Expect From Your Numbers",
    excerpt:
      "Gross margin benchmarks by ARR stage and delivery model, why the number matters, and how to present it to VCs before they ask.",
    category: "financial-modeling",
    author: "Yanni Papoutsis",
    date: "Apr 17, 2026",
    readTime: "7 min",
    featured: false,
  },
  {
    id: 8,
    slug: "startup-financial-model-vc-trust",
    title: "How to Build a Startup Financial Model That VCs Will Trust",
    excerpt:
      "The five-section architecture of a VC-ready financial model: from bottoms-up revenue build to burn and runway projection.",
    category: "financial-modeling",
    author: "Yanni Papoutsis",
    date: "Apr 17, 2026",
    readTime: "8 min",
    featured: false,
  },
];

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
                          href={`/blog/${post.id}`}
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
                        href={`/blog/${post.id}`}
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
