"use client";

import { useState } from "react";
import { useAuth } from "@raiseready/auth";
import { useRouter } from "next/navigation";
import { NavHeader } from "@/components/nav-header";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmail(email);
      toast.success("Check your email for a sign-in link");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign in");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign in with Google");
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Welcome Back</h1>
          <p className="text-navy/60 mb-8">
            Sign in to your Financial Model Pro account
          </p>

          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Sending Link..." : "Sign In with Email"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-navy/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-navy/60">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-navy/20 text-navy font-semibold rounded-lg hover:bg-navy/5 disabled:opacity-50 transition-colors"
            >
              Sign In with Google
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-navy/60">
            <p>
              Don't have an account?{" "}
              <a href="/auth/signup" className="text-gold hover:text-gold/80 font-medium">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
