import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req) {
    try {
        const { messages } = await req.json();
        
        const dietPlanContent = messages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.content)
            .join('\n');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Your Personalized Diet Plan</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                    }
                    h2 {
                        color: #2d3748;
                        font-size: 20px;
                        font-weight: bold;
                        margin-top: 40px;
                        margin-bottom: 20px;
                    }
                    .meal-item {
                        margin: 15px 0;
                        display: flex;
                        align-items: baseline;
                    }
                    .number {
                        min-width: 20px;
                        margin-right: 8px;
                    }
                    .content {
                        flex: 1;
                    }
                    .section {
                        background: #f8fafc;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    .bullet-list {
                        padding-left: 20px;
                    }
                    .bullet-item {
                        position: relative;
                        padding-left: 15px;
                        margin: 8px 0;
                    }
                    .bullet-item:before {
                        content: "•";
                        position: absolute;
                        left: 0;
                    }
                    .supplements {
                        background: #f0fff4;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 30px;
                    }
                </style>
            </head>
            <body>
                ${dietPlanContent
                    // Remove initial messages
                    .replace(/Hello!.*?adult:/, '')
                    .replace(/What else.*$/, '')
                    
                    // Format section headers
                    .replace(/(Daily Meal Breakdown|Portion Sizes|Caloric Content|Nutritional Values|Recommended Supplements)/g, 
                        '<h2>$1</h2>')
                    
                    // Format numbered items
                    .replace(/(\d+)\.\s*(.*?)(?=\n|$)/g, 
                        '<div class="meal-item"><span class="number">$1.</span><span class="content">$2</span></div>')
                    
                    // Format bullet points
                    .replace(/•\s*(.*?)(?=\n|$)/g, 
                        '<div class="bullet-item">$1</div>')
                    
                    // Format sections
                    .replace(/(Caloric Content[\s\S]*?(?=\n\n|$))/g, 
                        '<div class="section">$1</div>')
                    
                    // Format nutritional values
                    .replace(/(Nutritional Values[\s\S]*?(?=\n\n|$))/g, 
                        '<div class="section">$1</div>')
                    
                    // Format supplements
                    .replace(/(Recommended Supplements[\s\S]*?(?=\n\n|$))/g, 
                        '<div class="supplements">$1</div>')
                }
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            headless: 'new'
        });
        const page = await browser.newPage();

        await page.setContent(htmlContent);
        const pdf = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true
        });

        await browser.close();

        return new NextResponse(pdf, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=diet-plan.pdf'
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json(
            { error: 'Error generating PDF: ' + error.message },
            { status: 500 }
        );
    }
} 