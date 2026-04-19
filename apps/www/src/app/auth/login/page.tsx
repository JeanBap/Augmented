"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@raiseready/auth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Mail, Loader } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage("Failed to sign in with Google. Please try again.");
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (error) {
      setErrorMessage("Failed to send magic link. Please try again.");
      console.error("Magic link error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Navigation />

      <main>
        {/* Header */}
        <section className="section-padding bg-gradient-to-br from-brand-navy to-brand-navy text-brand-cream">
          <div className="container-wide">
            <h1 className="text-5xl font-serif font-bold mb-2">Sign In</h1>
            <p className="text-lg text-brand-cream/90">
              Access your dashboard and resources
            </p>
          </div>
        </section>

        {/* Login Form */}
        <section className="section-padding bg-brand-cream">
          <div className="container-narrow">
            <div className="card p-8 md:p-12 max-w-md mx-auto">
              {emailSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-brand-gold" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold mb-4">
                    Check your email
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We've sent a sign-in link to{" "}
                    <strong>{email}</strong>
                    . Click the link to access your account.
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    If you don't see the email, check your spam folder or try
                    again.
                  </p>
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="btn-ghost text-sm"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    Welcome Back
                  </h2>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                      {errorMessage}
                    </div>
                  )}

                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full border-2 border-gray-300 text-brand-navy hover:bg-gray-50 font-semibold px-6 py-3 rounded-lg transition-all duration-200 mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-brand-cream text-gray-600">Or</span>
                    </div>
                  </div>

                  {/* Magic Link */}
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-brand-navy mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input-field"
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Send Magic Link
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{" "}
                    <button className="text-brand-gold hover:text-brand-gold/80 font-semibold">
                      Sign up instead
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="section-padding bg-brand-navy text-brand-cream">
          <div className="container-narrow">
            <h2 className="text-3xl font-serif font-bold text-center mb-8">
              Secure & Private
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-serif font-bold mb-2">Encrypted</h3>
                <p className="text-sm text-brand-cream/80">
                  Your data is encrypted end-to-end
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-serif font-bold mb-2">No Passwords</h3>
                <p className="text-sm text-brand-cream/80">
                  Magic links make it simple and secure
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <h3 className="font-serif font-bold mb-2">Protected</h3>
                <p className="text-sm text-brand-cream/80">
                  Industry-standard security measures
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
