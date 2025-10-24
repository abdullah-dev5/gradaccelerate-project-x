import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../../../inertia/components/ui/select'

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  it('renders select with options', () => {
    render(<Select options={options} placeholder="Choose an option" />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Choose an option')).toBeInTheDocument()
  })

  it('handles selection changes', () => {
    const handleChange = jest.fn()
    render(<Select options={options} onChange={handleChange} placeholder="Choose an option" />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option2' } })
    
    expect(handleChange).toHaveBeenCalledWith('option2')
  })

  it('shows selected value', () => {
    render(<Select options={options} value="option2" placeholder="Choose an option" />)
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('option2')
  })

  it('shows disabled state', () => {
    render(<Select options={options} disabled placeholder="Disabled select" />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
    expect(select).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('shows error state', () => {
    render(<Select options={options} error="This field is required" placeholder="Test select" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500')
  })

  it('renders with multiple selection', () => {
    render(<Select options={options} multiple placeholder="Choose multiple options" />)
    
    const select = screen.getByRole('listbox')
    expect(select).toBeInTheDocument()
  })

  it('handles multiple selection changes', () => {
    const handleChange = jest.fn()
    render(<Select options={options} multiple onChange={handleChange} placeholder="Choose multiple" />)
    
    const select = screen.getByRole('listbox')
    fireEvent.change(select, { target: { selectedOptions: [{ value: 'option1' }, { value: 'option2' }] } })
    
    expect(handleChange).toHaveBeenCalledWith(['option1', 'option2'])
  })

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" placeholder="Test select" />)
    
    expect(screen.getByRole('combobox')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>()
    render(<Select ref={ref} options={options} placeholder="Test select" />)
    
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('has proper accessibility attributes', () => {
    render(<Select options={options} aria-label="Test select" placeholder="Test select" />)
    
    const select = screen.getByLabelText('Test select')
    expect(select).toBeInTheDocument()
  })

  it('renders with grouped options', () => {
    const groupedOptions = [
      { group: 'Group 1', options: [{ value: 'g1o1', label: 'Group 1 Option 1' }] },
      { group: 'Group 2', options: [{ value: 'g2o1', label: 'Group 2 Option 1' }] }
    ]

    render(<Select options={groupedOptions} placeholder="Choose from groups" />)
    
    expect(screen.getByText('Group 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2')).toBeInTheDocument()
    expect(screen.getByText('Group 1 Option 1')).toBeInTheDocument()
    expect(screen.getByText('Group 2 Option 1')).toBeInTheDocument()
  })

  it('supports controlled component pattern', () => {
    const ControlledSelect = () => {
      const [value, setValue] = React.useState('')
      return <Select options={options} value={value} onChange={setValue} placeholder="Controlled" />
    }

    render(<ControlledSelect />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'option1' } })
    
    expect(select).toHaveValue('option1')
  })
})
