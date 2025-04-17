/**
 * Export data to CSV file and trigger download
 */
export function exportToCSV(headers: string[], data: any[][], filename: string): void {
  // Create CSV content
  let csvContent = "";
  
  // Add headers
  csvContent += headers.join(",") + "\n";
  
  // Add data rows
  data.forEach(row => {
    // Format each field properly (handle commas, quotes, etc.)
    const formattedRow = row.map(field => {
      const stringField = String(field);
      // If field contains commas, quotes, or newlines, wrap in quotes
      if (/[",\n]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    });
    csvContent += formattedRow.join(",") + "\n";
  });
  
  // Create a download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  // Append to the document and trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
