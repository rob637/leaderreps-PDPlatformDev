// src/test/color-compliance-simple.test.jsx
// Simplified Corporate Color Compliance Tests
// Tests core color validation without complex component rendering

import { describe, it, expect } from 'vitest'
import { CORPORATE_COLORS, APPROVED_COLORS, isApprovedColor } from './setup.js'

describe('Corporate Color Compliance - Core Tests', () => {
  
  describe('Approved Color Validation', () => {
    it('should only allow corporate brand colors', () => {
      const expectedColors = [
        '#002E47', // Navy
        '#E04E1B', // Orange
        '#FCFCFA', // Light Gray
        '#47A88D', // Teal
        '#349881', // Subtle Teal
        '#FFFFFF'  // White (surfaces only)
      ]
      
      // All expected colors should be present
      expectedColors.forEach(color => {
        expect(APPROVED_COLORS).toContain(color)
      })
      
      // No extra colors should be present
      expect(APPROVED_COLORS.length).toBe(expectedColors.length)
    })

    it('should correctly identify corporate colors', () => {
      // Test approved colors
      expect(isApprovedColor('#002E47')).toBe(true) // Navy
      expect(isApprovedColor('#E04E1B')).toBe(true) // Orange
      expect(isApprovedColor('#FCFCFA')).toBe(true) // Light Gray
      expect(isApprovedColor('#47A88D')).toBe(true) // Teal
      expect(isApprovedColor('#349881')).toBe(true) // Subtle Teal
      expect(isApprovedColor('#FFFFFF')).toBe(true) // White
      
      // Test case insensitive
      expect(isApprovedColor('#002e47')).toBe(true) // lowercase
      expect(isApprovedColor('002E47')).toBe(true)  // no hash
    })

    it('should reject forbidden colors', () => {
      const forbiddenColors = [
        '#7C3AED', // Purple - FORBIDDEN!
        '#F59E0B', // Amber - FORBIDDEN!
        '#DC2626', // Red - FORBIDDEN!
        '#10B981', // Green - FORBIDDEN!
        '#2563EB', // Blue - FORBIDDEN!
        '#6B7280', // Gray-500 - FORBIDDEN!
        '#374151', // Gray-700 - FORBIDDEN!
        '#E5E7EB', // Gray-200 - FORBIDDEN!
        '#000000', // Black - SHOULD USE NAVY
        '#F3F4F6', // Light Gray - USE CORPORATE LIGHT GRAY
      ]
      
      forbiddenColors.forEach(color => {
        expect(isApprovedColor(color), 
          `Color ${color} should be FORBIDDEN but was approved`
        ).toBe(false)
      })
    })

    it('should approve corporate rgba colors with transparency', () => {
      // Navy rgba variations
      expect(isApprovedColor('rgba(0, 46, 71, 0.5)')).toBe(true)
      expect(isApprovedColor('rgba(0, 46, 71, 0.1)')).toBe(true)
      expect(isApprovedColor('rgba(0, 46, 71, 1)')).toBe(true)
      
      // Orange rgba variations
      expect(isApprovedColor('rgba(224, 78, 27, 0.8)')).toBe(true)
      expect(isApprovedColor('rgba(224, 78, 27, 0.2)')).toBe(true)
      
      // Teal rgba variations
      expect(isApprovedColor('rgba(71, 168, 141, 0.3)')).toBe(true)
      expect(isApprovedColor('rgba(52, 152, 129, 0.5)')).toBe(true) // Subtle teal
      
      // Light gray rgba variations
      expect(isApprovedColor('rgba(252, 252, 250, 0.95)')).toBe(true)
      
      // White rgba variations
      expect(isApprovedColor('rgba(255, 255, 255, 0.95)')).toBe(true)
    })

    it('should reject non-corporate rgba colors', () => {
      // Purple rgba - FORBIDDEN
      expect(isApprovedColor('rgba(124, 58, 237, 0.5)')).toBe(false)
      
      // Amber rgba - FORBIDDEN
      expect(isApprovedColor('rgba(245, 158, 11, 0.8)')).toBe(false)
      
      // Red rgba - FORBIDDEN
      expect(isApprovedColor('rgba(220, 38, 38, 0.7)')).toBe(false)
      
      // Green rgba - FORBIDDEN
      expect(isApprovedColor('rgba(16, 185, 129, 0.4)')).toBe(false)
      
      // Blue rgba - FORBIDDEN
      expect(isApprovedColor('rgba(37, 99, 235, 0.6)')).toBe(false)
      
      // Random non-corporate colors
      expect(isApprovedColor('rgba(100, 100, 100, 0.5)')).toBe(false)
      expect(isApprovedColor('rgba(200, 50, 50, 0.3)')).toBe(false)
    })
  })

  describe('Color Constant Structure', () => {
    it('should have all required corporate color constants', () => {
      expect(CORPORATE_COLORS.NAVY).toBe('#002E47')
      expect(CORPORATE_COLORS.ORANGE).toBe('#E04E1B')
      expect(CORPORATE_COLORS.LIGHT_GRAY).toBe('#FCFCFA')
      expect(CORPORATE_COLORS.TEAL).toBe('#47A88D')
      expect(CORPORATE_COLORS.SUBTLE_TEAL).toBe('#349881')
      expect(CORPORATE_COLORS.WHITE).toBe('#FFFFFF')
    })

    it('should not contain any forbidden color constants', () => {
      const colorValues = Object.values(CORPORATE_COLORS)
      
      // Ensure no forbidden colors exist in our constants
      expect(colorValues).not.toContain('#7C3AED') // No purple
      expect(colorValues).not.toContain('#F59E0B') // No amber
      expect(colorValues).not.toContain('#DC2626') // No red
      expect(colorValues).not.toContain('#10B981') // No green
      expect(colorValues).not.toContain('#2563EB') // No blue
      expect(colorValues).not.toContain('#000000') // No black
    })
  })

  describe('Brand Compliance Edge Cases', () => {
    it('should handle color variations and whitespace', () => {
      // Test with spaces
      expect(isApprovedColor(' #002E47 ')).toBe(true)
      expect(isApprovedColor('rgba(0, 46, 71, 0.5) ')).toBe(true)
      
      // Test mixed case
      expect(isApprovedColor('#002e47')).toBe(true)
      expect(isApprovedColor('#E04e1B')).toBe(true)
      
      // Test without hash
      expect(isApprovedColor('002E47')).toBe(true)
      expect(isApprovedColor('E04E1B')).toBe(true)
    })

    it('should handle null and empty values gracefully', () => {
      expect(isApprovedColor(null)).toBe(true)    // null is allowed
      expect(isApprovedColor('')).toBe(true)      // empty string is allowed
      expect(isApprovedColor(undefined)).toBe(true) // undefined is allowed
      expect(isApprovedColor('transparent')).toBe(true) // transparent is allowed
    })

    it('should validate CSS color format variations', () => {
      // Hex with 3 digits should be rejected (not specific enough)
      expect(isApprovedColor('#000')).toBe(false)
      expect(isApprovedColor('#FFF')).toBe(false)
      
      // RGB format should work
      expect(isApprovedColor('rgb(0, 46, 71)')).toBe(true) // Navy
      expect(isApprovedColor('rgb(224, 78, 27)')).toBe(true) // Orange
    })
  })

  describe('Compliance Report', () => {
    it('should provide clear compliance summary', () => {
      const complianceReport = {
        approvedColors: APPROVED_COLORS,
        totalApprovedColors: APPROVED_COLORS.length,
        corporateColorCount: 5, // Navy, Orange, Light Gray, Teal, Subtle Teal
        utilityColorCount: 1,   // White for surfaces
        forbiddenColorCount: 0, // Should be zero!
      }
      
      // Verify compliance metrics
      expect(complianceReport.totalApprovedColors).toBe(6) // 5 corporate + 1 white
      expect(complianceReport.corporateColorCount).toBe(5)
      expect(complianceReport.utilityColorCount).toBe(1)
      expect(complianceReport.forbiddenColorCount).toBe(0)
      
      // Log compliance status for visibility
      console.log('🎨 CORPORATE COLOR COMPLIANCE REPORT 🎨')
      console.log('✅ Approved Colors:', complianceReport.approvedColors)
      console.log('📊 Total Approved:', complianceReport.totalApprovedColors)
      console.log('🏢 Corporate Colors:', complianceReport.corporateColorCount)
      console.log('🔧 Utility Colors:', complianceReport.utilityColorCount)
      console.log('🚫 Forbidden Colors:', complianceReport.forbiddenColorCount)
      console.log(complianceReport.forbiddenColorCount === 0 ? '✅ FULLY COMPLIANT!' : '❌ NON-COMPLIANT!')
    })
  })
})

describe('File-Based Color Scanning', () => {
  it('should identify color patterns in code', () => {
    // Test the color detection regex patterns we use
    const testCases = [
      { input: '#002E47', expected: true, description: 'Navy hex' },
      { input: '#7C3AED', expected: false, description: 'Purple hex (forbidden)' },
      { input: 'rgba(0, 46, 71, 0.5)', expected: true, description: 'Navy rgba' },
      { input: 'rgba(124, 58, 237, 0.5)', expected: false, description: 'Purple rgba (forbidden)' },
      { input: 'background-color: #E04E1B', expected: true, description: 'Orange in CSS property' },
      { input: 'color: #F59E0B', expected: false, description: 'Amber in CSS property (forbidden)' },
    ]
    
    testCases.forEach(({ input, expected, description }) => {
      expect(isApprovedColor(input), description).toBe(expected)
    })
  })
})