import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";

interface CsvImportProps {
  endpoint: string;
  onSuccess: () => void;
  sampleHeaders: string[];
}

export default function CsvImport({ endpoint, onSuccess, sampleHeaders }: CsvImportProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: (result: any) => {
      const count = Array.isArray(result) ? result.length : 0;
      toast({
        title: "Success",
        description: `Successfully imported ${count} records`,
      });
      setImportResults({
        success: count,
        errors: [],
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive",
      });
      setImportResults({
        success: 0,
        errors: [error.message],
      });
    },
  });

  const parseCsv = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const record: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          record[header] = values[index];
        }
      });

      // Only add records with required fields
      if (record.firstName && record.lastName) {
        data.push(record);
      }
    }

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportResults(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = parseCsv(text);
      
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No valid records found in the CSV file",
          variant: "destructive",
        });
        return;
      }

      await importMutation.mutateAsync(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = [
      sampleHeaders.join(','),
      'John,Doe,john@example.com,555-1234,Manager',
      'Jane,Smith,jane@example.com,555-5678,Director',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="csvFile">Select CSV File</Label>
        <Input
          id="csvFile"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-1"
          data-testid="input-csv-file"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Only CSV files are supported. Maximum file size: 5MB
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">CSV Format Requirements</h4>
              <p className="text-sm text-muted-foreground">
                Your CSV should include these columns: {sampleHeaders.join(', ')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSample}
              data-testid="button-download-sample"
            >
              <Download className="w-4 h-4 mr-2" />
              Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isLoading}
                data-testid="button-import-csv"
              >
                {isLoading ? (
                  "Importing..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importResults && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {importResults.success > 0 && (
                <div className="flex items-center space-x-2 text-chart-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Successfully imported {importResults.success} records
                  </span>
                </div>
              )}
              
              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Errors encountered:</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
