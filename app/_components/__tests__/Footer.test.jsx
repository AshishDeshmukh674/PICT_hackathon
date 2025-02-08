import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer Component', () => {
  // Test 1: Basic rendering
  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  // Test 2: Logo presence (modified to only check presence)
  it('displays the company logo', () => {
    render(<Footer />);
    const logo = screen.getByAltText('logo');
    expect(logo).toBeInTheDocument();
  });

  // Test 3: Company name
  it('displays the company name', () => {
    render(<Footer />);
    expect(screen.getByText('Ratnamukund HealthCare Foundation')).toBeInTheDocument();
  });

  // Test 4: Mission statement
  it('displays the mission statement', () => {
    render(<Footer />);
    expect(screen.getByText(/At our hospital, we believe that exceptional care/)).toBeInTheDocument();
  });

  // Test 5: Navigation links
  it('renders all navigation links', () => {
    render(<Footer />);
    const links = ['About', 'Careers', 'History', 'Services', 'Projects', 'Blog'];
    links.forEach(link => {
      expect(screen.getByText(link)).toBeInTheDocument();
    });
  });

  // Test 6: Social media links
  it('renders all social media links', () => {
    render(<Footer />);
    const socialPlatforms = ['Facebook', 'Instagram', 'Twitter', 'GitHub', 'Dribbble'];
    socialPlatforms.forEach(platform => {
      expect(screen.getByText(platform, { selector: 'span' })).toBeInTheDocument();
    });
  });

  // Test 7: Basic link presence
  it('has navigation links', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
}); 