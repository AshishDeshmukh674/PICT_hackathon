import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'chatMemory.json');
    const fileContent = await readFile(filePath, 'utf8');
    const memoryData = JSON.parse(fileContent);
    
    return NextResponse.json(memoryData);
  } catch (error) {
    console.error('Error reading chat memory:', error);
    return NextResponse.json(
      { 
        data: {
          UserName: null,
          Email: null,
          Time: null,
          Date: null,
          doctor: null,
          PhoneNumber: null
        },
        lastUpdated: null
      },
      { status: 200 }
    );
  }
} 