import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { storage } from './storage';
import { authenticateToken } from './authMiddleware';
import { insertContactSchema, insertCompanySchema, insertDealSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Parse uploaded file (CSV or Excel)
router.post('/api/import/parse', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    let data: any[] = [];

    // Parse based on file type
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      // Parse CSV
      const csvText = file.buffer.toString('utf-8');
      const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      data = result.data;
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')
    ) {
      // Parse Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload CSV or Excel (.xlsx)' });
    }

    // Extract column headers
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    res.json({
      headers,
      preview: data.slice(0, 10), // First 10 rows for preview
      totalRows: data.length,
      data, // Send full data for processing
    });
  } catch (error: any) {
    console.error('Error parsing file:', error);
    res.status(500).json({ error: error.message || 'Failed to parse file' });
  }
});

// Import contacts with mapping
router.post('/api/import/contacts', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const { data, mapping } = req.body;

    // Map imported data to contact schema
    const contactsData = data.map((row: any) => {
      const mappedContact: any = {
        ownerId: userId,
      };

      // Apply field mapping
      Object.entries(mapping).forEach(([schemaField, fileColumn]) => {
        if (fileColumn && row[fileColumn as string] !== undefined) {
          mappedContact[schemaField] = row[fileColumn as string];
        }
      });

      return mappedContact;
    });

    // Validate all contacts
    const validatedContacts = z.array(insertContactSchema).parse(contactsData);

    // Import contacts
    const contacts = await storage.importContacts(validatedContacts);

    res.json({
      success: true,
      imported: contacts.length,
      contacts,
    });
  } catch (error: any) {
    console.error('Error importing contacts:', error);
    res.status(500).json({ error: error.message || 'Failed to import contacts' });
  }
});

// Import companies with mapping
router.post('/api/import/companies', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const { data, mapping } = req.body;

    const companiesData = data.map((row: any) => {
      const mappedCompany: any = {
        ownerId: userId,
      };

      Object.entries(mapping).forEach(([schemaField, fileColumn]) => {
        if (fileColumn && row[fileColumn as string] !== undefined) {
          mappedCompany[schemaField] = row[fileColumn as string];
        }
      });

      return mappedCompany;
    });

    const validatedCompanies = z.array(insertCompanySchema).parse(companiesData);
    const companies = await Promise.all(
      validatedCompanies.map(company => storage.createCompany(company))
    );

    res.json({
      success: true,
      imported: companies.length,
      companies,
    });
  } catch (error: any) {
    console.error('Error importing companies:', error);
    res.status(500).json({ error: error.message || 'Failed to import companies' });
  }
});

// Import deals with mapping
router.post('/api/import/deals', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const { data, mapping } = req.body;

    const dealsData = data.map((row: any) => {
      const mappedDeal: any = {
        ownerId: userId,
      };

      Object.entries(mapping).forEach(([schemaField, fileColumn]) => {
        if (fileColumn && row[fileColumn as string] !== undefined) {
          mappedDeal[schemaField] = row[fileColumn as string];
        }
      });

      return mappedDeal;
    });

    const validatedDeals = z.array(insertDealSchema).parse(dealsData);
    const deals = await Promise.all(
      validatedDeals.map(deal => storage.createDeal(deal))
    );

    res.json({
      success: true,
      imported: deals.length,
      deals,
    });
  } catch (error: any) {
    console.error('Error importing deals:', error);
    res.status(500).json({ error: error.message || 'Failed to import deals' });
  }
});

// Export contacts to CSV
router.get('/api/export/contacts/csv', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const contacts = await storage.getContacts(userId);

    const csv = Papa.unparse(contacts);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({ error: error.message || 'Failed to export contacts' });
  }
});

// Export contacts to Excel
router.get('/api/export/contacts/excel', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const contacts = await storage.getContacts(userId);

    const worksheet = XLSX.utils.json_to_sheet(contacts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    res.status(500).json({ error: error.message || 'Failed to export contacts' });
  }
});

// Export companies
router.get('/api/export/companies/csv', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const companies = await storage.getCompanies(userId);

    const csv = Papa.unparse(companies);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=companies.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting companies:', error);
    res.status(500).json({ error: error.message || 'Failed to export companies' });
  }
});

// Export deals
router.get('/api/export/deals/csv', authenticateToken, async (req: any, res) => {
  try {
    const userId = (req.user as any).id;
    const deals = await storage.getDeals(userId);

    const csv = Papa.unparse(deals);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deals.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting deals:', error);
    res.status(500).json({ error: error.message || 'Failed to export deals' });
  }
});

export default router;
