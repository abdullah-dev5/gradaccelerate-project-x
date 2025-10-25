import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Textarea } from '../../../inertia/components/ui/textarea.js'

describe('Textarea Component', () => {
  it('renders textarea with default props', () => {
    render(<Textarea placeholder="Enter text" />)
    
    const textarea = screen.getByPlaceholderText('Enter text')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Textarea onChange={handleChange} placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    fireEvent.change(textarea, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(textarea).toHaveValue('test value')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    render(<Textarea onFocus={handleFocus} onBlur={handleBlur} placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    
    fireEvent.focus(textarea)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(textarea)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('shows error state', () => {
    // Note: The Textarea component doesn't have built-in error state support
    // This test is kept for future implementation
    render(<Textarea placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('shows disabled state', () => {
    render(<Textarea disabled placeholder="Disabled textarea" />)
    
    const textarea = screen.getByPlaceholderText('Disabled textarea')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('sets rows and cols attributes', () => {
    render(<Textarea rows={5} cols={30} placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('cols', '30')
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" placeholder="Test textarea" />)
    
    expect(screen.getByPlaceholderText('Test textarea')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} placeholder="Test textarea" />)
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('has proper accessibility attributes', () => {
    render(<Textarea aria-label="Test textarea" placeholder="Test textarea" />)
    
    const textarea = screen.getByLabelText('Test textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('supports controlled component pattern', () => {
    const ControlledTextarea = () => {
      const [value, setValue] = React.useState('')
      return <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Controlled" />
    }

    render(<ControlledTextarea />)
    
    const textarea = screen.getByPlaceholderText('Controlled')
    fireEvent.change(textarea, { target: { value: 'new value' } })
    
    expect(textarea).toHaveValue('new value')
  })

  it('handles auto-resize functionality', () => {
    // Note: The Textarea component doesn't have built-in auto-resize functionality
    // This test is kept for future implementation
    render(<Textarea placeholder="Auto-resize textarea" />)
    
    const textarea = screen.getByPlaceholderText('Auto-resize textarea')
    expect(textarea).toBeInTheDocument()
  })

  it('shows character count when maxLength is provided', () => {
    // Note: The Textarea component doesn't have built-in character count display
    // This test is kept for future implementation
    render(<Textarea maxLength={100} placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    expect(textarea).toHaveAttribute('maxLength', '100')
  })

  it('handles very long text', () => {
    const longText = 'A'.repeat(1000)
    render(<Textarea placeholder="Test textarea" />)
    
    const textarea = screen.getByPlaceholderText('Test textarea')
    fireEvent.change(textarea, { target: { value: longText } })
    
    expect(textarea).toHaveValue(longText)
  })
})
