// stores/useTradeStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Trade {
  id: string;
  ticker: string;
  company: string;
  action: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  date: string;
  fee: number;
  currency: string;
  profit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  ticker: string;
  company: string;
  totalShares: number;
  averagePrice: number;
  currentPrice?: number;
  totalCost: number;
  unrealizedPnL?: number;
  currency: string;
}

interface TradeState {
  trades: Trade[];
  positions: Position[];
  isLoading: boolean;
  error: string | null;
}

interface TradeActions {
  // Trade actions
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  
  // Position calculations
  calculatePositions: () => void;
  updateCurrentPrices: (prices: Record<string, number>) => void;
  
  // FIFO calculation for P&L
  calculatePnL: (sellTrade: Trade) => number;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data management
  clearAllData: () => void;
}

type TradeStore = TradeState & TradeActions;

export const useTradeStore = create<TradeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trades: [],
        positions: [],
        isLoading: false,
        error: null,

        // Actions
        addTrade: (tradeData) => {
          const newTrade: Trade = {
            ...tradeData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            trades: [...state.trades, newTrade],
            error: null,
          }));

          // Recalculate positions after adding trade
          get().calculatePositions();
        },

        updateTrade: (id, updates) => {
          set((state) => ({
            trades: state.trades.map((trade) =>
              trade.id === id
                ? { ...trade, ...updates, updatedAt: new Date() }
                : trade
            ),
            error: null,
          }));

          get().calculatePositions();
        },

        deleteTrade: (id) => {
          set((state) => ({
            trades: state.trades.filter((trade) => trade.id !== id),
            error: null,
          }));

          get().calculatePositions();
        },

        calculatePositions: () => {
          const { trades } = get();
          const positionMap = new Map<string, Position>();

          // Sort trades by date to process in chronological order
          const sortedTrades = [...trades].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          sortedTrades.forEach((trade) => {
            const existing = positionMap.get(trade.ticker);

            if (!existing) {
              // First trade for this ticker
              if (trade.action === 'BUY') {
                positionMap.set(trade.ticker, {
                  ticker: trade.ticker,
                  company: trade.company,
                  totalShares: trade.shares,
                  averagePrice: trade.pricePerShare,
                  totalCost: trade.shares * trade.pricePerShare + trade.fee,
                  currency: trade.currency,
                });
              }
            } else {
              // Update existing position
              if (trade.action === 'BUY') {
                const newTotalCost = existing.totalCost + (trade.shares * trade.pricePerShare) + trade.fee;
                const newTotalShares = existing.totalShares + trade.shares;
                
                positionMap.set(trade.ticker, {
                  ...existing,
                  totalShares: newTotalShares,
                  averagePrice: newTotalCost / newTotalShares,
                  totalCost: newTotalCost,
                });
              } else if (trade.action === 'SELL') {
                const newTotalShares = existing.totalShares - trade.shares;
                const soldCost = (trade.shares / existing.totalShares) * existing.totalCost;
                
                if (newTotalShares > 0) {
                  positionMap.set(trade.ticker, {
                    ...existing,
                    totalShares: newTotalShares,
                    totalCost: existing.totalCost - soldCost,
                  });
                } else {
                  // Position fully closed
                  positionMap.delete(trade.ticker);
                }
              }
            }
          });

          set({ positions: Array.from(positionMap.values()) });
        },

        calculatePnL: (sellTrade) => {
          const { trades } = get();
          
          // Get all BUY trades for this ticker before the sell date
          const buyTrades = trades
            .filter(
              (t) =>
                t.ticker === sellTrade.ticker &&
                t.action === 'BUY' &&
                new Date(t.date) <= new Date(sellTrade.date)
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Get all previous SELL trades for this ticker
          const previousSells = trades
            .filter(
              (t) =>
                t.ticker === sellTrade.ticker &&
                t.action === 'SELL' &&
                new Date(t.date) < new Date(sellTrade.date)
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Calculate available shares using FIFO
          let availableShares = 0;
          let totalCostBasis = 0;
          let sharesSoldPreviously = 0;

          // Calculate shares sold previously
          previousSells.forEach(sell => sharesSoldPreviously += sell.shares);

          // Apply FIFO to determine cost basis for current sell
          let sharesToSell = sellTrade.shares;
          let sharesProcessed = 0;

          for (const buyTrade of buyTrades) {
            const sharesFromThisBuy = buyTrade.shares;
            const remainingFromBuy = sharesFromThisBuy - Math.max(0, sharesSoldPreviously - sharesProcessed);
            
            if (remainingFromBuy > 0 && sharesToSell > 0) {
              const sharesToUseFromThisBuy = Math.min(remainingFromBuy, sharesToSell);
              totalCostBasis += sharesToUseFromThisBuy * buyTrade.pricePerShare;
              sharesToSell -= sharesToUseFromThisBuy;
              availableShares += sharesToUseFromThisBuy;
            }
            
            sharesProcessed += sharesFromThisBuy;
          }

          if (availableShares < sellTrade.shares) {
            throw new Error(`Insufficient shares to sell. Available: ${availableShares}, Requested: ${sellTrade.shares}`);
          }

          // Calculate P&L
          const saleRevenue = sellTrade.shares * sellTrade.pricePerShare;
          const totalFees = sellTrade.fee;
          const grossProfit = saleRevenue - totalCostBasis;
          const netProfit = grossProfit - totalFees;

          return netProfit;
        },

        updateCurrentPrices: (prices) => {
          set((state) => ({
            positions: state.positions.map((position) => {
              const currentPrice = prices[position.ticker];
              if (currentPrice) {
                const currentValue = position.totalShares * currentPrice;
                const unrealizedPnL = currentValue - position.totalCost;
                return {
                  ...position,
                  currentPrice,
                  unrealizedPnL,
                };
              }
              return position;
            }),
          }));
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        clearAllData: () => {
          set({
            trades: [],
            positions: [],
            isLoading: false,
            error: null,
          });
        },
      }),
      {
        name: 'swing-trading-storage',
        version: 1,
      }
    ),
    { name: 'TradeStore' }
  )
);

// stores/useSettingsStore.ts
interface UserSettings {
  defaultCurrency: string;
  displayCurrency: string;
  taxRate: number;
  dateFormat: string;
  theme: 'dark' | 'light';
  notifications: {
    trades: boolean;
    priceAlerts: boolean;
    monthlyReports: boolean;
  };
}

interface SettingsState {
  settings: UserSettings;
}

interface SettingsActions {
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateNotificationSettings: (notifications: Partial<UserSettings['notifications']>) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSettings: UserSettings = {
  defaultCurrency: 'USD',
  displayCurrency: 'USD',
  taxRate: 25, // 25% capital gains tax
  dateFormat: 'MM/dd/yyyy',
  theme: 'dark',
  notifications: {
    trades: true,
    priceAlerts: false,
    monthlyReports: true,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        settings: defaultSettings,

        updateSettings: (updates) => {
          set((state) => ({
            settings: { ...state.settings, ...updates },
          }));
        },

        updateNotificationSettings: (notifications) => {
          set((state) => ({
            settings: {
              ...state.settings,
              notifications: { ...state.settings.notifications, ...notifications },
            },
          }));
        },

        resetSettings: () => {
          set({ settings: defaultSettings });
        },
      }),
      {
        name: 'settings-storage',
        version: 1,
      }
    ),
    { name: 'SettingsStore' }
  )
);