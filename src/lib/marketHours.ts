// Replace /src/lib/marketHours.ts with this SIMPLER version
export interface MarketStatus {
    isOpen: boolean;
    nextOpen: Date | null;
    nextClose: Date | null;
    timeUntilNext: string;
    status: 'open' | 'closed' | 'pre-market' | 'after-market';
    market: 'US' | 'ISRAEL';
  }
  
  export class MarketHoursService {
    static getCurrentMarketStatus(marketType: 'US' | 'ISRAEL' = 'US'): MarketStatus {
      const now = new Date();
      
      if (marketType === 'US') {
        return this.getUSMarketStatus(now);
      } else {
        return this.getIsraeliMarketStatus(now);
      }
    }
  
    private static getUSMarketStatus(now: Date): MarketStatus {
      // Convert to Eastern Time
      const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = easternTime.getHours();
      const minute = easternTime.getMinutes();
      
      console.log(`🕐 US Eastern Time: ${easternTime.toLocaleString()}`);
      console.log(`🕐 Day: ${day}, Hour: ${hour}, Minute: ${minute}`);
      
      const isWeekday = day >= 1 && day <= 5; // Monday-Friday
      const currentMinutes = hour * 60 + minute;
      const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM = 570 minutes
      const marketCloseMinutes = 16 * 60; // 4:00 PM = 960 minutes
      
      console.log(`🕐 Current minutes: ${currentMinutes}, Market open: ${marketOpenMinutes}, Market close: ${marketCloseMinutes}`);
      
      let isOpen = false;
      let status: MarketStatus['status'];
      
      if (isWeekday && currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes) {
        isOpen = true;
        status = 'open';
        console.log(`🕐 Market is OPEN (${currentMinutes} between ${marketOpenMinutes} and ${marketCloseMinutes})`);
      } else if (isWeekday && currentMinutes < marketOpenMinutes) {
        status = 'pre-market';
        console.log(`🕐 Market is PRE-MARKET (${currentMinutes} < ${marketOpenMinutes})`);
      } else if (isWeekday && currentMinutes >= marketCloseMinutes) {
        status = 'after-market';
        console.log(`🕐 Market is AFTER-MARKET (${currentMinutes} >= ${marketCloseMinutes})`);
      } else {
        status = 'closed';
        console.log(`🕐 Market is CLOSED (not weekday or outside hours)`);
      }
      
      console.log(`🕐 Final US Market Status: ${status}, Is Open: ${isOpen}`);
      
      const nextOpen = this.getNextUSMarketOpen(easternTime);
      const nextClose = isOpen ? this.getNextUSMarketClose(easternTime) : null;
      const timeUntilNext = this.getTimeUntilNext(now, isOpen ? nextClose : nextOpen);
      
      return {
        isOpen,
        nextOpen,
        nextClose,
        timeUntilNext,
        status,
        market: 'US'
      };
    }
  
    private static getIsraeliMarketStatus(now: Date): MarketStatus {
      // Convert to Israel Time
      const israelTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
      const day = israelTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = israelTime.getHours();
      const minute = israelTime.getMinutes();
      
      console.log(`🕐 Israel Time: ${israelTime.toLocaleString()}`);
      console.log(`🕐 Day: ${day}, Hour: ${hour}, Minute: ${minute}`);
      
      const isMarketDay = day >= 0 && day <= 4; // Sunday-Thursday
      const currentMinutes = hour * 60 + minute;
      const marketOpenMinutes = 9 * 60; // 9:00 AM
      const marketCloseMinutes = 17 * 60 + 25; // 5:25 PM
      
      let isOpen = false;
      let status: MarketStatus['status'];
      
      if (isMarketDay && currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes) {
        isOpen = true;
        status = 'open';
      } else if (isMarketDay && currentMinutes < marketOpenMinutes) {
        status = 'pre-market';
      } else if (isMarketDay && currentMinutes >= marketCloseMinutes) {
        status = 'after-market';
      } else {
        status = 'closed';
      }
      
      console.log(`🕐 Israeli Market Status: ${status}, Is Open: ${isOpen}`);
      
      const nextOpen = this.getNextIsraeliMarketOpen(israelTime);
      const nextClose = isOpen ? this.getNextIsraeliMarketClose(israelTime) : null;
      const timeUntilNext = this.getTimeUntilNext(now, isOpen ? nextClose : nextOpen);
      
      return {
        isOpen,
        nextOpen,
        nextClose,
        timeUntilNext,
        status,
        market: 'ISRAEL'
      };
    }
  
    private static getNextUSMarketOpen(easternTime: Date): Date {
      const next = new Date(easternTime);
      next.setHours(9, 30, 0, 0);
      
      // If market opening time has passed today, move to next weekday
      if (next <= easternTime) {
        next.setDate(next.getDate() + 1);
      }
      
      // Skip weekends
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    }
  
    private static getNextUSMarketClose(easternTime: Date): Date {
      const next = new Date(easternTime);
      next.setHours(16, 0, 0, 0);
      
      // If market closing time has passed today, move to next weekday
      if (next <= easternTime) {
        next.setDate(next.getDate() + 1);
        // Skip weekends
        while (next.getDay() === 0 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
        next.setHours(16, 0, 0, 0);
      }
      
      return next;
    }
  
    private static getNextIsraeliMarketOpen(israelTime: Date): Date {
      const next = new Date(israelTime);
      next.setHours(9, 0, 0, 0);
      
      // If market opening time has passed today, move to next market day
      if (next <= israelTime) {
        next.setDate(next.getDate() + 1);
      }
      
      // Skip Friday and Saturday (Israeli weekend)
      while (next.getDay() === 5 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    }
  
    private static getNextIsraeliMarketClose(israelTime: Date): Date {
      const next = new Date(israelTime);
      next.setHours(17, 25, 0, 0);
      
      // If market closing time has passed today, move to next market day
      if (next <= israelTime) {
        next.setDate(next.getDate() + 1);
        // Skip Friday and Saturday (Israeli weekend)
        while (next.getDay() === 5 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
        next.setHours(17, 25, 0, 0);
      }
      
      return next;
    }
  
    private static getTimeUntilNext(now: Date, nextTime: Date | null): string {
      if (!nextTime) return '';
      
      const diff = nextTime.getTime() - now.getTime();
      
      if (diff <= 0) return '0m';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }
  
    static getMarketStatusMessage(status: MarketStatus): string {
      const marketName = status.market === 'US' ? 'US Market' : 'Israeli Market';
      
      switch (status.status) {
        case 'open':
          return `${marketName} is open • Closes in ${status.timeUntilNext}`;
        case 'pre-market':
          return `${marketName} pre-market • Opens in ${status.timeUntilNext}`;
        case 'after-market':
          return `${marketName} after-hours • Opens in ${status.timeUntilNext}`;
        case 'closed':
          return `${marketName} closed • Opens in ${status.timeUntilNext}`;
        default:
          return `${marketName} status unknown`;
      }
    }
  
    // Auto-detect market based on user's location or stock symbols
    static detectMarket(symbols: string[]): 'US' | 'ISRAEL' {
      const israeliSymbols = ['TEVA', 'CHKP', 'NICE', 'WDAY', 'MNDY', 'FVRR', 'WIX'];
      const hasIsraeliStock = symbols.some(symbol => 
        israeliSymbols.includes(symbol) || symbol.endsWith('.TA')
      );
      
      return hasIsraeliStock ? 'ISRAEL' : 'US';
    }
  
    // Get combined market status (shows both if relevant)
    static getCombinedMarketStatus(symbols: string[]): { us: MarketStatus; israel: MarketStatus } {
      return {
        us: this.getCurrentMarketStatus('US'),
        israel: this.getCurrentMarketStatus('ISRAEL')
      };
    }
  }