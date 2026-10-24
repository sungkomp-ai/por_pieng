export function exportToWord(elementId: string, filename: string, title: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1c1917; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th, td { border: 1px solid #64748b; padding: 6px 8px; font-size: 10pt; text-align: left; vertical-align: top; }
        th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
        h1, h2, h3, h4 { color: #15803d; font-family: 'Sarabun', Arial, sans-serif; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bg-amber-50 { background-color: #fffbeb; }
        .bg-stone-50 { background-color: #fafaf9; }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(elementId: string, filename: string, onDone?: () => void) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Check if html2pdf is available on window
  const win = window as any;
  if (win.html2pdf) {
    const opt = {
      margin: 8,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    win.html2pdf().set(opt).from(element).save().then(() => {
      if (onDone) onDone();
    }).catch(() => {
      window.print();
      if (onDone) onDone();
    });
  } else {
    // Fallback to native print dialog which allows "Save as PDF"
    window.print();
    if (onDone) onDone();
  }
}

export function exportToJsonFile(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
