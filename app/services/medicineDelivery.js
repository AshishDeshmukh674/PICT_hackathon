'use client';

export class MedicineDeliveryService {
  static async processPrescriptionOnPharmeasy(medicines) {
    try {
      const response = await fetch('/api/process-medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicines }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process medicines');
      }

      // Transform the response to match the expected format
      return {
        status: result.success?.length > 0 ? 'completed' : 'error',
        progress: 100,
        cartUrl: result.cartUrl,
        errors: result.failed?.map(name => `Failed to add ${name} to cart`) || []
      };
    } catch (error) {
      console.error('Error processing medicines:', error);
      return {
        status: 'error',
        progress: 0,
        cartUrl: null,
        errors: [error.message || 'Failed to process order']
      };
    }
  }
} 