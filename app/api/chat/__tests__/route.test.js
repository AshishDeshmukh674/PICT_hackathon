const { POST, OPTIONS } = require('../route');
const Groq = require('groq-sdk');

// Mock Groq SDK
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      }
    }
  }));
});

describe('Chat API Tests', () => {
  // Test 1: Simple valid request
  test('processes a simple chat message', async () => {
    const mockRequest = {
      json: () => Promise.resolve({
        chatHistory: [{ role: 'user', content: 'Hello' }],
        language: 'en'
      })
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe('Test response');
  });

  // Test 2: Booking detection
  test('detects booking related queries', async () => {
    const mockRequest = {
      json: () => Promise.resolve({
        chatHistory: [{ role: 'user', content: 'I want to book an appointment' }],
        language: 'en'
      })
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.metadata.isBookingQuery).toBe(true);
  });

  // Test 3: Language fallback
  test('defaults to English when no language specified', async () => {
    const mockRequest = {
      json: () => Promise.resolve({
        chatHistory: [{ role: 'user', content: 'Hello' }]
      })
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.metadata.language).toBe('en');
  });

  // Test 4: Error handling
  test('handles invalid chat history', async () => {
    const mockRequest = {
      json: () => Promise.resolve({
        chatHistory: 'invalid',
        language: 'en'
      })
    };

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.message).toBe('Invalid chat history format');
  });

  // Test 5: OPTIONS request
  test('handles OPTIONS request', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
  });
}); 