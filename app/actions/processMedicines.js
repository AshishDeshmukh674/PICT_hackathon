'use server'

import { PharmeasyBot } from '../services/pharmeasyBot';

export async function processMedicines(medicines) {
  const bot = new PharmeasyBot();
  return await bot.processAllMedicines(medicines);
} 