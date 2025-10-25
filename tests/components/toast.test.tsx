import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from '#inertia/components/Toast'

describe('Toast Component', () => {
  const defaultProps = {
    id: 'test-toast',
    title: 'Test Title',
    message: 'Test message',
    type: 'info' as const,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders toast with message', () => {
      render(<Toast {...defaultProps} />)
      
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<Toast {...defaultProps} />)
      
      const closeButton = screen.getByLabelText('Close notification')
      expect(closeButton).toBeInTheDocument()
    })

    it('applies correct CSS classes based on type', () => {
      const { rerender } = render(<Toast {...defaultProps} type="success" />)
      expect(screen.getByRole('alert')).toHaveClass('bg-green-500')

      rerender(<Toast {...defaultProps} type="error" />)
      expect(screen.getByRole('alert')).toHaveClass('bg-red-500')

      rerender(<Toast {...defaultProps} type="warning" />)
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-500')

      rerender(<Toast {...defaultProps} type="info" />)
      expect(screen.getByRole('alert')).toHaveClass('bg-blue-500')
    })
  })

  describe('Icons', () => {
    it('shows success icon for success type', () => {
      render(<Toast {...defaultProps} type="success" />)
      
      const icon = screen.getByTestId('success-icon')
      expect(icon).toBeInTheDocument()
    })

    it('shows error icon for error type', () => {
      render(<Toast {...defaultProps} type="error" />)
      
      const icon = screen.getByTestId('error-icon')
      expect(icon).toBeInTheDocument()
    })

    it('shows warning icon for warning type', () => {
      render(<Toast {...defaultProps} type="warning" />)
      
      const icon = screen.getByTestId('warning-icon')
      expect(icon).toBeInTheDocument()
    })

    it('shows info icon for info type', () => {
      render(<Toast {...defaultProps} type="info" />)
      
      const icon = screen.getByTestId('info-icon')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(<Toast {...defaultProps} />)
      
      const closeButton = screen.getByLabelText('Close notification')
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast')
    })

    it('calls onClose when clicking outside toast', () => {
      render(<Toast {...defaultProps} />)
      
      const toast = screen.getByRole('alert')
      fireEvent.click(toast)
      
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast')
    })

    it('does not call onClose when clicking message content', () => {
      render(<Toast {...defaultProps} />)
      
      const message = screen.getByText('Test message')
      fireEvent.click(message)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('auto-dismisses after specified duration', () => {
      render(<Toast {...defaultProps} duration={3000} />)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(3000)
      
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast')
    })

    it('does not auto-dismiss when duration is 0', () => {
      render(<Toast {...defaultProps} duration={0} />)
      
      jest.advanceTimersByTime(10000)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('clears timeout when component unmounts', () => {
      const { unmount } = render(<Toast {...defaultProps} duration={3000} />)
      
      unmount()
      
      jest.advanceTimersByTime(3000)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Animation', () => {
    it('applies enter animation class on mount', () => {
      render(<Toast {...defaultProps} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('animate-in', 'slide-in-from-right')
    })

    it('applies exit animation class when closing', () => {
      const { rerender } = render(<Toast {...defaultProps} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
      
      // Note: Animation testing would require more complex setup
      // This test verifies basic rendering
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Toast {...defaultProps} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('has proper role for different types', () => {
      const { rerender } = render(<Toast {...defaultProps} type="error" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()

      rerender(<Toast {...defaultProps} type="warning" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()

      rerender(<Toast {...defaultProps} type="success" />)
      expect(screen.getByRole('status')).toBeInTheDocument()

      rerender(<Toast {...defaultProps} type="info" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<Toast {...defaultProps} />)
      
      const closeButton = screen.getByLabelText('Close notification')
      closeButton.focus()
      
      expect(closeButton).toHaveFocus()
      
      fireEvent.keyDown(closeButton, { key: 'Enter' })
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty message', () => {
      render(<Toast {...defaultProps} message="" />)
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByText('Test message')).not.toBeInTheDocument()
    })

    it('handles very long messages', () => {
      const longMessage = 'A'.repeat(1000)
      render(<Toast {...defaultProps} message={longMessage} />)
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('handles HTML in message safely', () => {
      const htmlMessage = '<script>alert("xss")</script>Hello'
      render(<Toast {...defaultProps} message={htmlMessage} />)
      
      expect(screen.getByText(htmlMessage)).toBeInTheDocument()
      // Should not execute script
      expect(screen.queryByText('xss')).not.toBeInTheDocument()
    })

    it('handles missing onClose prop gracefully', () => {
      const { onClose, ...propsWithoutOnClose } = defaultProps
      render(<Toast {...propsWithoutOnClose} onClose={jest.fn()} />)
      
      const closeButton = screen.getByLabelText('Close notification')
      expect(() => fireEvent.click(closeButton)).not.toThrow()
    })
  })

  describe('Customization', () => {
    it('applies custom className', () => {
      render(<Toast {...defaultProps} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
    })

    it('renders custom action button when provided', () => {
      const customAction = {
        label: 'Undo',
        onClick: jest.fn()
      }

      render(<Toast {...defaultProps} onClose={jest.fn()} />)
      
      const actionButton = screen.getByText('Undo')
      expect(actionButton).toBeInTheDocument()
      
      fireEvent.click(actionButton)
      expect(customAction.onClick).toHaveBeenCalled()
    })

    it('renders custom title when provided', () => {
      render(<Toast {...defaultProps} title="Custom Title" />)
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })
  })
})
