import { TrendingUp, Users, DollarSign, Zap } from "lucide-react";

const StatsSection = () => {
  const stats = [
    {
      icon: DollarSign,
      label: "Total Value Locked",
      value: "$2.4B",
      change: "+12.5%",
      description: "Secured in Shinrai Protocol"
    },
    {
      icon: Users,
      label: "Active Users",
      value: "125K+",
      change: "+8.3%",
      description: "Monthly active participants"
    },
    {
      icon: TrendingUp,
      label: "APY Range",
      value: "5-45%",
      change: "Variable",
      description: "Competitive yields across pools"
    },
    {
      icon: Zap,
      label: "Transactions",
      value: "2M+",
      change: "+15.7%",
      description: "Processed on Kaia network"
    }
  ];

  return (
    <section className="py-20 bg-card/20 border-y border-border/50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Protocol Statistics
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time metrics showcasing the growth and adoption of Shinrai Protocol
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/70 transition-all duration-300 hover:scale-105 card-glow"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-primary font-medium">
                      {stat.change}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center mt-8 space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Updated in real-time</span>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;