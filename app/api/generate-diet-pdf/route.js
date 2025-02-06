import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function POST(req) {
  try {
    const data = await req.json();
    const { dietPlan, userInfo } = data;

    // Create a PDF document
    const doc = new PDFDocument();
    let buffers = [];

    // Collect PDF data chunks
    doc.on('data', buffer => buffers.push(buffer));

    // Write PDF content
    doc
      .fontSize(20)
      .text('Your Personalized Diet Plan', { align: 'center' })
      .moveDown();

    // Add user information
    doc
      .fontSize(14)
      .text('Personal Information:', { underline: true })
      .moveDown(0.5);
    
    if (userInfo) {
      doc
        .fontSize(12)
        .text(`Name: ${userInfo.name || 'Not provided'}`)
        .text(`Age: ${userInfo.age || 'Not provided'}`)
        .text(`Height: ${userInfo.height || 'Not provided'}`)
        .text(`Weight: ${userInfo.weight || 'Not provided'}`)
        .text(`Health Goals: ${userInfo.goals || 'Not provided'}`)
        .moveDown();
    }

    // Add diet plan
    doc
      .fontSize(14)
      .text('Diet Recommendations:', { underline: true })
      .moveDown(0.5);

    if (dietPlan) {
      doc.fontSize(12);
      
      // Format and add diet plan content
      if (typeof dietPlan === 'string') {
        doc.text(dietPlan);
      } else if (Array.isArray(dietPlan)) {
        dietPlan.forEach(item => {
          doc.text(item).moveDown(0.5);
        });
      } else if (typeof dietPlan === 'object') {
        Object.entries(dietPlan).forEach(([key, value]) => {
          doc.text(`${key}:`).moveDown(0.2);
          doc.text(value).moveDown(0.5);
        });
      }
    }

    // Add footer
    doc
      .moveDown()
      .fontSize(10)
      .text('This diet plan is generated based on the information provided. Please consult with a healthcare professional before starting any new diet regime.', {
        align: 'center',
        color: 'gray'
      });

    // Finalize PDF
    doc.end();

    // Combine PDF buffers
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=diet-plan.pdf'
          }
        }));
      });
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 