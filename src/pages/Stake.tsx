import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowDown, Lock, TrendingUp, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useStaking } from "@/hooks/useStaking";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

const Stake = () => {
  const { 
    address, 
    chainId, 
    isConnected, 
    isKaiaNetwork, 
    provider, 
    signer 
  } = useWallet();
  
  const { 
    stakedAmount, 
    stKAIABalance, 
    totalStaked, 
    exchangeRate, 
    apy, 
    isLoading, 
    error,
    stakeKAIA, 
    unstakeKAIA, 
    claimRewards, 
    loadStakingData,
    getStakingStats 
  } = useStaking({ address, chainId, isConnected, provider, signer });
  
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);

  useEffect(() => {
    if (isConnected && isKaiaNetwork()) {
      loadStakingData();
    }
  }, [isConnected, isKaiaNetwork, loadStakingData]);

  const handleStake = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake KAIA tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!isKaiaNetwork()) {
      toast({
        title: "Wrong network",
        description: "Please switch to Kaia network to stake tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to stake.",
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);
    try {
      const result = await stakeKAIA(stakeAmount);
      toast({
        title: "Staking successful!",
        description: `Successfully staked ${stakeAmount} KAIA tokens.`,
      });
      setStakeAmount('');
      await loadStakingData();
    } catch (error) {
      toast({
        title: "Staking failed",
        description: error instanceof Error ? error.message : "Failed to stake tokens.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected || !isKaiaNetwork()) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet and switch to Kaia network.",
        variant: "destructive",
      });
      return;
    }

    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to unstake.",
        variant: "destructive",
      });
      return;
    }

    setIsUnstaking(true);
    try {
      const result = await unstakeKAIA(unstakeAmount);
      toast({
        title: "Unstaking successful!",
        description: `Successfully unstaked ${unstakeAmount} stKAIA tokens.`,
      });
      setUnstakeAmount('');
      await loadStakingData();
    } catch (error) {
      toast({
        title: "Unstaking failed",
        description: error instanceof Error ? error.message : "Failed to unstake tokens.",
        variant: "destructive",
      });
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !isKaiaNetwork()) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet and switch to Kaia network.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await claimRewards();
      toast({
        title: "Rewards claimed!",
        description: "Successfully claimed your staking rewards.",
      });
      await loadStakingData();
    } catch (error) {
      toast({
        title: "Claim failed",
        description: error instanceof Error ? error.message : "Failed to claim rewards.",
        variant: "destructive",
      });
    }
  };

  const stats = getStakingStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Liquid Staking</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Stake KAIA Tokens
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stake your KAIA tokens and earn rewards while maintaining liquidity with stKAIA tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Staking Interface */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Stake KAIA</h3>
                  <div className="text-sm text-primary font-medium">APY: {apy}%</div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available Balance</span>
                      <span className="text-foreground">{stakedAmount} KAIA</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pr-16"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        disabled={!isConnected || !isKaiaNetwork()}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                        onClick={() => setStakeAmount(stakedAmount)}
                        disabled={!isConnected || !isKaiaNetwork()}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive</span>
                      <span className="text-foreground">
                        {stakeAmount ? (parseFloat(stakeAmount) * parseFloat(exchangeRate)).toFixed(6) : '0.00'} stKAIA
                      </span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      disabled
                      className="bg-muted/50"
                      value={stakeAmount ? (parseFloat(stakeAmount) * parseFloat(exchangeRate)).toFixed(6) : ''}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleStake}
                    disabled={!isConnected || !isKaiaNetwork() || isStaking || !stakeAmount}
                  >
                    {isStaking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Staking...
                      </>
                    ) : !isConnected ? (
                      'Connect Wallet to Stake'
                    ) : !isKaiaNetwork() ? (
                      'Switch to Kaia Network'
                    ) : (
                      'Stake KAIA'
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Staking Stats */}
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4">Staking Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Staked</span>
                    <span className="text-foreground font-medium">{parseFloat(totalStaked).toLocaleString()} KAIA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="text-foreground font-medium">1 KAIA = {exchangeRate} stKAIA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Percentage Yield</span>
                    <span className="text-primary font-medium">{apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Stakers</span>
                    <span className="text-foreground font-medium">{stats.totalStakers}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">How it works</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Stake KAIA tokens to earn staking rewards</li>
                  <li>• Receive stKAIA tokens that represent your staked position</li>
                  <li>• stKAIA tokens are liquid and can be used in DeFi</li>
                  <li>• Rewards are automatically compounded</li>
                  <li>• Unstake anytime with no lock-up period</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stake;