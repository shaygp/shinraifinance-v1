import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, TrendingUp, Users, DollarSign, Plus, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useFarms } from "@/hooks/useFarms";
import { useWallet } from "@/hooks/useWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useToast } from "@/hooks/use-toast";

const Farms = () => {
  const walletState = useWallet();
  const { 
    address, 
    chainId, 
    isConnected, 
    isKaiaNetwork, 
    provider, 
    signer 
  } = walletState;
  
  const { 
    farms, 
    userFarms, 
    stats,
    isLoading, 
    error,
    loadFarms, 
    stakeInFarm, 
    unstakeFromFarm, 
    harvestRewards 
  } = useFarms(walletState);
  
  const { balances, getBalance } = useTokenBalances(walletState);
  const { toast } = useToast();
  const [stakeAmounts, setStakeAmounts] = useState<{ [key: string]: string }>({});
  const [unstakeAmounts, setUnstakeAmounts] = useState<{ [key: string]: string }>({});
  const [isStaking, setIsStaking] = useState<{ [key: string]: boolean }>({});
  const [isUnstaking, setIsUnstaking] = useState<{ [key: string]: boolean }>({});
  const [isHarvesting, setIsHarvesting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isConnected && isKaiaNetwork()) {
      loadFarms();
    }
  }, [isConnected, isKaiaNetwork, loadFarms]);

  const handleStake = async (farmId: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake in farms.",
        variant: "destructive",
      });
      return;
    }

    if (!isKaiaNetwork() || chainId !== 1001) {
      toast({
        title: "Wrong network",
        description: "Please switch to Kairos testnet to stake in farms.",
        variant: "destructive",
      });
      return;
    }

    const amount = stakeAmounts[farmId];
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to stake.",
        variant: "destructive",
      });
      return;
    }

    // Check user balance (using KAIA balance for LP tokens on testnet)
    const userBalance = parseFloat(getBalance('KAIA'));
    const stakeAmount = parseFloat(amount);
    
    if (userBalance < stakeAmount) {
      toast({
        title: "Insufficient balance",
        description: `You need ${stakeAmount.toFixed(4)} KAIA but only have ${userBalance.toFixed(4)} KAIA.`,
        variant: "destructive",
      });
      return;
    }

    // Reserve some gas for the transaction
    const reserveForGas = 0.01; // Reserve 0.01 KAIA for gas
    if (userBalance - stakeAmount < reserveForGas) {
      toast({
        title: "Reserve gas for transaction",
        description: `Please leave at least ${reserveForGas} KAIA for gas fees.`,
        variant: "destructive",
      });
      return;
    }

    setIsStaking(prev => ({ ...prev, [farmId]: true }));
    try {
      await stakeInFarm(farmId, amount);
      toast({
        title: "Staking successful!",
        description: `Successfully staked ${amount} KAIA in farm.`,
      });
      setStakeAmounts(prev => ({ ...prev, [farmId]: '' }));
    } catch (error) {
      console.error('Staking error:', error);
      toast({
        title: "Staking failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(prev => ({ ...prev, [farmId]: false }));
    }
  };

  const handleUnstake = async (farmId: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to unstake from farms.",
        variant: "destructive",
      });
      return;
    }

    if (!isKaiaNetwork() || chainId !== 1001) {
      toast({
        title: "Wrong network",
        description: "Please switch to Kairos testnet to unstake from farms.",
        variant: "destructive",
      });
      return;
    }

    const amount = unstakeAmounts[farmId];
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to unstake.",
        variant: "destructive",
      });
      return;
    }

    // Check user's staked amount
    const farm = farms.find(f => f.id === farmId);
    const stakedAmount = parseFloat(farm?.staked || '0');
    const unstakeAmount = parseFloat(amount);
    
    if (stakedAmount < unstakeAmount) {
      toast({
        title: "Insufficient staked amount",
        description: `You can unstake up to ${stakedAmount.toFixed(4)} tokens but tried to unstake ${unstakeAmount.toFixed(4)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(prev => ({ ...prev, [farmId]: true }));
    try {
      await unstakeFromFarm(farmId, amount);
      toast({
        title: "Unstaking successful!",
        description: `Successfully unstaked ${amount} from farm.`,
      });
      setUnstakeAmounts(prev => ({ ...prev, [farmId]: '' }));
    } catch (error) {
      console.error('Unstaking error:', error);
      toast({
        title: "Unstaking failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(prev => ({ ...prev, [farmId]: false }));
    }
  };

  const handleHarvest = async (farmId: string) => {
    setIsHarvesting(prev => ({ ...prev, [farmId]: true }));
    try {
      await harvestRewards(farmId);
      toast({
        title: "Harvest successful!",
        description: "Successfully harvested rewards from farm.",
      });
    } catch (error) {
      toast({
        title: "Harvest failed",
        description: error instanceof Error ? error.message : "Failed to harvest rewards.",
        variant: "destructive",
      });
    } finally {
      setIsHarvesting(prev => ({ ...prev, [farmId]: false }));
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Sprout className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Yield Farming</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Liquidity Farms
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Provide liquidity to earn trading fees plus additional KAIA rewards across multiple risk levels.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalTVL}</p>
                  <p className="text-sm text-muted-foreground">Total TVL</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.maxAPY}</p>
                  <p className="text-sm text-muted-foreground">Max APY</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeFarmers}</p>
                  <p className="text-sm text-muted-foreground">Active Farmers</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sprout className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeFarms}</p>
                  <p className="text-sm text-muted-foreground">Active Farms</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Farms List */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Available Farms</h2>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Farm
              </Button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-500 text-center">{error}</p>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={loadFarms}
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
                {farms.length === 0 && !error ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No farms available. Connect your wallet to view farms.</p>
                  </div>
                ) : (
                  farms.map((farm, index) => (
                <Card key={index} className="p-6 bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/70 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                    {/* Farm Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-bold">{farm.pair.split('/')[0].charAt(0)}</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-secondary/20 border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-bold">{farm.pair.split('/')[1].charAt(0)}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{farm.pair}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={getRiskColor(farm.risk)}>
                              {farm.risk} Risk
                            </Badge>
                            <Badge variant="outline" className="border-primary/20 text-primary">
                              {farm.multiplier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* APY */}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{farm.apy}</p>
                      <p className="text-sm text-muted-foreground">APY</p>
                    </div>

                    {/* TVL */}
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{farm.tvl}</p>
                      <p className="text-sm text-muted-foreground">TVL</p>
                    </div>

                    {/* User Stats */}
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{farm.earned}</p>
                      <p className="text-sm text-muted-foreground">KAIA Earned</p>
                      <p className="text-sm text-muted-foreground mt-1">Staked: {farm.staked}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        Stake
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Harvest
                      </Button>
                    </div>
                  </div>
                  </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          <Card className="mt-12 p-6 bg-card/50 backdrop-blur-sm border border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-4">How Yield Farming Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">1. Provide Liquidity</h4>
                <p>Add equal values of two tokens to a liquidity pool to receive LP tokens.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">2. Stake LP Tokens</h4>
                <p>Stake your LP tokens in farms to start earning KAIA rewards and trading fees.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">3. Earn Rewards</h4>
                <p>Harvest your accumulated rewards regularly or compound them for higher yields.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Farms;