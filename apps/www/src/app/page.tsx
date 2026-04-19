import Link from "next/link";
import { ArrowRight, BookOpen, Zap, Users } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function HomePage() {
  const books = [
    {
      id: "start-ready",
      title: "Start Ready",
      price: 4.99,
      description: "The foundations of preparing your startup for investment",
    },
    {
      id: "raise-ready",
      title: "Raise Ready",
      price: 9.99,
      description: "Master the art of fundraising and investor relations",
    },
    {
      id: "model-ready",
      title: "Model Ready",
      price: 9.99,
      description: "Build your investor-ready financial model in 60 minutes",
    },
    {
      id: "exit-ready",
      title: "Exit Ready",
      price: 9.99,
      description: "Prepare for a successful exit or acquisition",
    },
  ];

  const services = [
    {
      title: "Fundraising Readiness Audit",
      price: "$990",
      description: "Comprehensive assessment of your fundraising preparation",
      features: [
        "Financial model review",
        "Pitch deck analysis",
        "Investor targeting assessment",
        "Go-to-market readiness",
      ],
    },
    {
      title: "Fractional Fundraise Advisory",
      price: "$2,000/mo",
      description: "Ongoing strategic guidance through your fundraising journey",
      features: [
        "Monthly strategy sessions",
        "Investor introductions",
        "Document review",
        "Negotiation support",
      ],
    },
    {
      title: "Model Build",
      price: "$5,000",
      description: "Custom-built financial model tailored to your business",
      features: [
        "3-statement model",
        "Scenario analysis",
        "Unit economics",
        "Investor-ready formatting",
      ],
    },
  ];

  return (
    <>
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="section-padding bg-gradient-to-br from-brand-navy via-navy to-brand-navy bg-opacity-95 text-brand-cream relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl"
              style={{ transform: "translate(50%, -50%)" }}
            />
          </div>

          <div className="container-wide relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6">
                Build your investor-ready financial model in 60 minutes.
              </h1>
              <p className="text-lg md:text-xl text-brand-cream/90 mb-8 max-w-2xl">
                Everything founders need to understand their numbers, prepare for
                investors, and make confident decisions about their future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={process.env.NEXT_PUBLIC_APP_URL || "#"}
                  className="btn-primary text-center"
                >
                  Build Model Now
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </Link>
                <Link
                  href={process.env.NEXT_PUBLIC_FINANCE_URL || "#"}
                  className="btn-secondary text-center"
                >
                  Explore Finance Tools
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Books Section */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Learn from Our Books
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Master every stage of startup development with our comprehensive
                guide series
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="card p-6 group hover:shadow-2xl"
                >
                  <div className="bg-gradient-to-br from-gold/10 to-brand-navy/10 h-32 rounded-lg mb-4 group-hover:from-gold/20 group-hover:to-brand-navy/20 transition-colors flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-brand-gold opacity-60" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-brand-gold transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {book.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-brand-gold">
                      ${book.price.toFixed(2)}
                    </span>
                    <ArrowRight className="w-5 h-5 text-brand-navy group-hover:text-brand-gold transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/books" className="btn-secondary inline-block">
                View All Books <ArrowRight className="inline ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="section-padding bg-white">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Professional Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get expert guidance tailored to your specific fundraising needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="card p-8 flex flex-col group hover:border-gold"
                >
                  <h3 className="text-2xl font-serif font-bold mb-2 group-hover:text-brand-gold transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-3xl font-bold text-brand-gold mb-4">
                    {service.price}
                  </p>
                  <p className="text-gray-600 mb-6 text-sm flex-1">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start text-sm">
                        <span className="text-brand-gold mr-3 font-bold">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn-primary w-full mt-auto">
                    Get Started
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/services" className="btn-secondary inline-block">
                View All Services
                <ArrowRight className="inline ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Tools Overview */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                Comprehensive Tools
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Everything you need to understand your business and prepare for
                investors
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gold rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-brand-navy" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-2">
                  Financial Modeling
                </h3>
                <p className="text-brand-cream/80">
                  Build professional financial models with our intuitive tools
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-brand-navy" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-2">
                  Investor Insights
                </h3>
                <p className="text-brand-cream/80">
                  Learn what investors look for and how to meet their
                  expectations
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-brand-navy" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-2">
                  Educational Content
                </h3>
                <p className="text-brand-cream/80">
                  Access in-depth guides and best practices from industry
                  experts
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/blog" className="btn-secondary inline-block">
                Read Our Blog
                <ArrowRight className="inline ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-brand-cream">
          <div className="container-narrow text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of founders who have built their investor-ready
              financial models with Raise Ready.
            </p>
            <Link href={process.env.NEXT_PUBLIC_APP_URL || "#"} className="btn-primary">
              Build Your Model Now
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
