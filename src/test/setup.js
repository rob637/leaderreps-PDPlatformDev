import '@testing-library/jest-dom'

// Corporate color constants for testing
export const CORPORATE_COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B', 
  LIGHT_GRAY: '#FCFCFA',
  TEAL: '#47A88D',
  SUBTLE_TEAL: '#349881',
  WHITE: '#FFFFFF' // Allow white for surfaces
}

// List of approved colors (hex codes)
export const APPROVED_COLORS = Object.values(CORPORATE_COLORS)

// Forbidden colors that should never appear
export const FORBIDDEN_COLORS = [
  '#7C3AED', // Purple
  '#F59E0B', // Amber
  '#DC2626', // Red
  '#10B981', // Green
  '#2563EB', // Blue
  '#6B7280', // Gray-500
  '#374151', // Gray-700
  '#E5E7EB', // Gray-200
]

// Helper function to check if a color is approved
export const isApprovedColor = (color) => {
  if (!color || color === 'transparent' || color === 'none') return true
  
  // Normalize color format (remove spaces, convert to uppercase)
  const normalizedColor = color.replace(/\s/g, '').toUpperCase()
  
  // Check if it's an approved hex color
  for (const approvedColor of APPROVED_COLORS) {
    if (normalizedColor.includes(approvedColor.toUpperCase().replace('#', ''))) {
      return true
    }
  }
  
  // Allow rgba/rgb colors that use approved base colors
  if (normalizedColor.includes('RGBA') || normalizedColor.includes('RGB')) {
    // Check if it contains approved RGB values
    // Navy: rgba(0, 46, 71, x)
    // Orange: rgba(224, 78, 27, x)  
    // Teal: rgba(71, 168, 141, x)
    // Subtle Teal: rgba(52, 152, 129, x)
    // Light Gray: rgba(252, 252, 250, x)
    const approvedRgbaPatterns = [
      /rgba?\(0,\s*46,\s*71/i,     // Navy
      /rgba?\(224,\s*78,\s*27/i,   // Orange
      /rgba?\(71,\s*168,\s*141/i,  // Teal
      /rgba?\(52,\s*152,\s*129/i,  // Subtle Teal
      /rgba?\(252,\s*252,\s*250/i, // Light Gray
      /rgba?\(255,\s*255,\s*255/i, // White
    ]
    
    return approvedRgbaPatterns.some(pattern => pattern.test(normalizedColor))
  }
  
  return false
}

// Helper function to extract colors from DOM element styles
export const extractColorsFromElement = (element) => {
  const colors = []
  const computedStyle = window.getComputedStyle(element)
  
  // Check common color properties
  const colorProperties = [
    'color',
    'backgroundColor', 
    'borderColor',
    'borderTopColor',
    'borderRightColor', 
    'borderBottomColor',
    'borderLeftColor',
    'boxShadow',
    'textShadow',
    'fill',
    'stroke'
  ]
  
  colorProperties.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop)
    if (value && value !== 'none' && value !== 'transparent') {
      colors.push({ property: prop, value })
    }
  })
  
  return colors
}

// Global test helpers
global.CORPORATE_COLORS = CORPORATE_COLORS
global.APPROVED_COLORS = APPROVED_COLORS
global.FORBIDDEN_COLORS = FORBIDDEN_COLORS
global.isApprovedColor = isApprovedColor
global.extractColorsFromElement = extractColorsFromElement