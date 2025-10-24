import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../../../inertia/components/ui/input'

describe('Input Component', () => {
  it('renders input with default props', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('renders with different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" placeholder="Number" />)
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')
  })

  it('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} placeholder="Test input" />)
    
    const input = screen.getByPlaceholderText('Test input')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('test value')
  })

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    render(<Input onFocus={handleFocus} onBlur={handleBlur} placeholder="Test input" />)
    
    const input = screen.getByPlaceholderText('Test input')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('shows error state', () => {
    render(<Input error="This field is required" placeholder="Test input" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Test input')).toHaveClass('border-red-500')
  })

  it('shows disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Test input" />)
    
    expect(screen.getByPlaceholderText('Test input')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Test input" />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('has proper accessibility attributes', () => {
    render(<Input aria-label="Test input" placeholder="Test input" />)
    
    const input = screen.getByLabelText('Test input')
    expect(input).toBeInTheDocument()
  })

  it('supports controlled component pattern', () => {
    const ControlledInput = () => {
      const [value, setValue] = React.useState('')
      return <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Controlled" />
    }

    render(<ControlledInput />)
    
    const input = screen.getByPlaceholderText('Controlled')
    fireEvent.change(input, { target: { value: 'new value' } })
    
    expect(input).toHaveValue('new value')
  })
})
