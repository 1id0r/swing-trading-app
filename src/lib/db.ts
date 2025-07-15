// File: /src/lib/db.ts
// Updated to use PostgreSQL instead of Prisma

// Re-export everything from db-operations for easy imports
export * from './db-operations'
export { pool } from './database'

// Import the new operations
import { userOps, settingsOps, fifoOps, positionOps } from './db-operations'

// Legacy compatibility - keep these for backward compatibility during migration
export const dbHelpers = {
  async getUserSettings(userId: string) {
    return settingsOps.getUserSettings(userId)
  },

  async createOrUpdateUser(firebaseUid: string, email: string, displayName?: string) {
    return userOps.createOrUpdateUser(firebaseUid, email, displayName)
  },

  async getUserByFirebaseUid(firebaseUid: string) {
    return userOps.getUserByFirebaseUid(firebaseUid)
  },

  async calculateFIFOCostBasis(ticker: string, sharesToSell: number, sellDate: Date, userId: string) {
    return fifoOps.calculateFIFOCostBasis(ticker, sharesToSell, sellDate, userId)
  },

  async updatePosition(ticker: string, userId: string) {
    return positionOps.recalculatePosition(userId, ticker)
  },

  async getUserPortfolioStats(userId: string) {
    // This was in your original code, now using dashboardOps
    const { dashboardOps } = await import('./db-operations')
    return dashboardOps.getDashboardStats(userId)
  }
}

// For any remaining Prisma-style calls (temporary compatibility)
export const db = {
  user: {
    findUnique: async ({ where }: { where: { firebaseUid: string } }) => {
      return userOps.getUserByFirebaseUid(where.firebaseUid)
    },
    upsert: async ({ where, update, create }: any) => {
      return userOps.createOrUpdateUser(where.firebaseUid, create.email, create.displayName)
    }
  },
  
  // Add other model shortcuts as needed during migration
  userSettings: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      return settingsOps.getUserSettings(where.userId)
    },
    create: async ({ data }: any) => {
      return settingsOps.updateUserSettings(data.userId, data)
    }
  }
}

console.log('🔄 Database operations loaded (PostgreSQL mode)')