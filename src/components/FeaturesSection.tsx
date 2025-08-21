import { Button } from "@/components/ui/button";
import { 
  Coins, 
  TrendingUp, 
  RefreshCw, 
  Sprout, 
  Shield, 
  ArrowRight,
  Lock,
  DollarSign 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Lock,
      title: "Liquid Staking",
      description: "Stake your KAIA tokens and receive liquid staking tokens while earning rewards. No lock-up periods, maintain liquidity.",
      apy: "8.5% APY",
      tvl: "$450M",
      color: "from-blue-500/20 to-cyan-500/20",
      buttonText: "Start Staking"
    },
    {
      icon: DollarSign,
      title: "Leveraged Borrowing",
      description: "Borrow stablecoins against your staked assets with competitive rates. Up to 90% LTV on supported collateral.",
      apy: "3.2% APR",
      tvl: "$280M",
      color: "from-green-500/20 to-emerald-500/20",
      buttonText: "Borrow Now"
    },
    {
      icon: RefreshCw,
      title: "Token Swaps",
      description: "Swap between tokens with minimal slippage using our optimized AMM. Best rates guaranteed across Kaia ecosystem.",
      apy: "0.3% Fee",
      tvl: "$120M",
      color: "from-purple-500/20 to-pink-500/20",
      buttonText: "Swap Tokens"
    },
    {
      icon: Sprout,
      title: "Yield Farming",
      description: "Provide liquidity to earn trading fees plus additional KAIA rewards. Multiple pools with varying risk levels.",
      apy: "Up to 45%",
      tvl: "$680M",
      color: "from-yellow-500/20 to-orange-500/20",
      buttonText: "Farm Yields"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">DeFi Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Complete DeFi Suite for 
            <span className="block text-primary">Kaia Blockchain</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access all the tools you need for decentralized finance in one secure, 
            user-friendly platform powered by Shinrai Protocol on Kaia blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 hover:bg-card/70 transition-all duration-500 hover:scale-[1.02] card-glow"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {feature.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-primary font-semibold">
                            {feature.apy}
                          </span>
                          <span className="text-muted-foreground">
                            TVL: {feature.tvl}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                    onClick={() => console.log(`${feature.buttonText} clicked`)}
                  >
                    {feature.buttonText}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors duration-500" />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Button variant="kaia" size="lg" onClick={() => console.log('Explore All Features clicked')}>
            Explore All Features
            <TrendingUp className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;