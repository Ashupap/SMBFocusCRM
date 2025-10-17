import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, FileSpreadsheet, FileText, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CONTACT_FIELDS = [
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: true },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'title', label: 'Title', required: false },
  { value: 'company', label: 'Company', required: false },
];

const COMPANY_FIELDS = [
  { value: 'name', label: 'Company Name', required: true },
  { value: 'industry', label: 'Industry', required: false },
  { value: 'website', label: 'Website', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'address', label: 'Address', required: false },
];

const DEAL_FIELDS = [
  { value: 'title', label: 'Deal Title', required: true },
  { value: 'value', label: 'Value', required: true },
  { value: 'stage', label: 'Stage', required: true },
  { value: 'probability', label: 'Probability', required: false },
  { value: 'description', label: 'Description', required: false },
];

export default function ImportExport() {
  const { toast } = useToast();
  const [importType, setImportType] = useState<'contacts' | 'companies' | 'deals'>('contacts');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const parseFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/parse', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setParsedData(data);
      toast({
        title: 'File parsed',
        description: `Found ${data.totalRows} rows`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const endpoint = `/api/import/${importType}`;
      return await apiRequest('POST', endpoint, {
        data: parsedData.data,
        mapping,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${importType}`] });
      toast({
        title: 'Import successful',
        description: `Imported ${data.imported} ${importType}`,
      });
      resetImport();
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFileMutation.mutate(selectedFile);
    }
  };

  const handleExport = async (type: string, format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/export/${type}/${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Downloaded ${type}.${format === 'excel' ? 'xlsx' : 'csv'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData(null);
    setMapping({});
  };

  const getFieldsForType = () => {
    switch (importType) {
      case 'contacts': return CONTACT_FIELDS;
      case 'companies': return COMPANY_FIELDS;
      case 'deals': return DEAL_FIELDS;
    }
  };

  const isMappingComplete = () => {
    const fields = getFieldsForType();
    return fields.filter(f => f.required).every(f => mapping[f.value]);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import / Export</h1>
          <p className="text-muted-foreground">
            Import data from CSV or Excel files, or export your existing data
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList>
            <TabsTrigger value="import" data-testid="tab-import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" data-testid="tab-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file to import your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Import Type</label>
                  <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
                    <SelectTrigger data-testid="select-import-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="companies">Companies</SelectItem>
                      <SelectItem value="deals">Deals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Upload File</label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    data-testid="input-file-upload"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepts CSV and Excel (.xlsx) files, up to 10MB
                  </p>
                </div>

                {parsedData && (
                  <>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-3">Column Mapping</h4>
                      <div className="space-y-3">
                        {getFieldsForType().map((field) => (
                          <div key={field.value} className="flex items-center gap-4">
                            <div className="w-40">
                              <span className="text-sm font-medium">{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                              )}
                            </div>
                            <Select
                              value={mapping[field.value] || ''}
                              onValueChange={(v) => setMapping({ ...mapping, [field.value]: v })}
                            >
                              <SelectTrigger data-testid={`select-map-${field.value}`}>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {parsedData.headers.map((header: string) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Preview ({parsedData.preview.length} of {parsedData.totalRows} rows)</h4>
                      <div className="border rounded-lg overflow-auto max-h-80">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {parsedData.headers.map((header: string) => (
                                <TableHead key={header}>{header}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedData.preview.map((row: any, idx: number) => (
                              <TableRow key={idx}>
                                {parsedData.headers.map((header: string) => (
                                  <TableCell key={header}>{row[header]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={resetImport} variant="outline" data-testid="button-cancel-import">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => importMutation.mutate()}
                        disabled={!isMappingComplete() || importMutation.isPending}
                        data-testid="button-import"
                      >
                        {importMutation.isPending ? (
                          'Importing...'
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Import {parsedData.totalRows} {importType}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contacts
                  </CardTitle>
                  <CardDescription>Export all your contacts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleExport('contacts', 'csv')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-export-contacts-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('contacts', 'excel')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-export-contacts-excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Companies
                  </CardTitle>
                  <CardDescription>Export all your companies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleExport('companies', 'csv')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-export-companies-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Deals
                  </CardTitle>
                  <CardDescription>Export all your deals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleExport('deals', 'csv')}
                    variant="outline"
                    className="w-full"
                    data-testid="button-export-deals-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
