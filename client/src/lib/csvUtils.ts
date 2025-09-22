// CSV export utility functions

export function convertToCSV<T extends Record<string, any>>(
  data: T[], 
  headers: Array<{ key: keyof T; label: string }>
): string {
  if (data.length === 0) return '';

  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }
      
      // Convert dates to readable format
      if (Object.prototype.toString.call(value) === '[object Date]' || 
          (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(Date.parse(value)))) {
        const date = new Date(value);
        return `"${date.toLocaleDateString()}"`;
      }
      
      // Sanitize for CSV injection and escape quotes
      let stringValue = String(value);
      
      // Prevent CSV injection by prefixing dangerous characters with a space
      if (stringValue.length > 0 && /^[=+\-@]/.test(stringValue)) {
        stringValue = ' ' + stringValue;
      }
      
      // Escape quotes and wrap in quotes
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
}

export const contactExportHeaders = [
  { key: 'firstName' as const, label: 'First Name' },
  { key: 'lastName' as const, label: 'Last Name' },
  { key: 'email' as const, label: 'Email' },
  { key: 'phone' as const, label: 'Phone' },
  { key: 'title' as const, label: 'Title' },
  { key: 'companyName' as const, label: 'Company' },
  { key: 'createdAt' as const, label: 'Created Date' },
] as const;

export const dealExportHeaders = [
  { key: 'title' as const, label: 'Deal Title' },
  { key: 'description' as const, label: 'Description' },
  { key: 'value' as const, label: 'Value' },
  { key: 'stage' as const, label: 'Stage' },
  { key: 'contactName' as const, label: 'Contact' },
  { key: 'companyName' as const, label: 'Company' },
  { key: 'createdAt' as const, label: 'Created Date' },
  { key: 'expectedCloseDate' as const, label: 'Expected Close Date' },
] as const;