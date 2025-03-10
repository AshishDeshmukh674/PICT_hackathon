import puppeteer from 'puppeteer';

export class PharmeasyBot {
  constructor() {
    if (typeof window !== 'undefined') {
      throw new Error('PharmeasyBot can only be instantiated server-side');
    }
    this.baseUrl = 'https://pharmeasy.in';
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      });
      
      this.page = await this.browser.newPage();
      
      // Add stealth settings
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      });

      // Block unnecessary resources
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const blockedResources = ['image', 'media', 'font', 'stylesheet'];
        const blockedDomains = ['google-analytics', 'doubleclick', 'facebook', 'analytics'];
        
        if (blockedResources.includes(request.resourceType()) || 
            blockedDomains.some(domain => request.url().includes(domain))) {
          request.abort();
        } else {
          request.continue();
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      if (this.browser) await this.browser.close();
      return false;
    }
  }

  async searchMedicine(medicine) {
    try {
      // Try multiple URL patterns
      const urlPatterns = [
        // Direct product URL pattern
        `${this.baseUrl}/online-medicine-order/${medicine.name.toLowerCase().replace(/\s+/g, '-')}`,
        // Search URL pattern
        `${this.baseUrl}/search/all?name=${encodeURIComponent(medicine.name)}`,
        // Alternative product URL pattern
        `${this.baseUrl}/medicine/${medicine.name.toLowerCase().replace(/\s+/g, '-')}`
      ];

      let product = null;

      for (const url of urlPatterns) {
        try {
          await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });

          // Wait for either product details or search results
          await Promise.race([
            this.page.waitForSelector('[data-qa="product-name"]', { timeout: 5000 }),
            this.page.waitForSelector('[data-qa="product-card"]', { timeout: 5000 }),
            this.page.waitForSelector('[class*="ProductCard"]', { timeout: 5000 }),
            this.page.waitForSelector('[class*="medicine-box"]', { timeout: 5000 })
          ]).catch(() => {});

          // Check if we're on a product page
          product = await this.extractProductInfo(medicine);
          
          if (product) break;
        } catch (error) {
          console.log(`Failed attempt with URL ${url}:`, error.message);
          continue;
        }
      }

      return product;
    } catch (error) {
      console.error(`Error searching for ${medicine.name}:`, error);
      return null;
    }
  }

  async extractProductInfo(medicine) {
    try {
      return await this.page.evaluate((targetMedicine) => {
        // Helper function to extract price
        const extractPrice = (text) => {
          const match = text.match(/₹?(\d+(?:\.\d{1,2})?)/);
          return match ? parseFloat(match[1]) : null;
        };

        // Helper function to extract strength
        const extractStrength = (text) => {
          const match = text.match(/(\d+(?:\.\d+)?)\s*(?:mg|ml|g)/i);
          return match ? match[0] : '';
        };

        // Try different selectors for product information
        const selectors = {
          name: [
            '[data-qa="product-name"]',
            '[class*="ProductCard_medicineName"]',
            '[class*="medicine-box"] h1',
            'h1[class*="ProductTitle"]'
          ],
          price: [
            '[data-qa="product-price"]',
            '[class*="ProductCard_mrpText"]',
            '[class*="PriceInfo_ourPrice"]',
            'span[class*="price"]'
          ],
          description: [
            '[data-qa="product-description"]',
            '[class*="ProductCard_medicineDesc"]',
            '[class*="ProductDescription"]'
          ]
        };

        // Function to try multiple selectors
        const getElementText = (selectorList) => {
          for (const selector of selectorList) {
            const element = document.querySelector(selector);
            if (element) return element.textContent.trim();
          }
          return null;
        };

        const name = getElementText(selectors.name);
        const priceText = getElementText(selectors.price);
        const description = getElementText(selectors.description);

        if (!name || !priceText) return null;

        const price = extractPrice(priceText);
        const strength = extractStrength(description || name);

        // Check if strength matches if specified
        if (targetMedicine.strength && strength) {
          const targetStr = targetMedicine.strength.toLowerCase().replace(/\s+/g, '');
          const foundStr = strength.toLowerCase().replace(/\s+/g, '');
          if (targetStr !== foundStr) return null;
        }

        return {
          name,
          price,
          strength,
          url: window.location.href
        };
      }, medicine);
    } catch (error) {
      console.error('Error extracting product info:', error);
      return null;
    }
  }

  async processAllMedicines(medicines) {
    const results = {
      success: [],
      failed: [],
      cartUrl: null,
      prices: {}
    };

    try {
      const initialized = await this.init();
      if (!initialized) throw new Error('Failed to initialize bot');

      for (const medicine of medicines) {
        try {
          const product = await this.searchMedicine(medicine);
          
          if (product) {
            results.prices[medicine.name] = product.price;
            results.success.push({
              name: medicine.name,
              price: product.price,
              url: product.url
            });
          } else {
            results.failed.push(medicine.name);
          }

          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error processing ${medicine.name}:`, error);
          results.failed.push(medicine.name);
        }
      }

      // Set cart URL if any medicines were found
      if (results.success.length > 0) {
        results.cartUrl = `${this.baseUrl}/cart`;
      }

    } catch (error) {
      console.error('Error processing medicines:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }

    return results;
  }
} 