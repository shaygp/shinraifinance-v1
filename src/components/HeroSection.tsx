import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-defi.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="w-16 h-16 rounded-full gradient-kaia opacity-20 blur-sm" />
      </div>
      <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-12 h-12 rounded-full gradient-kaia opacity-30 blur-sm" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full gradient-kaia animate-pulse" />
            <span className="text-sm text-primary font-medium">Shinrai Protocol on Kaia</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block text-foreground">The Future of</span>
            <span className="block gradient-kaia bg-clip-text text-transparent animate-glow">
              Decentralized Finance
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Unlock the power of Kaia blockchain with liquid staking, leveraged borrowing, 
            and high-yield farming - all in one seamless platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => console.log('Start Earning clicked')}>
              Start Earning
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => console.log('Explore Protocol clicked')}>
              Explore Protocol
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-foreground font-medium">High Yields</span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-foreground font-medium">Secure & Audited</span>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-foreground font-medium">Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full">
          <div className="w-1 h-2 bg-primary rounded-full mx-auto mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;