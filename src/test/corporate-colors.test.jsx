// src/test/corporate-colors.test.jsx
// Corporate Color Compliance Test Suite
// Ensures only approved colors (#002E47, #E04E1B, #FCFCFA, #47A88D, #349881) are used

import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CORPORATE_COLORS, APPROVED_COLORS, isApprovedColor, extractColorsFromElement } from './setup.js'

// Import components to test
import { Button, Card } from '../components/screens/dashboard/DashboardComponents.jsx'
import { MembershipGate } from '../components/ui/MembershipGate.jsx'

// Mock Firebase and services
const mockUser = { name: 'Test User', uid: 'test-123' }
const mockMembershipData = { currentTier: 'basic' }

// Mock required context providers
const MockProviders = ({ children }) => {
  return (
    <div data-testid="mock-provider">
      {children}
    </div>
  )
}

describe('Corporate Color Compliance', () => {
  
  describe('Color Constants Validation', () => {
    it('should only contain approved corporate colors', () => {
      const expectedColors = [
        '#002E47', // Navy
        '#E04E1B', // Orange
        '#FCFCFA', // Light Gray
        '#47A88D', // Teal
        '#349881', // Subtle Teal
        '#FFFFFF'  // White (allowed for surfaces)
      ]
      
      expect(APPROVED_COLORS).toEqual(expect.arrayContaining(expectedColors))
      expect(APPROVED_COLORS.length).toBeLessThanOrEqual(6) // Only approved colors
    })

    it('should correctly identify approved colors', () => {
      // Test approved colors
      expect(isApprovedColor('#002E47')).toBe(true) // Navy
      expect(isApprovedColor('#E04E1B')).toBe(true) // Orange
      expect(isApprovedColor('#FCFCFA')).toBe(true) // Light Gray
      expect(isApprovedColor('#47A88D')).toBe(true) // Teal
      expect(isApprovedColor('#349881')).toBe(true) // Subtle Teal
      expect(isApprovedColor('#FFFFFF')).toBe(true) // White
      
      // Test forbidden colors
      expect(isApprovedColor('#7C3AED')).toBe(false) // Purple
      expect(isApprovedColor('#F59E0B')).toBe(false) // Amber
      expect(isApprovedColor('#DC2626')).toBe(false) // Red
      expect(isApprovedColor('#10B981')).toBe(false) // Green
      expect(isApprovedColor('#2563EB')).toBe(false) // Blue
    })

    it('should correctly identify approved rgba colors', () => {
      // Test approved rgba colors (corporate colors with opacity)
      expect(isApprovedColor('rgba(0, 46, 71, 0.5)')).toBe(true)   // Navy with opacity
      expect(isApprovedColor('rgba(224, 78, 27, 0.8)')).toBe(true) // Orange with opacity
      expect(isApprovedColor('rgba(71, 168, 141, 0.2)')).toBe(true) // Teal with opacity
      
      // Test non-corporate rgba colors
      expect(isApprovedColor('rgba(124, 58, 237, 0.5)')).toBe(false) // Purple with opacity
      expect(isApprovedColor('rgba(245, 158, 11, 0.8)')).toBe(false) // Amber with opacity
    })
  })

  describe('Button Component Compliance', () => {
    it('should only use corporate colors for primary buttons', () => {
      render(
        <MockProviders>
          <Button variant="primary" data-testid="primary-button">
            Primary Button
          </Button>
        </MockProviders>
      )
      
      const button = screen.getByTestId('primary-button')
      const colors = extractColorsFromElement(button)
      
      colors.forEach(({ property, value }) => {
        expect(isApprovedColor(value), 
          `Button property '${property}' uses non-corporate color: ${value}`
        ).toBe(true)
      })
    })

    it('should only use corporate colors for secondary buttons', () => {
      render(
        <MockProviders>
          <Button variant="secondary" data-testid="secondary-button">
            Secondary Button
          </Button>
        </MockProviders>
      )
      
      const button = screen.getByTestId('secondary-button')
      const colors = extractColorsFromElement(button)
      
      colors.forEach(({ property, value }) => {
        expect(isApprovedColor(value),
          `Button property '${property}' uses non-corporate color: ${value}`
        ).toBe(true)
      })
    })

    it('should use correct corporate colors for button variants', () => {
      const { rerender } = render(
        <MockProviders>
          <Button variant="primary" data-testid="test-button">Test</Button>
        </MockProviders>
      )
      
      // Test primary button uses teal
      let button = screen.getByTestId('test-button')
      let style = window.getComputedStyle(button)
      
      // Should use corporate teal or navy
      expect([CORPORATE_COLORS.TEAL, CORPORATE_COLORS.NAVY]).toContain(
        style.backgroundColor || style.color
      )
      
      // Test secondary button uses orange
      rerender(
        <MockProviders>
          <Button variant="secondary" data-testid="test-button">Test</Button>
        </MockProviders>
      )
      
      button = screen.getByTestId('test-button')
      style = window.getComputedStyle(button)
      
      // Should use corporate orange
      expect([CORPORATE_COLORS.ORANGE, CORPORATE_COLORS.TEAL]).toContain(
        style.backgroundColor || style.color
      )
    })
  })

  describe('Card Component Compliance', () => {
    it('should only use corporate colors', () => {
      render(
        <MockProviders>
          <Card title="Test Card" data-testid="test-card">
            <div>Card content</div>
          </Card>
        </MockProviders>
      )
      
      const card = screen.getByTestId('test-card')
      const colors = extractColorsFromElement(card)
      
      colors.forEach(({ property, value }) => {
        expect(isApprovedColor(value),
          `Card property '${property}' uses non-corporate color: ${value}`
        ).toBe(true)
      })
    })

    it('should use corporate accent colors correctly', () => {
      const { rerender } = render(
        <MockProviders>
          <Card title="Navy Card" accent="NAVY" data-testid="test-card">
            Content
          </Card>
        </MockProviders>
      )
      
      let card = screen.getByTestId('test-card')
      let colors = extractColorsFromElement(card)
      
      // Should contain navy accent
      const hasNavy = colors.some(({ value }) => 
        value.includes('002E47') || value.includes('0, 46, 71')
      )
      expect(hasNavy, 'Navy accent card should contain navy color').toBe(true)
      
      // Test teal accent
      rerender(
        <MockProviders>
          <Card title="Teal Card" accent="TEAL" data-testid="test-card">
            Content
          </Card>
        </MockProviders>
      )
      
      card = screen.getByTestId('test-card')
      colors = extractColorsFromElement(card)
      
      const hasTeal = colors.some(({ value }) => 
        value.includes('47A88D') || value.includes('71, 168, 141')
      )
      expect(hasTeal, 'Teal accent card should contain teal color').toBe(true)
    })
  })

  describe('Membership Gate Component Compliance', () => {
    it('should only use corporate colors for tier badges', () => {
      render(
        <MockProviders>
          <MembershipGate 
            requiredTier="professional"
            currentTier="basic"
            data-testid="membership-gate"
          >
            <div>Protected content</div>
          </MembershipGate>
        </MockProviders>
      )
      
      const gate = screen.getByTestId('membership-gate')
      const colors = extractColorsFromElement(gate)
      
      colors.forEach(({ property, value }) => {
        expect(isApprovedColor(value),
          `MembershipGate property '${property}' uses non-corporate color: ${value}`
        ).toBe(true)
      })
    })
  })

  describe('Forbidden Colors Detection', () => {
    it('should detect and fail on purple usage', () => {
      const testElement = document.createElement('div')
      testElement.style.backgroundColor = '#7C3AED' // Purple
      document.body.appendChild(testElement)
      
      const colors = extractColorsFromElement(testElement)
      const hasForbiddenColor = colors.some(({ value }) => !isApprovedColor(value))
      
      expect(hasForbiddenColor, 'Purple should be detected as forbidden color').toBe(true)
      
      document.body.removeChild(testElement)
    })

    it('should detect and fail on amber usage', () => {
      const testElement = document.createElement('div')
      testElement.style.color = '#F59E0B' // Amber
      document.body.appendChild(testElement)
      
      const colors = extractColorsFromElement(testElement)
      const hasForbiddenColor = colors.some(({ value }) => !isApprovedColor(value))
      
      expect(hasForbiddenColor, 'Amber should be detected as forbidden color').toBe(true)
      
      document.body.removeChild(testElement)
    })

    it('should detect and fail on red usage', () => {
      const testElement = document.createElement('div')
      testElement.style.borderColor = '#DC2626' // Red
      document.body.appendChild(testElement)
      
      const colors = extractColorsFromElement(testElement)
      const hasForbiddenColor = colors.some(({ value }) => !isApprovedColor(value))
      
      expect(hasForbiddenColor, 'Red should be detected as forbidden color').toBe(true)
      
      document.body.removeChild(testElement)
    })
  })

  describe('CSS Custom Properties Compliance', () => {
    it('should only define corporate colors in CSS variables', () => {
      const rootStyles = getComputedStyle(document.documentElement)
      
      // Test that corporate color variables exist
      expect(rootStyles.getPropertyValue('--corporate-navy')).toBe('#002E47')
      expect(rootStyles.getPropertyValue('--corporate-orange')).toBe('#E04E1B')
      expect(rootStyles.getPropertyValue('--corporate-teal')).toBe('#47A88D')
      expect(rootStyles.getPropertyValue('--corporate-subtle-teal')).toBe('#349881')
      expect(rootStyles.getPropertyValue('--corporate-light-gray')).toBe('#FCFCFA')
    })
  })
})

describe('Color Usage Integration Tests', () => {
  it('should maintain corporate colors during component state changes', () => {
    const TestComponent = () => {
      const [active, setActive] = React.useState(false)
      return (
        <Button 
          variant={active ? 'primary' : 'secondary'}
          onClick={() => setActive(!active)}
          data-testid="stateful-button"
        >
          {active ? 'Active' : 'Inactive'}
        </Button>
      )
    }
    
    render(
      <MockProviders>
        <TestComponent />
      </MockProviders>
    )
    
    const button = screen.getByTestId('stateful-button')
    
    // Test initial state
    let colors = extractColorsFromElement(button)
    colors.forEach(({ property, value }) => {
      expect(isApprovedColor(value),
        `Stateful button property '${property}' uses non-corporate color: ${value}`
      ).toBe(true)
    })
    
    // Test after state change
    fireEvent.click(button)
    colors = extractColorsFromElement(button)
    colors.forEach(({ property, value }) => {
      expect(isApprovedColor(value),
        `Stateful button (after click) property '${property}' uses non-corporate color: ${value}`
      ).toBe(true)
    })
  })
})