import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs', () => ({
  useKindeBrowserClient: jest.fn(),
  LoginLink: () => <div>Login Link</div>,
  LogoutLink: () => <div>Logout Link</div>
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}));

describe('Header Component', () => {
  // Test 1: Basic render test
  it('renders the logo and navigation links', () => {
    useKindeBrowserClient.mockReturnValue({ user: null });
    render(<Header />);
    
    // Check if logo is present
    expect(screen.getByAltText('logo')).toBeInTheDocument();
    
    // Check if navigation links are present
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  // Test 2: Login button for non-authenticated users
  it('shows login button when user is not authenticated', () => {
    useKindeBrowserClient.mockReturnValue({ user: null });
    render(<Header />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  // Test 3: Doctor logout functionality
  it('handles doctor logout correctly', () => {
    useKindeBrowserClient.mockReturnValue({ user: null });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => 'someDoctor'),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    render(<Header />);
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('loggedDoctor');
  });

  // Test 5: Navigation links functionality
  it('renders navigation links with correct paths', () => {
    useKindeBrowserClient.mockReturnValue({ user: null });
    render(<Header />);
    
    const homeLink = screen.getByText('Home').closest('a');
    const exploreLink = screen.getByText('Explore').closest('a');
    const contactLink = screen.getByText('Contact').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(exploreLink).toHaveAttribute('href', '/#category-search');
    expect(contactLink).toHaveAttribute('href', '/#Contact-us');
  });
}); 