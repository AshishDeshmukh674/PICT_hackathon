import { render, screen, fireEvent } from '@testing-library/react';
import Contact from '../Contact';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Contact Component', () => {
    // Reset mocks before each test
    beforeEach(() => {
        axios.post.mockReset();
    });

    // Test 1: Basic render test
    it('renders all form inputs', () => {
        render(<Contact />);
        
        expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    });

    // Test 2: Input change test for name
    it('updates name input when user types', () => {
        render(<Contact />);
        
        const nameInput = screen.getByPlaceholderText('Your Name');
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        
        expect(nameInput.value).toBe('John Doe');
    });

    // Test 3: Input change test for email
    it('updates email input when user types', () => {
        render(<Contact />);
        
        const emailInput = screen.getByPlaceholderText('Email');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        
        expect(emailInput.value).toBe('test@example.com');
    });

    // Test 4: Input change test for phone
    it('updates phone input when user types', () => {
        render(<Contact />);
        
        const phoneInput = screen.getByPlaceholderText('Phone');
        fireEvent.change(phoneInput, { target: { value: '1234567890' } });
        
        expect(phoneInput.value).toBe('1234567890');
    });

    // Test 5: Input change test for message
    it('updates message input when user types', () => {
        render(<Contact />);
        
        const messageInput = screen.getByPlaceholderText('Type your message here...');
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
        
        expect(messageInput.value).toBe('Test message');
    });

    // Test 6: Submit button exists
    it('renders submit button', () => {
        render(<Contact />);
        
        expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Test 7: Form has required fields
    it('has required attributes on necessary fields', () => {
        render(<Contact />);
        
        expect(screen.getByPlaceholderText('Your Name')).toHaveAttribute('required');
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('required');
        expect(screen.getByPlaceholderText('Phone')).toHaveAttribute('required');
        expect(screen.getByPlaceholderText('Type your message here...')).toHaveAttribute('required');
    });
}); 