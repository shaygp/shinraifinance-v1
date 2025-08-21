import { Button } from "@/components/ui/button";
import { Wallet, Menu, X, ChevronDown, Coins } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TokenBalanceDisplay } from "./TokenBalanceDisplay";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const walletState = useWallet();
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    chainId, 
    isKaiaNetwork,
    switchToKaiaNetwork,
    switchToKairosNetwork 
  } = walletState;
  
  const { balances, isLoading: balancesLoading, getTotalValue } = useTokenBalances(walletState);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = () => {
    if (chainId === 8217) return 'Kaia';
    if (chainId === 1001) return 'Kairos';
    return 'Unknown';
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <header className="relative z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-kaia">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">Shinrai<span className="text-primary">Protocol</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/stake" className="text-foreground hover:text-primary transition-colors duration-300">Stake</Link>
            <Link to="/borrow" className="text-foreground hover:text-primary transition-colors duration-300">Borrow</Link>
            <Link to="/swap" className="text-foreground hover:text-primary transition-colors duration-300">Swap</Link>
            <Link to="/farms" className="text-foreground hover:text-primary transition-colors duration-300">Farms</Link>
            <Link to="/portfolio" className="text-foreground hover:text-primary transition-colors duration-300">Portfolio</Link>
          </nav>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {!isConnected ? (
              <Button 
                variant="connect" 
                size="sm" 
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Network Indicator */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isKaiaNetwork() 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {getNetworkName()}
                </div>
                
                {/* Portfolio Value */}
                <div className="text-sm text-muted-foreground">
                  ${getTotalValue()}
                </div>

                {/* Wallet Address */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Wallet className="h-3 w-3" />
                      <span>{formatAddress(address!)}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    {/* Token Balances */}
                    <div className="p-3 border-b">
                      <TokenBalanceDisplay 
                        balances={balances} 
                        isLoading={balancesLoading}
                        className="border-0 p-0 bg-transparent"
                      />
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(address!)}>
                      <Wallet className="h-4 w-4 mr-2" />
                      Copy Address
                    </DropdownMenuItem>
                    
                    {!isKaiaNetwork() && (
                      <>
                        <DropdownMenuItem onClick={switchToKaiaNetwork}>
                          Switch to Kaia Mainnet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={switchToKairosNetwork}>
                          Switch to Kairos Testnet
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
                      Disconnect Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border/50">
            <nav className="flex flex-col space-y-4 p-4">
              <Link to="/stake" className="text-foreground hover:text-primary transition-colors duration-300 text-left">Stake</Link>
              <Link to="/borrow" className="text-foreground hover:text-primary transition-colors duration-300 text-left">Borrow</Link>
              <Link to="/swap" className="text-foreground hover:text-primary transition-colors duration-300 text-left">Swap</Link>
              <Link to="/farms" className="text-foreground hover:text-primary transition-colors duration-300 text-left">Farms</Link>
              <Link to="/portfolio" className="text-foreground hover:text-primary transition-colors duration-300 text-left">Portfolio</Link>
              
              {!isConnected ? (
                <Button 
                  variant="connect" 
                  size="sm" 
                  className="mt-4" 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                    isKaiaNetwork() 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {getNetworkName()}
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {formatAddress(address!)}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={disconnectWallet}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;