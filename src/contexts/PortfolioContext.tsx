"use client";

import type { InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PortfolioState {
  strategy: InvestmentStrategyOutput | null;
  setStrategy: (strategy: InvestmentStrategyOutput | null) => void;
  marketUpdate: SummarizeMarketChangesOutput | null;
  setMarketUpdate: (update: SummarizeMarketChangesOutput | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PortfolioContext = createContext<PortfolioState | undefined>(undefined);

const STRATEGY_STORAGE_KEY = 'goldenYearsPortfolioStrategy';
const MARKET_UPDATE_STORAGE_KEY = 'goldenYearsMarketUpdate';

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [strategy, setStrategyState] = useState<InvestmentStrategyOutput | null>(null);
  const [marketUpdate, setMarketUpdateState] = useState<SummarizeMarketChangesOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedStrategy = localStorage.getItem(STRATEGY_STORAGE_KEY);
      if (storedStrategy) {
        setStrategyState(JSON.parse(storedStrategy));
      }
      const storedMarketUpdate = localStorage.getItem(MARKET_UPDATE_STORAGE_KEY);
      if (storedMarketUpdate) {
        setMarketUpdateState(JSON.parse(storedMarketUpdate));
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    }
    setIsInitialized(true);
  }, []);
  
  const setStrategy = (newStrategy: InvestmentStrategyOutput | null) => {
    setStrategyState(newStrategy);
    if (isInitialized) {
      if (newStrategy) {
        localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(newStrategy));
      } else {
        localStorage.removeItem(STRATEGY_STORAGE_KEY);
      }
    }
  };

  const setMarketUpdate = (newUpdate: SummarizeMarketChangesOutput | null) => {
    setMarketUpdateState(newUpdate);
     if (isInitialized) {
      if (newUpdate) {
        localStorage.setItem(MARKET_UPDATE_STORAGE_KEY, JSON.stringify(newUpdate));
      } else {
        localStorage.removeItem(MARKET_UPDATE_STORAGE_KEY);
      }
    }
  };
  
  useEffect(() => {
    if (isInitialized && strategy) {
        localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(strategy));
    }
  }, [strategy, isInitialized]);

  useEffect(() => {
    if (isInitialized && marketUpdate) {
        localStorage.setItem(MARKET_UPDATE_STORAGE_KEY, JSON.stringify(marketUpdate));
    }
  }, [marketUpdate, isInitialized]);


  return (
    <PortfolioContext.Provider value={{ strategy, setStrategy, marketUpdate, setMarketUpdate, isLoading, setIsLoading }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioState => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
