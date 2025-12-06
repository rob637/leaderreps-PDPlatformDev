
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { timeService } from '../services/timeService.js'
import { buildUserProfilePath, buildModulePath } from '../services/pathUtils.js'
import { sanitizeTimestamps } from '../services/dataUtils.js'

describe('Critical Functionality - TimeService', () => {
  
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString() }),
        removeItem: vi.fn((key) => { delete store[key] }),
        clear: vi.fn(() => { store = {} })
      }
    })()
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    })
    
    // Reset time service state if possible (it's a singleton, so we might need to rely on reset())
    timeService.reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return a valid date object from getNow()', () => {
    const now = timeService.getNow()
    expect(now).toBeInstanceOf(Date)
    expect(isNaN(now.getTime())).toBe(false)
  })

  it('should return today\'s date string in YYYY-MM-DD format', () => {
    const todayStr = timeService.getTodayStr()
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should calculate milliseconds until midnight correctly', () => {
    const msUntilMidnight = timeService.getMsUntilMidnight()
    expect(msUntilMidnight).toBeGreaterThan(0)
    expect(msUntilMidnight).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
  })

  it('should allow time travel and update offset', () => {
    const targetDate = new Date('2025-12-25T12:00:00Z')
    
    // Spy on console.log to verify output
    vi.spyOn(console, 'log')
    
    timeService.travelTo(targetDate)
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith('time_travel_offset', expect.any(String))
    expect(window.location.reload).toHaveBeenCalled()
    expect(timeService.isActive()).toBe(true)
    
    // Verify the time is close to target (ignoring execution time)
    const now = timeService.getNow()
    const diff = Math.abs(now.getTime() - targetDate.getTime())
    expect(diff).toBeLessThan(1000) // Should be within 1 second
  })

  it('should reset time travel correctly', () => {
    // First travel
    const targetDate = new Date('2025-12-25T12:00:00Z')
    timeService.travelTo(targetDate)
    expect(timeService.isActive()).toBe(true)
    
    // Then reset
    timeService.reset()
    
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('time_travel_offset')
    expect(window.location.reload).toHaveBeenCalled()
    expect(timeService.isActive()).toBe(false)
    
    // Verify offset is 0 (approximately)
    const now = timeService.getNow()
    const realNow = new Date()
    const diff = Math.abs(now.getTime() - realNow.getTime())
    expect(diff).toBeLessThan(1000)
  })
})

describe('Critical Functionality - PathUtils', () => {
  it('should build user profile path correctly', () => {
    const uid = 'user123'
    expect(buildUserProfilePath(uid)).toBe('users/user123')
  })

  it('should build module path correctly', () => {
    const userId = 'user123'
    const moduleName = 'goals'
    const docName = '2025-Q1'
    expect(buildModulePath(userId, moduleName, docName)).toBe('modules/user123/goals/2025-Q1')
  })
})

describe('Critical Functionality - DataUtils', () => {
  it('should sanitize Firestore timestamps correctly', () => {
    // Mock Firestore Timestamp
    const mockTimestamp = {
      toDate: () => new Date('2025-01-01T00:00:00Z')
    }
    
    const sanitized = sanitizeTimestamps(mockTimestamp)
    expect(sanitized).toBeInstanceOf(Date)
    expect(sanitized.toISOString()).toBe('2025-01-01T00:00:00.000Z')
  })

  it('should sanitize serialized timestamps {seconds, nanoseconds}', () => {
    const serialized = { seconds: 1735689600, nanoseconds: 0 } // 2025-01-01T00:00:00Z
    const sanitized = sanitizeTimestamps(serialized)
    expect(sanitized).toBeInstanceOf(Date)
    expect(sanitized.toISOString()).toBe('2025-01-01T00:00:00.000Z')
  })

  it('should recursively sanitize objects', () => {
    const data = {
      name: 'Test',
      createdAt: { seconds: 1735689600, nanoseconds: 0 },
      nested: {
        updatedAt: { toDate: () => new Date('2025-01-02T00:00:00Z') }
      }
    }
    
    const sanitized = sanitizeTimestamps(data)
    expect(sanitized.createdAt).toBeInstanceOf(Date)
    expect(sanitized.nested.updatedAt).toBeInstanceOf(Date)
    expect(sanitized.name).toBe('Test')
  })
})
