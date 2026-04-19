"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@raiseready/auth";
import { NavHeader } from "@/components/nav-header";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const createModelSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  stage: z.enum(["seed", "series-a", "series-b", "growth", "pre-revenue"]),
  startingMonth: z.string().min(1, "Starting month is required"),
});

type CreateModelInput = z.infer<typeof createModelSchema>;

const INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Marketplace",
  "B2B",
  "B2C",
  "Other",
];

const STAGES = [
  { value: "pre-revenue", label: "Pre-Revenue" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

export default function NewModelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateModelInput>({
    resolver: zodResolver(createModelSchema),
  });

  const onSubmit = async (data: CreateModelInput) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Create model in Supabase using @raiseready/db
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to create model");

      const { id } = await response.json();
      toast.success("Model created successfully");
      router.push(`/model/${id}`);
    } catch (error) {
      toast.error("Failed to create model");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <NavHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Create a New Financial Model
          </h1>
          <p className="text-navy/60">
            Tell us about your company and we'll create your financial model.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-navy mb-2">
              Company Name
            </label>
            <input
              {...register("companyName")}
              type="text"
              id="companyName"
              placeholder="Acme Inc."
              className="w-full px-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {errors.companyName && (
              <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-navy mb-2">
              Industry
            </label>
            <select
              {...register("industry")}
              id="industry"
              className="w-full px-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-navy mb-2">
              Funding Stage
            </label>
            <select
              {...register("stage")}
              id="stage"
              className="w-full px-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select a stage</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors.stage && (
              <p className="text-sm text-red-600 mt-1">{errors.stage.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startingMonth" className="block text-sm font-medium text-navy mb-2">
              Starting Month
            </label>
            <input
              {...register("startingMonth")}
              type="month"
              id="startingMonth"
              className="w-full px-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {errors.startingMonth && (
              <p className="text-sm text-red-600 mt-1">{errors.startingMonth.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            Create Model
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
