import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '#inertia/components/Header'

// Mock the AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  user: null as any,
  login: jest.fn(),
  logout: jest.fn(),
}

jest.mock('../../../inertia/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock Inertia.js components
jest.mock('@inertiajs/react', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock context to default state
    mockAuthContext.isAuthenticated = false
    mockAuthContext.user = null
  })

  describe('Unauthenticated User', () => {
    it('renders login and signup buttons when not authenticated', () => {
      render(<Header title="Test App" />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })

    it('renders navigation links for unauthenticated users', () => {
      render(<Header title="Test App" />)
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('has correct href attributes for navigation links', () => {
      render(<Header title="Test App" />)
      
      const homeLink = screen.getByText('Home').closest('a')
      const aboutLink = screen.getByText('About').closest('a')
      const contactLink = screen.getByText('Contact').closest('a')
      
      expect(homeLink).toHaveAttribute('href', '/')
      expect(aboutLink).toHaveAttribute('href', '/about')
      expect(contactLink).toHaveAttribute('href', '/contact')
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com'
      }
    })

    it('renders user menu when authenticated', () => {
      render(<Header title="Test App" />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
    })

    it('renders dashboard and profile links for authenticated users', () => {
      render(<Header title="Test App" />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('calls logout function when logout button is clicked', async () => {
      render(<Header title="Test App" />)
      
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)
      
      expect(mockAuthContext.logout).toHaveBeenCalledTimes(1)
    })

    it('shows user avatar when user has avatar', () => {
      mockAuthContext.user.avatarUrl = 'https://example.com/avatar.jpg'
      
      render(<Header title="Test App" />)
      
      const avatar = screen.getByAltText('User avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('shows default avatar when user has no avatar', () => {
      mockAuthContext.user.avatarUrl = null
      
      render(<Header title="Test App" />)
      
      const avatar = screen.getByAltText('User avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', '/default-avatar.png')
    })
  })

  describe('Mobile Menu', () => {
    it('toggles mobile menu when hamburger button is clicked', () => {
      render(<Header title="Test App" />)
      
      const hamburgerButton = screen.getByLabelText('Toggle mobile menu')
      const mobileMenu = screen.getByTestId('mobile-menu')
      
      // Initially hidden
      expect(mobileMenu).toHaveClass('hidden')
      
      // Click to open
      fireEvent.click(hamburgerButton)
      expect(mobileMenu).not.toHaveClass('hidden')
      
      // Click to close
      fireEvent.click(hamburgerButton)
      expect(mobileMenu).toHaveClass('hidden')
    })

    it('closes mobile menu when clicking outside', () => {
      render(<Header title="Test App" />)
      
      const hamburgerButton = screen.getByLabelText('Toggle mobile menu')
      const mobileMenu = screen.getByTestId('mobile-menu')
      
      // Open menu
      fireEvent.click(hamburgerButton)
      expect(mobileMenu).not.toHaveClass('hidden')
      
      // Click outside
      fireEvent.click(document.body)
      expect(mobileMenu).toHaveClass('hidden')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Header title="Test App" />)
      
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      render(<Header title="Test App" />)
      
      const logo = screen.getByText('Race Track')
      expect(logo.tagName).toBe('H1')
    })

    it('supports keyboard navigation', () => {
      render(<Header title="Test App" />)
      
      const homeLink = screen.getByText('Home')
      homeLink.focus()
      expect(homeLink).toHaveFocus()
      
      // Test tab navigation
      fireEvent.keyDown(homeLink, { key: 'Tab' })
      // Should move focus to next element
    })
  })

  describe('Responsive Design', () => {
    it('shows desktop navigation on large screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      render(<Header title="Test App" />)
      
      const desktopNav = screen.getByTestId('desktop-nav')
      expect(desktopNav).toBeInTheDocument()
    })

    it('shows mobile menu button on small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(<Header title="Test App" />)
      
      const hamburgerButton = screen.getByLabelText('Toggle mobile menu')
      expect(hamburgerButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles user with missing fullName', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        fullName: null,
        email: 'john@example.com'
      }

      render(<Header title="Test App" />)
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('handles user with empty fullName', () => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.user = {
        id: 1,
        fullName: '',
        email: 'john@example.com'
      }

      render(<Header title="Test App" />)
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })
})
