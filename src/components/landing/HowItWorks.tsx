import { SignUpButton } from "@clerk/nextjs";
import { ArrowRightIcon, ZapIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

function HowItWorks() {
  return (
    <section className="relative py-32 px-6 overflow-visible z-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-full border border-primary/10 backdrop-blur-sm mb-6 hover:border-primary/30 transition-colors duration-300">
          <ZapIcon className="size-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Simple Process</span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Three steps to
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
            better ayurvedic health
          </span>
        </h2>

        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Our streamlined process makes ayurvedic care more accessible, convenient, and stress-free for
          everyone
        </p>
      </div>

      {/* STEPS */}
      <div className="relative">
        {/* CONNECTION LINE */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transform -translate-y-1/2 hidden lg:block"></div>

        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
          {/* STEP 1 */}
          <div className="relative group hover-lift">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {/* Step Number */}
              <div className="absolute top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>

              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-6">
                <Image src="/audio.png" alt="Voice Chat" width={40} height={40} className="w-14 object-contain drop-shadow-lg" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-primary transition-colors duration-300">Ask Questions</h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Chat with our AI assistant about any ayurvedic concerns. Get instant answers about
                symptoms, treatments and health tips.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  24/7 Available
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  Instant Response
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative group hover-lift">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-100"></div>

              {/* Step Number */}
              <div className="absolute top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>

              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 mb-6">
                <Image src="/brain.png" alt="AI Brain" width={40} height={40} className="w-14 object-contain drop-shadow-lg" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-primary transition-colors duration-300">Get Expert Advice</h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Receive personalized recommendations based on thousands of ayurvedic cases. Our AI
                provides professional-grade insights.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  AI-Powered
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  Personalized
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3  */}
          <div className="relative group hover-lift">
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden">
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-200"></div>

              {/* Step Number */}
              <div className="absolute top-4 left-8 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>

              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-6">
                <Image src="/calendar.png" alt="Calendar" width={40} height={40} className="w-14 object-contain drop-shadow-lg" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-primary transition-colors duration-300">Book & Get Care</h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Schedule with verified ayurvedic practioners and receive comprehensive follow-up care. Track your
                progress seamlessly.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  Verified Specialists
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors duration-200">
                  Follow-up Care
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="text-center mt-16">
        <SignUpButton mode="modal">
          <Button size="lg" className="ripple group hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20">
            <ArrowRightIcon className="mr-2 size-5 group-hover:translate-x-1 transition-transform duration-300" />
            Get started now
          </Button>
        </SignUpButton>
      </div>
    </section>
  );
}

export default HowItWorks;
