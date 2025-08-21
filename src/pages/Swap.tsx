import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, ArrowDown, Settings, Info, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSwap } from "@/hooks/useSwap";
import { useWallet } from "@/hooks/useWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Swap = () => {
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
    fromToken, 
    toToken, 
    fromAmount, 
    toAmount, 
    slippage, 
    isLoading, 
    error,
    priceImpact, 
    exchangeRate, 
    gasEstimate,
    updateFromAmount, 
    updateToAmount, 
    switchTokens, 
    executeSwap,
    getTokenBalance 
  } = useSwap(walletState);
  
  const { balances, getBalance } = useTokenBalances(walletState);
  const { toast } = useToast();
  const [isSwapping, setIsSwapping] = useState(false);

  // Get current balances for selected tokens
  const fromBalance = getBalance(fromToken);
  const toBalance = getBalance(toToken);

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to swap tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!isKaiaNetwork()) {
      toast({
        title: "Wrong network",
        description: "Please switch to Kairos testnet to perform swaps.",
        variant: "destructive",
      });
      return;
    }

    if (chainId !== 1001) {
      toast({
        title: "Network not supported",
        description: "Swaps are only available on Kairos testnet (Chain ID: 1001).",
        variant: "destructive",
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough balance
    const userFromBalance = parseFloat(fromBalance);
    const swapAmount = parseFloat(fromAmount);
    
    if (userFromBalance < swapAmount) {
      toast({
        title: "Insufficient balance",
        description: `You need ${swapAmount.toFixed(4)} ${fromToken} but only have ${userFromBalance.toFixed(4)} ${fromToken}.`,
        variant: "destructive",
      });
      return;
    }

    // Check if there's a valid quote
    if (!toAmount || parseFloat(toAmount) <= 0) {
      toast({
        title: "Invalid swap",
        description: "Cannot calculate swap output. Please try a different amount.",
        variant: "destructive",
      });
      return;
    }

    // Show warning for large price impact
    const priceImpactNum = parseFloat(priceImpact);
    if (priceImpactNum > 5) {
      const confirmed = confirm(`High price impact (${priceImpact}%). Do you want to continue?`);
      if (!confirmed) return;
    }

    setIsSwapping(true);
    try {
      const result = await executeSwap();
      toast({
        title: "Swap successful!",
        description: `Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`,
      });
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 lg:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <RefreshCw className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Token Swaps</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Swap Tokens
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Swap between tokens with minimal slippage using our optimized AMM with the best rates on Kaia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Swap Interface */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">Swap</h3>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Network Warning */}
                  {!isKaiaNetwork() && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please switch to Kairos testnet to use the swap feature.
                      </span>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* From Token */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">From</span>
                        <span className="text-foreground">
                          Balance: <Badge variant="outline">{parseFloat(fromBalance).toFixed(4)} {fromToken}</Badge>
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Select value={fromToken.toLowerCase()} onValueChange={(value) => {
                          // Handle token selection change - you'd implement this
                        }}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kaia">KAIA</SelectItem>
                            <SelectItem value="kusd">KUSD</SelectItem>
                            <SelectItem value="wkaia">WKAIA</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex-1 relative">
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            className="pr-16"
                            value={fromAmount}
                            onChange={(e) => updateFromAmount(e.target.value)}
                            disabled={!isConnected || !isKaiaNetwork()}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                            onClick={() => updateFromAmount(fromBalance)}
                            disabled={!isConnected || !isKaiaNetwork()}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Swap Direction */}
                    <div className="flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full border border-border/50"
                        onClick={switchTokens}
                        disabled={!isConnected || !isKaiaNetwork()}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">To</span>
                        <span className="text-foreground">
                          Balance: <Badge variant="outline">{parseFloat(toBalance).toFixed(4)} {toToken}</Badge>
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Select value={toToken.toLowerCase()} onValueChange={(value) => {
                          // Handle token selection change - you'd implement this
                        }}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kaia">KAIA</SelectItem>
                            <SelectItem value="kusd">KUSD</SelectItem>
                            <SelectItem value="wkaia">WKAIA</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          disabled
                          className="flex-1 bg-muted/50"
                          value={toAmount}
                        />
                      </div>
                    </div>

                    {/* Swap Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exchange Rate</span>
                        <span className="text-foreground">1 {fromToken} = {exchangeRate} {toToken}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Impact</span>
                        <span className={parseFloat(priceImpact) > 1 ? "text-red-500" : "text-green-500"}>
                          {priceImpact}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network Fee</span>
                        <span className="text-foreground">{gasEstimate} KAIA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minimum Received</span>
                        <span className="text-foreground">
                          {toAmount ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6) : '0.00'} {toToken}
                        </span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleSwap}
                      disabled={
                        !isConnected || 
                        !isKaiaNetwork() || 
                        chainId !== 1001 ||
                        isSwapping || 
                        !fromAmount || 
                        !toAmount ||
                        parseFloat(fromBalance) < parseFloat(fromAmount || '0') ||
                        error !== null
                      }
                    >
                      {isSwapping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Swapping...
                        </>
                      ) : !isConnected ? (
                        'Connect Wallet to Swap'
                      ) : !isKaiaNetwork() || chainId !== 1001 ? (
                        'Switch to Kairos Testnet'
                      ) : !fromAmount ? (
                        'Enter Amount'
                      ) : parseFloat(fromBalance) < parseFloat(fromAmount || '0') ? (
                        `Insufficient ${fromToken} Balance`
                      ) : !toAmount ? (
                        'Getting Quote...'
                      ) : error ? (
                        'Error - Check Details'
                      ) : (
                        `Swap ${fromToken} for ${toToken}`
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Market Info */}
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4">Market Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Liquidity</span>
                    <span className="text-foreground font-medium">$120M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="text-foreground font-medium">$5.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trading Fee</span>
                    <span className="text-primary font-medium">0.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Pairs</span>
                    <span className="text-foreground font-medium">45</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Swap Features</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Best price discovery across DEXs</li>
                  <li>• Minimal slippage with deep liquidity</li>
                  <li>• MEV protection included</li>
                  <li>• Gas optimization built-in</li>
                  <li>• Support for limit orders</li>
                </ul>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4">Popular Pairs</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <span className="text-foreground font-medium">KAIA/KUSD</span>
                    <span className="text-primary text-sm">$0.85</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <span className="text-foreground font-medium">KAIA/WKAIA</span>
                    <span className="text-primary text-sm">1.02</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <span className="text-foreground font-medium">KUSD/WKAIA</span>
                    <span className="text-primary text-sm">$0.98</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Swap;