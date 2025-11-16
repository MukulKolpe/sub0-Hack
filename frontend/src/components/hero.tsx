// @ts-nocheck comment
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
      {/* Background gradient elements */}
      <div className="absolute inset-0 -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute inset-0 -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Predict the future of art
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            The Prediction Market for
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {" "}
              Art NFTs
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Stake, predict, and earn. Vote on artwork, participate in the
            community vault, and share in the rewards.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/gallery"
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Start Predicting
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-8 py-3 border border-border hover:bg-card text-foreground font-semibold rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
