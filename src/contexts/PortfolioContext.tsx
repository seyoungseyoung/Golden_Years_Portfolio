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

  // Load initial state from localStorage
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
      console.error("Failed to load from localStorage on init", error);
    }
    setIsInitialized(true); // Signal that initialization is complete
  }, []);
  
  // Update strategy and let useEffect handle persistence
  const setStrategy = (newStrategy: InvestmentStrategyOutput | null) => {
    setStrategyState(newStrategy);
  };

  // Update marketUpdate and let useEffect handle persistence
  const setMarketUpdate = (newUpdate: SummarizeMarketChangesOutput | null) => {
    setMarketUpdateState(newUpdate);
  };
  
  // Persist strategy to localStorage when it changes and context is initialized
  useEffect(() => {
    if (isInitialized) {
      try {
        if (strategy) {
            localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(strategy));
        } else {
            localStorage.removeItem(STRATEGY_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to save strategy to localStorage", error);
      }
    }
  }, [strategy, isInitialized]);

  // Persist marketUpdate to localStorage when it changes and context is initialized
  useEffect(() => {
    if (isInitialized) {
      try {
        if (marketUpdate) {
            localStorage.setItem(MARKET_UPDATE_STORAGE_KEY, JSON.stringify(marketUpdate));
        } else {
            localStorage.removeItem(MARKET_UPDATE_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to save marketUpdate to localStorage", error);
      }
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
