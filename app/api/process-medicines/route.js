import { NextResponse } from 'next/server';
import { PharmeasyBot } from '../../services/pharmeasyBot';

export async function POST(request) {
  try {
    const { medicines } = await request.json();
    
    if (!medicines || !Array.isArray(medicines)) {
      return NextResponse.json(
        { error: 'Invalid medicines data' },
        { status: 400 }
      );
    }

    const bot = new PharmeasyBot();
    const initialized = await bot.init();
    
    if (!initialized) {
      throw new Error('Failed to initialize PharmEasy bot');
    }

    const results = await bot.processAllMedicines(medicines);
    
    if (!results) {
      throw new Error('Failed to process medicines');
    }

    return NextResponse.json({
      success: results.success || [],
      failed: results.failed || [],
      cartUrl: results.cartUrl,
    });
  } catch (error) {
    console.error('Error processing medicines:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process medicines',
        success: [],
        failed: [],
        cartUrl: null
      },
      { status: 500 }
    );
  }
} 