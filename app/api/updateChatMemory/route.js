import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'chatMemory.json');
    
    // Read existing memory
    const existingMemory = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    // Update memory with new data while preserving existing data
    const updatedMemory = {
      data: {
        ...existingMemory.data,
        ...data.data
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Write updated memory back to file
    await fs.writeFile(filePath, JSON.stringify(updatedMemory, null, 2));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating chat memory:', error);
    return new Response(JSON.stringify({ error: 'Failed to update chat memory' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 