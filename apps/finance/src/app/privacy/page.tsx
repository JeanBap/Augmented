export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-navy mb-4">Privacy Policy</h1>
          <p className="text-navy/70">Last updated: March 25, 2026</p>
        </div>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-navy/80 leading-relaxed mb-4">
            At Raise Ready, we are committed to protecting your privacy and ensuring you have a positive experience on our Financial Model Builder application. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our service.
          </p>
        </section>

        {/* Data Collection */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">1. What Data We Collect</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100 space-y-4">
            <div>
              <h3 className="font-semibold text-navy mb-2">From Google Sign-In:</h3>
              <ul className="list-disc list-inside text-navy/80 space-y-1 ml-2">
                <li>Email address</li>
                <li>Name</li>
                <li>Profile picture (optional)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">Financial Model Data:</h3>
              <ul className="list-disc list-inside text-navy/80 space-y-1 ml-2">
                <li>Financial models you create and save</li>
                <li>Company information and financial projections you input</li>
                <li>Any documents or files you upload for analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">Usage Information:</h3>
              <ul className="list-disc list-inside text-navy/80 space-y-1 ml-2">
                <li>IP address and browser information</li>
                <li>Pages visited and features used</li>
                <li>Time spent in the application</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Data */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">2. How We Use Your Data</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <ul className="list-disc list-inside text-navy/80 space-y-2">
              <li>To authenticate you and provide access to your account</li>
              <li>To store and retrieve your financial models</li>
              <li>To provide, maintain, and improve the Financial Model Builder service</li>
              <li>To send you service-related announcements and updates</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </div>
        </section>

        {/* Data Storage */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">3. Data Storage</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80 mb-3">
              Your data is stored in Supabase, a secure cloud database service. Supabase implements industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-navy/80 space-y-2">
              <li>Encryption at rest and in transit</li>
              <li>Regular security audits and updates</li>
              <li>Automatic backups and disaster recovery</li>
              <li>Access controls and authentication</li>
            </ul>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">4. Third-Party Services</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100 space-y-4">
            <div>
              <h3 className="font-semibold text-navy mb-2">Google Authentication</h3>
              <p className="text-navy/80">
                We use Google Sign-In to authenticate users. Google processes your authentication information according to their Privacy Policy.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">Supabase</h3>
              <p className="text-navy/80">
                We use Supabase for data storage and backend services. Your data is processed according to Supabase's privacy and security policies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">Stripe</h3>
              <p className="text-navy/80">
                Payment processing is handled by Stripe. We do not store credit card information. Stripe processes payments according to their privacy policies and PCI compliance standards.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">5. Data Sharing</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80 mb-3">
              <strong>We do not sell your personal data.</strong> We only share your information with third-party service providers who are necessary to operate and improve our service:
            </p>
            <ul className="list-disc list-inside text-navy/80 space-y-2">
              <li>Service providers under confidentiality agreements</li>
              <li>Legal authorities when required by law</li>
              <li>Our service partners only to the extent necessary to provide services</li>
            </ul>
          </div>
        </section>

        {/* User Rights */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">6. Your Rights</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-navy/80 space-y-2">
              <li>Access your personal data and financial models</li>
              <li>Request corrections to your information</li>
              <li>Delete your account and associated data by contacting our support team</li>
              <li>Opt-out of non-essential communications</li>
              <li>Request a copy of your data in a portable format</li>
            </p>
            <p className="text-navy/80 mt-4">
              To exercise these rights, please contact us at <a href="mailto:papoutsis89@gmail.com" className="text-gold font-semibold hover:text-gold/80 transition-colors">papoutsis89@gmail.com</a>.
            </p>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">7. Children's Privacy</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80">
              The Financial Model Builder is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information and terminate the child's account.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">8. Security</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-navy mb-4">9. Contact Us</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80 mb-3">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-navy/80">
                <strong>Email:</strong> <a href="mailto:papoutsis89@gmail.com" className="text-gold font-semibold hover:text-gold/80 transition-colors">papoutsis89@gmail.com</a>
              </p>
              <p className="text-navy/80">
                <strong>Company:</strong> Raise Ready
              </p>
            </div>
          </div>
        </section>

        {/* Changes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-navy mb-4">10. Changes to This Policy</h2>
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <p className="text-navy/80">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Financial Model Builder following the posting of changes constitutes your acceptance of those changes.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-navy/60">
            © 2026 Raise Ready. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
