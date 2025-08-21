import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Shield, AlertTriangle, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useBorrow } from "@/hooks/useBorrow";
import { useWallet } from "@/hooks/useWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Borrow = () => {
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
    collateralToken, 
    borrowToken, 
    collateralAmount, 
    borrowAmount, 
    ltv, 
    liquidationLTV, 
    borrowAPR, 
    healthFactor, 
    isLoading, 
    error,
    totalBorrowed, 
    availableLiquidity, 
    utilizationRate,
    updateCollateralAmount, 
    updateBorrowAmount, 
    borrowTokens, 
    getCollateralBalance 
  } = useBorrow(walletState);
  
  const { balances, getBalance } = useTokenBalances(walletState);
  const { toast } = useToast();
  const [isBorrowing, setIsBorrowing] = useState(false);

  // Get collateral balance from token balances hook
  const collateralBalance = getBalance(collateralToken === 'stKAIA' ? 'KAIA' : collateralToken);

  const handleBorrow = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!isKaiaNetwork() || chainId !== 1001) {
      toast({
        title: "Wrong network",
        description: "Please switch to Kairos testnet to borrow tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      toast({
        title: "Invalid collateral amount",
        description: "Please enter a valid collateral amount.",
        variant: "destructive",
      });
      return;
    }

    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      toast({
        title: "Invalid borrow amount",
        description: "Please enter a valid borrow amount.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough collateral balance
    const userCollateralBalance = parseFloat(collateralBalance);
    const requiredCollateral = parseFloat(collateralAmount);
    
    if (userCollateralBalance < requiredCollateral) {
      toast({
        title: "Insufficient collateral",
        description: `You need ${requiredCollateral.toFixed(4)} ${collateralToken} but only have ${userCollateralBalance.toFixed(4)}.`,
        variant: "destructive",
      });
      return;
    }

    // Check LTV ratio
    if (ltv >= liquidationLTV) {
      toast({
        title: "Loan-to-value too high",
        description: `Your LTV ratio (${ltv.toFixed(1)}%) exceeds the maximum allowed (${liquidationLTV}%).`,
        variant: "destructive",
      });
      return;
    }

    // Warning for high LTV
    if (ltv >= liquidationLTV * 0.9) {
      const confirmed = confirm(`Warning: Your LTV ratio (${ltv.toFixed(1)}%) is close to liquidation threshold (${liquidationLTV}%). Continue?`);
      if (!confirmed) return;
    }

    setIsBorrowing(true);
    try {
      const result = await borrowTokens();
      toast({
        title: "Borrow successful!",
        description: `Successfully borrowed ${borrowAmount} ${borrowToken} using ${collateralAmount} ${collateralToken} as collateral.`,
      });
    } catch (error) {
      console.error('Borrow error:', error);
      toast({
        title: "Borrow failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Leveraged Borrowing</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Borrow Against Your Assets
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Borrow stablecoins against your staked assets with competitive rates and up to 90% LTV.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Borrowing Interface */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Borrow</h3>
                  <div className="text-sm text-primary font-medium">APR: 3.2%</div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Collateral</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select collateral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stkaia">stKAIA</SelectItem>
                        <SelectItem value="kaia">KAIA</SelectItem>
                        <SelectItem value="kusd">KUSD</SelectItem>
                        <SelectItem value="wkaia">WKAIA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Collateral Amount</span>
                      <span className="text-foreground">Available: 0.00</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pr-16"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Borrow Asset</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset to borrow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                        <SelectItem value="dai">DAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Borrow Amount</span>
                      <span className="text-foreground">Max: $0.00</span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    Connect Wallet to Borrow
                  </Button>
                </div>
              </div>
            </Card>

            {/* Borrowing Stats & Info */}
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4">Loan Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan-to-Value (LTV)</span>
                    <span className="text-foreground font-medium">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidation LTV</span>
                    <span className="text-destructive font-medium">90%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Borrow APR</span>
                    <span className="text-primary font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health Factor</span>
                    <span className="text-green-500 font-medium">∞</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4">Market Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Borrowed</span>
                    <span className="text-foreground font-medium">$280M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Liquidity</span>
                    <span className="text-foreground font-medium">$120M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilization Rate</span>
                    <span className="text-foreground font-medium">70%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-destructive/10 border border-destructive/20">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="text-lg font-bold text-destructive">Risk Warning</h3>
                </div>
                <ul className="space-y-2 text-sm text-destructive/80">
                  <li>• Borrowed assets accrue interest over time</li>
                  <li>• Collateral may be liquidated if LTV exceeds 90%</li>
                  <li>• Monitor your health factor regularly</li>
                  <li>• Consider market volatility risks</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Borrow;