import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Services | Raise Ready",
  description: "Get professional fundraising advisory and financial modeling services",
};

const services = [
  {
    id: "audit",
    title: "Fundraising Readiness Audit",
    price: "$990",
    description: "Comprehensive assessment of your fundraising preparation",
    fullDescription:
      "Get a detailed analysis of your readiness for fundraising. We'll review your financials, pitch deck, investor strategy, and go-to-market fit.",
    timeframe: "2 weeks",
    deliverables: [
      "Detailed readiness report",
      "Financial model assessment",
      "Pitch deck feedback",
      "Investor targeting recommendations",
      "Go-to-market analysis",
      "Action plan with priorities",
    ],
    ideal: "Startups 6-12 months away from fundraising",
  },
  {
    id: "advisory",
    title: "Fractional Fundraise Advisory",
    price: "$2,000/mo",
    description: "Ongoing strategic guidance through your fundraising journey",
    fullDescription:
      "Get ongoing expert guidance as you navigate the fundraising process. Monthly strategy sessions, investor introductions, and real-time support.",
    timeframe: "Flexible engagement",
    deliverables: [
      "Monthly strategy sessions (4 hours)",
      "Investor introductions & warm intros",
      "Document review and iteration",
      "Negotiation support",
      "Access to founder network",
      "Email & Slack support",
    ],
    ideal: "Startups actively fundraising or in market prep phase",
  },
  {
    id: "model",
    title: "Model Build",
    price: "$5,000",
    description: "Custom-built financial model tailored to your business",
    fullDescription:
      "We'll build a professional, investor-ready financial model from scratch. Includes 3-statement financials, unit economics, and multiple scenarios.",
    timeframe: "3-4 weeks",
    deliverables: [
      "3-statement financial model",
      "Unit economics analysis",
      "Scenario modeling (base/bear/bull)",
      "Revenue projection framework",
      "Expense management",
      "Investor-ready formatting",
      "Model training session",
    ],
    ideal: "Startups needing professional financial projections",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Discovery Call",
    description: "We learn about your business, goals, and specific needs",
  },
  {
    number: "02",
    title: "Assessment",
    description: "We dive deep into your current state and opportunities",
  },
  {
    number: "03",
    title: "Strategy Session",
    description: "We present findings and agree on the path forward",
  },
  {
    number: "04",
    title: "Execution",
    description: "We work with you to deliver results and achieve goals",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Navigation />

      <main>
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
              Professional Services
            </h1>
            <p className="text-lg text-brand-cream/90 max-w-2xl">
              Expert guidance tailored to your fundraising journey
            </p>
          </div>
        </section>

        {/* Services Overview */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <div className="space-y-8">
              {services.map((service, idx) => (
                <div
                  key={service.id}
                  className={`card p-8 ${
                    idx === 1 ? "ring-2 ring-gold relative" : ""
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute -top-4 left-6 bg-gold text-brand-navy px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Service</p>
                      <h2 className="text-3xl font-serif font-bold text-brand-navy">
                        {service.title}
                      </h2>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Investment</p>
                      <p className="text-3xl font-bold text-brand-gold">
                        {service.price}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Timeline</p>
                      <p className="text-lg font-semibold text-brand-navy">
                        {service.timeframe}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6">{service.fullDescription}</p>

                  <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
                    <div>
                      <h3 className="font-semibold text-brand-navy mb-4">Deliverables</h3>
                      <ul className="space-y-3">
                        {service.deliverables.map((deliverable, didx) => (
                          <li key={didx} className="flex items-start text-sm">
                            <Check className="w-4 h-4 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-brand-navy mb-2">
                        Ideal For
                      </h3>
                      <p className="text-sm text-gray-700 mb-6">
                        {service.ideal}
                      </p>
                      <button
                        className={`w-full ${
                          idx === 1 ? "btn-primary" : "btn-secondary"
                        }`}
                      >
                        Learn More
                        <ArrowRight className="inline ml-2 w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className={idx === 1 ? "btn-primary" : "btn-secondary"}>
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="section-padding bg-white">
          <div className="container-wide">
            <h2 className="text-4xl font-serif font-bold text-center mb-12">
              Our Process
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-serif font-bold text-brand-gold">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2 text-brand-navy">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  {idx < processSteps.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-24 text-brand-gold/30 text-2xl">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="section-padding bg-brand-cream">
          <div className="container-wide">
            <h2 className="text-4xl font-serif font-bold text-center mb-12">
              Service Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-brand-navy text-brand-cream">
                  <tr>
                    <th className="border-b border-gray-300 p-4 text-left">
                      Feature
                    </th>
                    <th className="border-b border-gray-300 p-4 text-center">
                      Audit
                    </th>
                    <th className="border-b border-gray-300 p-4 text-center">
                      Advisory
                    </th>
                    <th className="border-b border-gray-300 p-4 text-center">
                      Model Build
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Expert Analysis",
                      audit: true,
                      advisory: true,
                      model: true,
                    },
                    {
                      feature: "Custom Deliverables",
                      audit: true,
                      advisory: true,
                      model: true,
                    },
                    {
                      feature: "Monthly Sessions",
                      audit: false,
                      advisory: true,
                      model: false,
                    },
                    {
                      feature: "Investor Intros",
                      audit: false,
                      advisory: true,
                      model: false,
                    },
                    {
                      feature: "Ongoing Support",
                      audit: false,
                      advisory: true,
                      model: false,
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-4 font-semibold text-gray-700">
                        {row.feature}
                      </td>
                      <td className="p-4 text-center">
                        {row.audit ? (
                          <Check className="w-5 h-5 text-brand-gold mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.advisory ? (
                          <Check className="w-5 h-5 text-brand-gold mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.model ? (
                          <Check className="w-5 h-5 text-brand-gold mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Books Complement */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-narrow text-center">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Complement with Books
            </h2>
            <p className="text-lg text-brand-cream/90 mb-8">
              Combine our books with professional services for complete
              expertise. Learn at your own pace and get personalized guidance
              when you need it.
            </p>
            <Link href="/books" className="btn-secondary inline-block">
              Explore Our Books
              <ArrowRight className="inline ml-2 w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-padding bg-brand-cream">
          <div className="container-narrow">
            <h2 className="text-4xl font-serif font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "How do I get started?",
                  a: "Click 'Get Started' on any service. We'll schedule a discovery call to understand your needs and create a tailored plan.",
                },
                {
                  q: "Can I combine services?",
                  a: "Absolutely! Many founders start with an Audit, then engage in Advisory, and add Model Build as needed. We can create a custom package.",
                },
                {
                  q: "What's the payment terms?",
                  a: "Audit and Model Build are one-time payments. Advisory is monthly and can be canceled anytime with 30 days notice.",
                },
                {
                  q: "Do you work with international startups?",
                  a: "Yes! We work with founders worldwide. We adjust our process to account for different regulatory environments.",
                },
              ].map((faq, idx) => (
                <details key={idx} className="card p-6 cursor-pointer group">
                  <summary className="flex items-center justify-between font-semibold text-brand-navy">
                    {faq.q}
                    <span className="text-brand-gold group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="text-gray-700 mt-4">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
