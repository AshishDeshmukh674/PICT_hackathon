import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req) {
    try {
        const { messages } = await req.json();
        
        const dietPlanContent = messages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.content)
            .join('\n')
            // Clean up the content by removing stars and extra spaces
            .replace(/\*\*/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Your Personalized Diet Plan</title>
                <style>
                    body {
                        font-family: 'Helvetica', 'Arial', sans-serif;
                        line-height: 1.8;
                        color: #2d3748;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                        background-color: #ffffff;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e2e8f0;
                    }

                    .header h1 {
                        color: #1a365d;
                        font-size: 28px;
                        margin-bottom: 10px;
                    }

                    h2 {
                        color: #1a365d;
                        font-size: 22px;
                        font-weight: bold;
                        margin-top: 40px;
                        margin-bottom: 20px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #e2e8f0;
                    }

                    .meal-item {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                        display: flex;
                        align-items: baseline;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }

                    .number {
                        min-width: 30px;
                        margin-right: 12px;
                        color: #4a5568;
                        font-weight: bold;
                    }

                    .content {
                        flex: 1;
                    }

                    .section {
                        background: #f8fafc;
                        padding: 25px;
                        margin: 25px 0;
                        border-radius: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }

                    .portion-sizes {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }

                    .portion-item {
                        background: #fff;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }

                    .nutritional-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-top: 20px;
                    }

                    .nutritional-item {
                        background: #fff;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }

                    .supplements-list {
                        list-style: none;
                        padding: 0;
                        margin: 20px 0;
                    }

                    .supplement-item {
                        background: #f0fff4;
                        margin: 10px 0;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }

                    .highlight {
                        background: #ebf8ff;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-weight: 500;
                    }

                    .disclaimer {
                        margin-top: 40px;
                        padding: 20px;
                        background: #fff8dc;
                        border-radius: 8px;
                        font-size: 0.9em;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Personalized Diet Plan</h1>
                    <p>Your guide to balanced nutrition</p>
                </div>

                ${dietPlanContent
                    // Split content into sections and format each section
                    .split(/(?=Daily Meal Breakdown|Portion Sizes|Caloric Content|Nutritional Values|Recommended Supplements)/)
                    .map(section => {
                        if (section.includes('Daily Meal Breakdown')) {
                            return `
                                <h2>Daily Meal Breakdown</h2>
                                ${section
                                    .replace(/Daily Meal Breakdown/, '')
                                    .split(/(?=\d\.)/)
                                    .filter(Boolean)
                                    .map(meal => `
                                        <div class="meal-item">
                                            <span class="number">${meal.match(/^\d\./)?.[0] || ''}</span>
                                            <span class="content">${meal.replace(/^\d\./, '').trim()}</span>
                                        </div>
                                    `).join('')}
                            `;
                        }
                        else if (section.includes('Portion Sizes')) {
                            return `
                                <h2>Portion Sizes</h2>
                                <div class="portion-sizes">
                                    ${section
                                        .replace(/Portion Sizes/, '')
                                        .split(/-\s+/)
                                        .filter(Boolean)
                                        .map(portion => `
                                            <div class="portion-item">${portion.trim()}</div>
                                        `).join('')}
                                </div>
                            `;
                        }
                        else if (section.includes('Nutritional Values')) {
                            return `
                                <h2>Nutritional Values</h2>
                                <div class="nutritional-grid">
                                    ${section
                                        .replace(/Nutritional Values/, '')
                                        .split(/-\s+/)
                                        .filter(Boolean)
                                        .map(value => `
                                            <div class="nutritional-item">${value.trim()}</div>
                                        `).join('')}
                                </div>
                            `;
                        }
                        else if (section.includes('Recommended Supplements')) {
                            return `
                                <h2>Recommended Supplements</h2>
                                <ul class="supplements-list">
                                    ${section
                                        .replace(/Recommended Supplements/, '')
                                        .split(/\d\./)
                                        .filter(Boolean)
                                        .map(supplement => `
                                            <li class="supplement-item">${supplement.trim()}</li>
                                        `).join('')}
                                </ul>
                            `;
                        }
                        else if (section.includes('Caloric Content')) {
                            return `
                                <h2>Caloric Content</h2>
                                <div class="section">
                                    ${section.replace(/Caloric Content/, '').trim()}
                                </div>
                            `;
                        }
                        return section;
                    }).join('')}

                <div class="disclaimer">
                    Please consult with your healthcare provider before starting any new diet or supplement plan.
                </div>
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