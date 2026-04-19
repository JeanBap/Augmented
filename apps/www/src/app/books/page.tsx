import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { BuyNowButton } from "@/components/buy-now-button";

export const metadata = {
  title: "Books | Raise Ready",
  description: "Purchase our comprehensive guide series on startup development and fundraising",
};

const books = [
  {
    id: "start-ready",
    title: "Start Ready",
    price: 4.99,
    description: "The foundations of preparing your startup for investment",
    fullDescription:
      "Learn the essential fundamentals every startup founder needs to understand about business structure, legal setup, and early-stage preparation.",
    chapters: 5,
    readTime: "45 min",
  },
  {
    id: "raise-ready",
    title: "Raise Ready",
    price: 9.99,
    description: "Master the art of fundraising and investor relations",
    fullDescription:
      "Navigate the fundraising landscape with confidence. Understand investor expectations, build compelling narratives, and close your funding round.",
    chapters: 8,
    readTime: "2 hrs",
  },
  {
    id: "analytics-ready",
    title: "Analytics Ready",
    price: 9.99,
    description: "OKRs, KPIs, and data-driven strategy for every startup stage",
    fullDescription:
      "The missing operations manual for startup metrics. Maps OKRs, KPIs, and data strategy to every stage of the startup lifecycle, from your first 90 days through exit due diligence.",
    chapters: 48,
    readTime: "3 hrs",
  },
  {
    id: "model-ready",
    title: "Model Ready",
    price: 9.99,
    description: "Build your investor-ready financial model in 60 minutes",
    fullDescription:
      "Step-by-step guide to creating professional financial projections that investors actually want to see. Includes templates and real-world examples.",
    chapters: 6,
    readTime: "1.5 hrs",
  },
  {
    id: "exit-ready",
    title: "Exit Ready",
    price: 9.99,
    description: "Prepare for a successful exit or acquisition",
    fullDescription:
      "Understand the exit landscape, prepare your business for sale, and maximize valuation when the time comes to exit.",
    chapters: 7,
    readTime: "1 hr 45 min",
  },
];

export default function BooksPage() {
  return (
    <>
      <Navigation />

      <main>
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              Our Books
            </h1>
            <p className="text-lg text-brand-cream/90 max-w-2xl">
              Comprehensive guides for every stage of startup development
            </p>
          </div>
        </section>

        {/* Books Grid */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-8">
              {books.map((book) => (
                <div key={book.id} className="card p-8">
                  <div className="bg-gradient-to-br from-gold/10 to-brand-navy/10 h-48 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-2">📖</div>
                      <p className="text-sm text-gray-600">{book.title}</p>
                    </div>
                  </div>

                  <h2 className="text-3xl font-serif font-bold mb-2 text-brand-navy">
                    {book.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{book.description}</p>

                  <p className="text-sm text-gray-500 mb-4">{book.fullDescription}</p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                    <span>{book.chapters} chapters</span>
                    <span>{book.readTime} read time</span>
                  </div>

                  <div className="border-t pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Price</p>
                      <p className="text-3xl font-bold text-brand-gold">
                        ${book.price.toFixed(2)}
                      </p>
                    </div>
                    <BuyNowButton productId={book.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bundle Offer */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-narrow text-center">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Get All 5 Books
            </h2>
            <p className="text-lg text-brand-cream/90 mb-8">
              Complete your education with our full book series. Get all 5 books
              for just $39.99 — a 20% savings!
            </p>
            <button className="btn-primary">
              Bundle All Books
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <h2 className="text-4xl font-serif font-bold text-center mb-12">
              What Founders Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    "These books saved me months of learning and thousands in consultant fees.",
                  author: "Sarah Chen",
                  title: "Founder & CEO",
                },
                {
                  quote:
                    "The financial modeling guide was exactly what we needed before our Series A pitch.",
                  author: "Michael Rodriguez",
                  title: "CTO & Co-founder",
                },
                {
                  quote:
                    "Clear, practical, and immediately actionable. Highly recommended.",
                  author: "Jessica Wang",
                  title: "Operations Manager",
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="card p-6">
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-brand-navy">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services CTA */}
        <section className="section-padding bg-white">
          <div className="container-narrow text-center">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Want Expert Help?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Complement your learning with our professional services and get
              personalized guidance from industry experts.
            </p>
            <Link href="/services" className="btn-primary">
              Explore Services
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
