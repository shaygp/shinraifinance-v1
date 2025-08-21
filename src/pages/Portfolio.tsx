import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Activity,
  Wallet,
  Clock,
  Target,
  RefreshCw,
  Loader2
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

const Portfolio = () => {
  const { 
    address, 
    chainId, 
    isConnected, 
    isKaiaNetwork, 
    provider, 
    signer 
  } = useWallet();
  
  const { 
    totalValue, 
    totalEarnings, 
    positions, 
    transactions, 
    balances,
    isLoading, 
    error,
    loadPortfolioData, 
    refreshPortfolio 
  } = usePortfolio({ address, chainId, isConnected, provider, signer });
  
  // Calculate dynamic portfolio stats
  const totalChange = positions.reduce((sum, position) => {
    const value = parseFloat(position.value.replace('$', '')) || 0;
    const apy = parseFloat(position.apy.replace('%', '')) || 0;
    return sum + (value * apy * 0.01 / 365); // Daily earnings estimate
  }, 0);
  
  const avgAPY = positions.length > 0 
    ? positions.reduce((sum, pos) => sum + (parseFloat(pos.apy.replace('%', '')) || 0), 0) / positions.length 
    : 0;
  
    const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await refreshPortfolio();
      toast({
        title: "Portfolio refreshed",
        description: "Portfolio data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh portfolio data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Portfolio Dashboard</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your DeFi Portfolio
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your positions, earnings, and activity across all Shinrai Protocol features.
            </p>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalValue}</p>
                  <p className="text-sm text-muted-foreground">Total Portfolio</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">+${totalChange.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgAPY.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Avg APY</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{positions.length}</p>
                  <p className="text-sm text-muted-foreground">Active Positions</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="positions" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Active Positions</h2>
                <Button variant="outline">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-500 text-center">{error}</p>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-6">
                  {positions.length === 0 && !error ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No positions found. Connect your wallet and start using the protocol.</p>
                    </div>
                  ) : (
                    positions.map((position, index) => (
                  <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-lg bg-primary/10">
                            {position.type === 'Staking' && <TrendingUp className="h-6 w-6 text-primary" />}
                            {position.type === 'Borrowing' && <DollarSign className="h-6 w-6 text-primary" />}
                            {position.type === 'Farming' && <Activity className="h-6 w-6 text-primary" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">{position.asset}</h3>
                            <Badge variant="outline" className="text-xs">
                              {position.type}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{position.amount}</p>
                        <p className="text-sm text-muted-foreground">Amount</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{position.value}</p>
                        <p className="text-sm text-muted-foreground">USD Value</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{position.apy}</p>
                        <p className="text-sm text-muted-foreground">APY</p>
                      </div>

                      <div className="flex justify-end">
                        <Button size="sm">Manage</Button>
                      </div>
                    </div>
                    </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Recent Transactions</h2>
                <Button variant="outline">
                  View All
                </Button>
              </div>

              <div className="grid gap-4">
                {transactions.map((tx, index) => (
                  <Card key={index} className="p-4 bg-card/50 backdrop-blur-sm border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.type} {tx.asset}</p>
                          <p className="text-sm text-muted-foreground">{tx.amount}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{tx.time}</span>
                        </div>
                        <Badge variant="outline" className="mt-1 text-green-500 border-green-500/20">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Portfolio Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <PieChart className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Asset Allocation</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Staking (stKAIA)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div className="w-6/20 h-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">28.8%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Farming (LP)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div className="w-14/20 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">57.6%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Borrowed (KUSD)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div className="w-3/20 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">13.6%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Performance</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earnings (30d)</span>
                      <span className="text-green-500 font-medium">+$456.78</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best Performing</span>
                      <span className="text-foreground font-medium">KAIA/KUSD Farm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Score</span>
                      <Badge variant="outline" className="text-green-500 border-green-500/20">Low</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diversification</span>
                      <span className="text-primary font-medium">Moderate</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;