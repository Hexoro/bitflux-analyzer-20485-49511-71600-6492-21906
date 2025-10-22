/**
 * Export utilities for graphs and data
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export class ExportUtils {
  // Export as PNG
  static async exportAsPNG(element: HTMLElement, filename: string = 'export.png'): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
        }
      });
    } catch (error) {
      console.error('PNG export failed:', error);
      throw error;
    }
  }

  // Export as JPEG
  static async exportAsJPEG(element: HTMLElement, filename: string = 'export.jpg'): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('JPEG export failed:', error);
      throw error;
    }
  }

  // Export as SVG (for compatible elements)
  static exportAsSVG(element: HTMLElement, filename: string = 'export.svg'): void {
    const svg = element.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG element found');
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, filename);
  }

  // Export data as CSV
  static exportAsCSV(data: Record<string, any>[], filename: string = 'export.csv'): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  // Export data as JSON
  static exportAsJSON(data: any, filename: string = 'export.json'): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, filename);
  }

  // Export data as Excel
  static exportAsExcel(data: Record<string, any>[], filename: string = 'export.xlsx', sheetName: string = 'Data'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }

  // Export as PDF
  static async exportAsPDF(element: HTMLElement, filename: string = 'export.pdf'): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }

  // Export comprehensive report as PDF
  static async exportReportPDF(
    elements: { title: string; element: HTMLElement }[],
    filename: string = 'report.pdf'
  ): Promise<void> {
    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Add title
        pdf.setFontSize(16);
        pdf.text(elements[i].title, 10, 15);

        // Add element as image
        const canvas = await html2canvas(elements[i].element, {
          backgroundColor: '#ffffff',
          scale: 2,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, Math.min(imgHeight, pageHeight - 35));
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Report PDF export failed:', error);
      throw error;
    }
  }

  // Export as HTML report
  static exportAsHTML(
    title: string,
    content: string,
    filename: string = 'report.html'
  ): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .metric {
      margin: 15px 0;
      padding: 10px;
      background: #f8f9fa;
      border-left: 3px solid #007bff;
    }
    .metric-name {
      font-weight: bold;
      color: #555;
    }
    .metric-value {
      font-size: 1.2em;
      color: #007bff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${content}
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, filename);
  }

  // Export as Markdown
  static exportAsMarkdown(
    title: string,
    metrics: Record<string, any>,
    filename: string = 'report.md'
  ): void {
    let markdown = `# ${title}\n\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `## Metrics\n\n`;

    Object.entries(metrics).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      
      if (typeof value === 'number') {
        markdown += `- **${capitalizedKey}**: ${value.toFixed(4)}\n`;
      } else {
        markdown += `- **${capitalizedKey}**: ${value}\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    saveAs(blob, filename);
  }
}
