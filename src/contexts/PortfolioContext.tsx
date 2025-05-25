// src/contexts/PortfolioContext.tsx
"use client";

import type { InvestmentStrategyOutput } from '@/ai/flows/generate-investment-strategy';
import type { SummarizeMarketChangesOutput } from '@/ai/flows/summarize-market-changes';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PortfolioState {
  strategy: InvestmentStrategyOutput | null;
  setStrategy: (strategy: InvestmentStrategyOutput | null) => void;
  marketUpdate: SummarizeMarketChangesOutput | null;
  setMarketUpdate: (update: SummarizeMarketChangesOutput | null) => void;
  isInitialized: boolean; // New state to indicate if context has loaded initial data
}

const PortfolioContext = createContext<PortfolioState | undefined>(undefined);

const STRATEGY_STORAGE_KEY = 'goldenYearsPortfolioStrategy';
const MARKET_UPDATE_STORAGE_KEY = 'goldenYearsMarketUpdate';

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [strategy, setStrategyState] = useState<InvestmentStrategyOutput | null>(null);
  const [marketUpdate, setMarketUpdateState] = useState<SummarizeMarketChangesOutput | null>(null);
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
    setIsInitialized(true); // Signal that initialization is complete
  }, []);
  
  const setStrategy = (newStrategy: InvestmentStrategyOutput | null) => {
    setStrategyState(newStrategy);
    if (isInitialized) { // Only save to localStorage if context is initialized
      if (newStrategy) {
        localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(newStrategy));
      } else {
        localStorage.removeItem(STRATEGY_STORAGE_KEY);
      }
    }
  };

  const setMarketUpdate = (newUpdate: SummarizeMarketChangesOutput | null) => {
    setMarketUpdateState(newUpdate);
    if (isInitialized) { // Only save to localStorage if context is initialized
      if (newUpdate) {
        localStorage.setItem(MARKET_UPDATE_STORAGE_KEY, JSON.stringify(newUpdate));
      } else {
        localStorage.removeItem(MARKET_UPDATE_STORAGE_KEY);
      }
    }
  };
  
  // These useEffects ensure that if strategy/marketUpdate are populated during the initial load,
  // they are saved once isInitialized becomes true.
  useEffect(() => {
    if (isInitialized && strategy) {
        localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(strategy));
    } else if (isInitialized && strategy === null) {
        localStorage.removeItem(STRATEGY_STORAGE_KEY);
    }
  }, [strategy, isInitialized]);

  useEffect(() => {
    if (isInitialized && marketUpdate) {
        localStorage.setItem(MARKET_UPDATE_STORAGE_KEY, JSON.stringify(marketUpdate));
    } else if (isInitialized && marketUpdate === null) {
        localStorage.removeItem(MARKET_UPDATE_STORAGE_KEY);
    }
  }, [marketUpdate, isInitialized]);


  return (
    <PortfolioContext.Provider value={{ strategy, setStrategy, marketUpdate, setMarketUpdate, isInitialized }}>
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
