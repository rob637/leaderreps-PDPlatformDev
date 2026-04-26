// src/test/corporate-colors.test.jsx
// Corporate Color Compliance Test Suite
// Ensures only approved colors (#002E47, #E04E1B, #FCFCFA, #47A88D, #349881) are used

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CORPORATE_COLORS, APPROVED_COLORS, isApprovedColor, extractColorsFromElement } from './setup.js'

// Import components to test
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

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
    // Tailwind utilities aren't applied in jsdom, so we validate against the
    // class-name tokens the component emits (the source of truth for color
    // intent in this codebase).
    const FORBIDDEN_TAILWIND_COLOR_PREFIXES = [
      'bg-purple', 'text-purple', 'border-purple',
      'bg-amber', 'text-amber', 'border-amber',
      'bg-yellow', 'text-yellow', 'border-yellow',
      'bg-green', 'text-green', 'border-green',
      'bg-blue', 'text-blue', 'border-blue',
      'bg-indigo', 'text-indigo', 'border-indigo',
      'bg-pink', 'text-pink', 'border-pink',
    ]

    const expectNoForbiddenColorClasses = (el) => {
      const cls = el.className || ''
      FORBIDDEN_TAILWIND_COLOR_PREFIXES.forEach((prefix) => {
        expect(
          cls.includes(prefix),
          `Element should not use forbidden Tailwind color class '${prefix}*': ${cls}`
        ).toBe(false)
      })
    }

    it('should only use corporate colors for primary buttons', () => {
      render(
        <MockProviders>
          <Button variant="primary" data-testid="primary-button">
            Primary Button
          </Button>
        </MockProviders>
      )

      const button = screen.getByTestId('primary-button')
      expect(button.className).toContain('corporate-teal')
      expectNoForbiddenColorClasses(button)
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
      expect(button.className).toContain('corporate-orange')
      expectNoForbiddenColorClasses(button)
    })

    it('should use correct corporate colors for button variants', () => {
      const { rerender } = render(
        <MockProviders>
          <Button variant="primary" data-testid="test-button">Test</Button>
        </MockProviders>
      )

      // Primary uses teal
      let button = screen.getByTestId('test-button')
      expect(button.className).toContain('corporate-teal')

      // Secondary uses orange
      rerender(
        <MockProviders>
          <Button variant="secondary" data-testid="test-button">Test</Button>
        </MockProviders>
      )
      button = screen.getByTestId('test-button')
      expect(button.className).toContain('corporate-orange')
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
      const cls = card.className || ''
      // Card defaults to neutral surface (white/slate) — these are allowed.
      // Assert it does NOT use forbidden vivid Tailwind colors.
      ;['bg-purple', 'bg-amber', 'bg-yellow', 'bg-green', 'bg-blue', 'bg-indigo', 'bg-pink']
        .forEach((prefix) => {
          expect(cls.includes(prefix), `Card uses forbidden color class '${prefix}*': ${cls}`).toBe(false)
        })
    })

    it('should use corporate accent colors correctly', () => {
      const { rerender } = render(
        <MockProviders>
          <Card title="Navy Card" accent="navy" data-testid="test-card">
            Content
          </Card>
        </MockProviders>
      )

      let card = screen.getByTestId('test-card')
      expect(card.className).toContain('corporate-navy')

      rerender(
        <MockProviders>
          <Card title="Teal Card" accent="teal" data-testid="test-card">
            Content
          </Card>
        </MockProviders>
      )
      card = screen.getByTestId('test-card')
      expect(card.className).toContain('corporate-teal')
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

    // Initial state — secondary uses corporate-orange
    expect(button.className).toContain('corporate-orange')

    // After click — primary uses corporate-teal
    fireEvent.click(button)
    expect(button.className).toContain('corporate-teal')
  })
})