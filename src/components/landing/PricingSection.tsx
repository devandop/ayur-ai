import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";
import { CheckCircleIcon } from "lucide-react";

function PricingSection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-b from-background via-muted/3 to-background">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-primary/5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_50%,#000_50%,transparent_85%)] opacity-20"></div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 backdrop-blur-sm mb-6 hover:border-primary/30 transition-colors duration-300">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-primary">Simple Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Choose your
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
              AI ayurvedic plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Book appointments for free and upgrade for unlimited AI consultations. Perfect for
            ongoing ayurvedic care.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="relative group hover-lift">
            <div className="relative bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Free</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-muted-foreground">Essential ayurvedic appointment booking</p>
                </div>
                <SignUpButton mode="modal">
                  <Button className="w-full py-3 bg-gradient-to-r from-muted to-muted/80 text-foreground rounded-xl font-semibold hover:scale-105 transition-transform duration-300">
                    Get Started Free
                  </Button>
                </SignUpButton>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Unlimited appointment booking</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Find practitoners in your area</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Basic text chat support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Appointment reminders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Plan - Featured */}
          <div className="relative group hover-lift">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-gentle-bounce">
                Most Popular
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-card/95 to-card/70 backdrop-blur-xl rounded-3xl p-8 border-2 border-primary/30 hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/30 scale-105 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">AI Basic</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      $10
                    </span>
                    <span className="text-muted-foreground mb-1">/month</span>
                  </div>
                  <p className="text-muted-foreground">AI consultations + appointment booking</p>
                </div>

                <Button className="ripple w-full py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300">
                  Start AI Basic
                </Button>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Everything in Free</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">10 AI voice calls per month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">AI ayurvedic guidance & advice</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Symptom assessment</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Call history & recordings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="relative group hover-lift">
            <div className="relative bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">AI Pro</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">$20</span>
                    <span className="text-muted-foreground mb-1">/month </span>
                  </div>
                  <p className="text-muted-foreground">Unlimited AI consultations</p>
                </div>

                <Button
                  variant="outline"
                  className="w-full py-3 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                >
                  Upgrade to AI Pro
                </Button>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Everything in AI Basic</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Unlimited AI voice calls</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Advanced AI ayurvedic analysis</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Personalized care plans</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">24/7 priority AI support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">Detailed health reports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
