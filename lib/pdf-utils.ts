interface PDFData {
  eventName: string
  qrCodeSVG: string
  uploadUrl: string
  createdAt: string
}

export async function generatePDF(data: PDFData): Promise<void> {
  // Create a new window for PDF generation
  const printWindow = window.open("", "_blank")

  if (!printWindow) {
    throw new Error("Failed to open print window")
  }

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code - ${data.eventName}</title>
        <style>
          @page {
            size: A4;
            margin: 40px;
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .header h1 {
            font-size: 32px;
            margin: 0 0 10px 0;
            color: #000;
          }
          .header p {
            font-size: 18px;
            margin: 0;
            color: #666;
          }
          .qr-container {
            border: 3px solid #000;
            padding: 30px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 40px;
          }
          .qr-container svg {
            width: 300px !important;
            height: 300px !important;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #666;
            max-width: 600px;
          }
          .footer p {
            margin: 8px 0;
            word-break: break-all;
          }
          .instructions {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            text-align: center;
          }
          .instructions h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .instructions p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.eventName}</h1>
          <p>Scan to Upload Your Photos</p>
        </div>
        
        <div class="qr-container">
          ${data.qrCodeSVG}
        </div>
        
        <div class="footer">
          <p><strong>Upload URL:</strong> ${data.uploadUrl}</p>
          <p><strong>Generated:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="instructions">
          <h3>How to Use:</h3>
          <p>1. Open your phone's camera app</p>
          <p>2. Point the camera at the QR code</p>
          <p>3. Tap the notification that appears</p>
          <p>4. Select and upload your photos</p>
        </div>
      </body>
    </html>
  `

  // Write content and trigger print/save as PDF
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      // Note: The user will need to choose "Save as PDF" in the print dialog
    }, 500)
  }
}
