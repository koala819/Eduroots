import { fireEvent, render, screen } from '@testing-library/react'

import TogglePasswordVisibility from '@/client/components/atoms/TogglePasswordVisibility'

const mockProps = {
  showPwd: false,
  setShowPwd: jest.fn(),
}

describe('TogglePasswordVisibility Component', () => {
  it('renders EyeOff icon when showPwd is false', () => {
    render(<TogglePasswordVisibility {...mockProps} showPwd={false} />)

    const eyeOffIcon = screen.getByTestId('toggle-icon')
    expect(eyeOffIcon).toBeInTheDocument()
    expect(eyeOffIcon).toHaveClass('lucide-eye-off')
  })

  it('renders Eye icon when showPwd is true', () => {
    render(<TogglePasswordVisibility {...mockProps} showPwd={true} />)

    const eyeIcon = screen.getByTestId('toggle-icon')
    expect(eyeIcon).toBeInTheDocument()
    expect(eyeIcon).toHaveClass('lucide-eye')
  })

  it('toggles the icon when clicked', () => {
    render(<TogglePasswordVisibility {...mockProps} showPwd={false} />)

    const eyeOffIcon = screen.getByTestId('toggle-icon')
    fireEvent.click(eyeOffIcon)

    expect(mockProps.setShowPwd).toHaveBeenCalledWith(expect.any(Function))
    expect(mockProps.setShowPwd).toHaveBeenCalledTimes(1)
  })
})
