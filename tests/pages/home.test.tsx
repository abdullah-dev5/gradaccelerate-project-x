import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '#inertia/pages/home'

// Mock the AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null as any,
  login: jest.fn(),
  logout: jest.fn(),
}

jest.mock('../../inertia/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock the WeatherCard component
jest.mock('../../inertia/components/WeatherCard', () => {
  return function MockWeatherCard() {
    return <div data-testid="weather-card">Weather Card</div>
  }
})

// Mock Inertia.js components
jest.mock('@inertiajs/react', () => ({
  Head: ({ title }: { title: string }) => <title>{title}</title>,
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock context to default state
    mockAuthContext.isAuthenticated = false
    mockAuthContext.user = null
  })

  describe('Page Structure', () => {
    it('renders the page title', () => {
    render(<Home />)
    expect(document.title).toBe('Race Track')
  })

    it('renders the welcome heading', () => {
    render(<Home />)
    expect(screen.getByText('Welcome to Race Track')).toBeInTheDocument()
  })

    it('renders the logo SVG', () => {
      render(<Home />)
      const logo = screen.getByRole('img', { hidden: true }) // SVG might be hidden
      expect(logo).toBeInTheDocument()
    })

    it('renders the weather card', () => {
      render(<Home />)
      expect(screen.getByTestId('weather-card')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated User Experience', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = false
      mockAuthContext.user = null
    })

    it('shows authentication buttons for non-authenticated users', () => {
      render(<Home />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    it('shows welcome message for non-authenticated users', () => {
      render(<Home />)
      
      expect(screen.getByText(/Your all-in-one productivity platform/)).toBeInTheDocument()
    })

    it('links authentication buttons to correct routes', () => {
      render(<Home />)
      
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      const signUpLink = screen.getByRole('link', { name: /sign up/i })
      
      expect(signInLink).toHaveAttribute('href', '/login')
      expect(signUpLink).toHaveAttribute('href', '/register')
    })

    it('links feature cards to login page for non-authenticated users', () => {
      render(<Home />)
      
      const notesLink = screen.getByRole('link', { name: /notes/i })
      const todosLink = screen.getByRole('link', { name: /todos/i })
      const projectsLink = screen.getByRole('link', { name: /projects/i })
      
      expect(notesLink).toHaveAttribute('href', '/login')
      expect(todosLink).toHaveAttribute('href', '/login')
      expect(projectsLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Authenticated User Experience', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com'
      }
    })

    it('shows personalized welcome message for authenticated users', () => {
      render(<Home />)
      
      expect(screen.getByText('Welcome back, John Doe! Ready to be productive?')).toBeInTheDocument()
    })

    it('shows dashboard button for authenticated users', () => {
      render(<Home />)
      
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
    })

    it('links dashboard button to correct route', () => {
      render(<Home />)
      
      const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('links feature cards to actual feature pages for authenticated users', () => {
    render(<Home />)
      
    const notesLink = screen.getByRole('link', { name: /notes/i })
      const todosLink = screen.getByRole('link', { name: /todos/i })
      const projectsLink = screen.getByRole('link', { name: /projects/i })
      
    expect(notesLink).toHaveAttribute('href', '/notes')
      expect(todosLink).toHaveAttribute('href', '/todos')
      expect(projectsLink).toHaveAttribute('href', '/projects')
    })

    it('does not show authentication buttons for authenticated users', () => {
      render(<Home />)
      
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
    })
  })

  describe('Feature Cards', () => {
    it('renders all feature cards', () => {
      render(<Home />)
      
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Todos')).toBeInTheDocument()
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    it('shows correct descriptions for each feature', () => {
      render(<Home />)
      
    expect(screen.getByText('Manage your notes and thoughts in one place')).toBeInTheDocument()
      expect(screen.getByText('Keep track of your tasks and stay organized')).toBeInTheDocument()
      expect(screen.getByText('Manage your projects and track progress')).toBeInTheDocument()
    })

    it('applies correct styling to feature cards', () => {
      render(<Home />)
      
      const notesCard = screen.getByText('Notes').closest('div')
      expect(notesCard).toHaveClass('bg-[#2C2C2E]', 'p-6', 'rounded-xl')
    })
  })

  describe('Layout and Styling', () => {
    it('applies correct background styling', () => {
      render(<Home />)
      
      const mainContainer = screen.getByText('Welcome to Race Track').closest('div')
      expect(mainContainer?.parentElement).toHaveClass('min-h-screen', 'bg-[#1C1C1E]', 'text-white')
    })

    it('applies responsive grid layout', () => {
      render(<Home />)
      
      const cardsContainer = screen.getByText('Notes').closest('div')?.parentElement
      expect(cardsContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2')
    })

    it('applies hover effects to feature cards', () => {
      render(<Home />)
      
      const notesCard = screen.getByText('Notes').closest('div')
      expect(notesCard).toHaveClass('hover:bg-[#3C3C3E]', 'transition-colors', 'duration-200')
    })
  })

  describe('Edge Cases', () => {
    it('handles user with missing fullName gracefully', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        fullName: null,
        email: 'john@example.com'
      }

      render(<Home />)
      
      expect(screen.getByText('Welcome back, ! Ready to be productive?')).toBeInTheDocument()
    })

    it('handles user with undefined fullName gracefully', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        email: 'john@example.com'
      }

      render(<Home />)
      
      expect(screen.getByText('Welcome back, ! Ready to be productive?')).toBeInTheDocument()
    })

    it('handles null user object gracefully', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = null

      render(<Home />)
      
      expect(screen.getByText('Welcome back, ! Ready to be productive?')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Home />)
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Welcome to Race Track')
      
      const featureHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(featureHeadings).toHaveLength(3)
      expect(featureHeadings[0]).toHaveTextContent('Notes')
      expect(featureHeadings[1]).toHaveTextContent('Todos')
      expect(featureHeadings[2]).toHaveTextContent('Projects')
    })

    it('has proper link text for screen readers', () => {
    render(<Home />)
      
      const notesLink = screen.getByRole('link', { name: /notes/i })
    const todosLink = screen.getByRole('link', { name: /todos/i })
      const projectsLink = screen.getByRole('link', { name: /projects/i })
      
      expect(notesLink).toBeInTheDocument()
    expect(todosLink).toBeInTheDocument()
      expect(projectsLink).toBeInTheDocument()
    })

    it('has proper button text for screen readers', () => {
      render(<Home />)
      
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      
      expect(signInButton).toBeInTheDocument()
      expect(signUpButton).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('integrates with AuthContext correctly', () => {
      const { rerender } = render(<Home />)
      
      // Initially unauthenticated
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      
      // Change to authenticated
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = { id: 1, fullName: 'Jane Doe', email: 'jane@example.com' }
      
      rerender(<Home />)
      
      expect(screen.getByText('Welcome back, Jane Doe! Ready to be productive?')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })

    it('integrates with WeatherCard component', () => {
      render(<Home />)
      
      expect(screen.getByTestId('weather-card')).toBeInTheDocument()
    })
  })
})
