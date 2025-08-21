import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Coins } from "lucide-react";

interface TokenBalance {
  symbol: string;
  balance: string;
  value?: string;
}

interface TokenBalanceDisplayProps {
  balances: TokenBalance[];
  isLoading?: boolean;
  className?: string;
}

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({
  balances,
  isLoading,
  className = ""
}) => {
  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Token Balances</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
              <div className="w-24 h-4 bg-muted animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Your Token Balances</span>
      </div>
      
      <div className="space-y-2">
        {balances.map(({ symbol, balance, value }) => (
          <div key={symbol} className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Coins className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{symbol}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {parseFloat(balance).toFixed(4)}
              </div>
              {value && (
                <div className="text-xs text-muted-foreground">
                  ${parseFloat(value).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {balances.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No token balances found
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <Badge variant="outline" className="text-xs">
          Kairos Testnet
        </Badge>
      </div>
    </Card>
  );
};

export default TokenBalanceDisplay;