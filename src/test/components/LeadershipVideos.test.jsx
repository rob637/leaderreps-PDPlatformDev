// src/test/components/LeadershipVideos.test.jsx
// Component-specific tests for the enhanced Leadership Videos screen

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { isApprovedColor } from '../setup.js';
import LeadershipVideosScreen from '../../components/screens/LeadershipVideos.jsx';

// Mock useAppServices
const mockNavigate = vi.fn();
const mockVideoServices = {
    navigate: mockNavigate,
    VIDEO_CATALOG: {
        items: {
            INSPIRATIONAL: [
                {
                    id: 'test-1',
                    title: 'Test Video 1', 
                    speaker: 'Test Speaker',
                    duration: '10 min',
                    url: 'https://youtube.com/watch?v=test1',
                    description: 'Test description 1'
                }
            ],
            ACTIONABLE: [
                {
                    id: 'test-2',
                    title: 'Test Video 2',
                    speaker: 'Test Speaker 2', 
                    duration: '15 min',
                    url: 'https://youtube.com/watch?v=test2',
                    description: 'Test description 2'
                }
            ]
        }
    }
};

vi.mock('../../services/useAppServices.jsx', () => ({
    useAppServices: () => mockVideoServices
}));

describe('Leadership Videos Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        // Mock window.scrollTo
        Object.defineProperty(window, 'scrollTo', {
  });
        // Mock window.open 
        Object.defineProperty(window, 'open', {
  });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Corporate Color Compliance', () => {
        it('should use only approved corporate colors', () => {
            render(<LeadershipVideosScreen />);
            
            // Check header elements
            const header = screen.getByRole('banner');
            expect(header).toBeInTheDocument();
            
            // Check main container
            const container = screen.getByText('Leadership Video Library').closest('div');
            expect(container).toBeInTheDocument();
            
            // Verify no forbidden colors are used in styling
            const allElements = container.querySelectorAll('*');
            allElements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                const backgroundColor = computedStyle.backgroundColor;
                const color = computedStyle.color;
                const borderColor = computedStyle.borderColor;
                
                if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                    expect(isApprovedColor(backgroundColor)).toBe(true);
                }
                if (color && color !== 'rgba(0, 0, 0, 0)') {
                    expect(isApprovedColor(color)).toBe(true);
                }
                if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                    expect(isApprovedColor(borderColor)).toBe(true);
                }
            });
        });

        it('should apply corporate colors to search and filter controls', () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos/i);
            expect(searchInput).toBeInTheDocument();
            
            const categorySelect = screen.getByDisplayValue(/all categories/i);
            expect(categorySelect).toBeInTheDocument();
            
            // Both should have corporate styling
            expect(searchInput).toHaveAttribute('class');
            expect(categorySelect).toHaveAttribute('class');
        });
    });

    describe('Enhanced Video Library Features', () => {
        it('should render search input and filters', () => {
            render(<LeadershipVideosScreen />);
            
            expect(screen.getByPlaceholderText(/search videos, speakers, topics/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue(/all categories/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue(/all tags/i)).toBeInTheDocument();
        });

        it('should display video count correctly', () => {
            render(<LeadershipVideosScreen />);
            
            // Should show count of videos found
            expect(screen.getByText(/video(s)? found/)).toBeInTheDocument();
        });

        it('should filter videos by search term', async () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos, speakers, topics/i);
            
            // Search for specific video
            fireEvent.change(searchInput, { target: { value: 'Simon Sinek' } });
            
            await waitFor(() => {
                // Should filter results
                expect(screen.getByText(/video(s)? found/)).toBeInTheDocument();
            });
        });

        it('should filter by category', async () => {
            render(<LeadershipVideosScreen />);
            
            const categorySelect = screen.getByDisplayValue(/all categories/i);
            
            // Select inspirational category
            fireEvent.change(categorySelect, { target: { value: 'INSPIRATIONAL' } });
            
            await waitFor(() => {
                expect(screen.getByText(/video(s)? found/)).toBeInTheDocument();
            });
        });

        it('should show clear filters button when filters are active', async () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos, speakers, topics/i);
            fireEvent.change(searchInput, { target: { value: 'test' } });
            
            await waitFor(() => {
                expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
            });
        });

        it('should clear all filters when clear button is clicked', async () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos, speakers, topics/i);
            fireEvent.change(searchInput, { target: { value: 'test search' } });
            
            await waitFor(() => {
                const clearButton = screen.getByText(/clear filters/i);
                fireEvent.click(clearButton);
            });
            
            expect(searchInput.value).toBe('');
        });
    });

    describe('Enhanced Video Cards', () => {
        it('should render video cards with enhanced metadata', () => {
            render(<LeadershipVideosScreen />);
            
            // Should show video titles from enhanced catalog
            const videoElements = screen.getAllByText(/watch video/i);
            expect(videoElements.length).toBeGreaterThan(0);
        });

        it('should show video thumbnails', () => {
            render(<LeadershipVideosScreen />);
            
            // Check for YouTube thumbnail images
            const thumbnails = document.querySelectorAll('img[src*="youtube.com/vi"]');
            expect(thumbnails.length).toBeGreaterThan(0);
        });

        it('should display video ratings and view counts', () => {
            render(<LeadershipVideosScreen />);
            
            // Look for rating displays and view counts in enhanced videos
            const ratingElements = document.querySelectorAll('[class*="rating"], [class*="star"]');
            expect(ratingElements.length).toBeGreaterThan(0);
        });

        it('should handle video click actions', async () => {
            render(<LeadershipVideosScreen />);
            
            const watchButtons = screen.getAllByText(/watch video/i);
            if (watchButtons.length > 0) {
                fireEvent.click(watchButtons[0]);
                // Should attempt to open video URL
                expect(window.open).toHaveBeenCalled();
            }
        });
    });

    describe('Accessibility and UX', () => {
        it('should have proper heading structure', () => {
            render(<LeadershipVideosScreen />);
            
            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent(/leadership video library/i);
        });

        it('should have accessible form controls', () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos, speakers, topics/i);
            expect(searchInput).toHaveAttribute('type', 'text');
            
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(2);
        });

        it('should provide empty state message when no videos match', async () => {
            render(<LeadershipVideosScreen />);
            
            const searchInput = screen.getByPlaceholderText(/search videos, speakers, topics/i);
            fireEvent.change(searchInput, { target: { value: 'nonexistentsearchterm12345' } });
            
            await waitFor(() => {
                expect(screen.getByText(/no videos found/i)).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('should have back to dashboard navigation', () => {
            render(<LeadershipVideosScreen />);
            
            const backButton = screen.getByText(/back to the arena/i);
            expect(backButton).toBeInTheDocument();
        });

        it('should navigate back when back button is clicked', () => {
            render(<LeadershipVideosScreen />);
            
            const backButton = screen.getByText(/back to the arena/i);
            fireEvent.click(backButton);
            
            expect(mockNavigate).toHaveBeenCalledWith('dashboard');
        });
    });

    describe('Performance and Loading', () => {
        it('should handle missing video data gracefully', () => {
            // Override mock to simulate missing data
            vi.mocked(mockVideoServices.VIDEO_CATALOG).items = {};
            
            render(<LeadershipVideosScreen />);
            
            // Should still render without crashing
            expect(screen.getByText(/leadership video library/i)).toBeInTheDocument();
        });

        it('should scroll to top on mount', () => {
            render(<LeadershipVideosScreen />);
            
            expect(window.scrollTo).toHaveBeenCalledWith({ 
  });
        });
    });
});