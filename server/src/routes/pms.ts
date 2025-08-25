import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { supabase } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Upload and process PMS data from CSV
 */
router.post('/upload-pms-data', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    const { clientId } = req.user;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'CSV file is required'
      });
    }

    const csvData: any[] = [];
    const errors: string[] = [];
    let rowNumber = 0;

    // Parse CSV data
    const stream = Readable.from(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          
          // Validate required columns
          const validationResult = validatePMSRow(row, rowNumber);
          if (validationResult.isValid) {
            csvData.push({
              client_id: clientId,
              ...validationResult.data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } else {
            errors.push(...validationResult.errors);
          }
        })
        .on('end', resolve)
    }
    )

    // Check for validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'CSV validation failed',
        details: errors.slice(0, 10), // Limit to first 10 errors
        totalErrors: errors.length
      });
    }

    if (csvData.length === 0) {
      return res.status(400).json({
        error: 'No valid data found in CSV file'
      });
    }

    // Insert data into database
    const { data, error } = await supabase
      .from('pms_data')
      .insert(csvData)
      .select();

    if (error) {
      throw new Error(`Failed to store PMS data: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        recordsProcessed: csvData.length,
        recordsStored: data.length
      },
      message: `Successfully uploaded ${data.length} PMS records`
    });
  } catch (error) {
    console.error('Error uploading PMS data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get PMS data for a client
 */
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate, referralType, groupBy = 'date' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    let query = supabase
      .from('pms_data')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (referralType) {
      query = query.eq('referral_type', referralType);
    }

    const { data: pmsData, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve PMS data: ${error.message}`);
    }

    // Group and aggregate data based on groupBy parameter
    const aggregatedData = aggregatePMSData(pmsData || [], groupBy as string);

    res.json({
      success: true,
      data: aggregatedData,
      rawData: pmsData
    });
  } catch (error) {
    console.error('Error retrieving PMS data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get PMS data summary/analytics
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required'
      });
    }

    const { data: pmsData, error } = await supabase
      .from('pms_data')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      throw new Error(`Failed to retrieve PMS analytics: ${error.message}`);
    }

    // Calculate analytics
    const analytics = calculatePMSAnalytics(pmsData || []);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error retrieving PMS analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete PMS data record
 */
router.delete('/data/:recordId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { recordId } = req.params;

    const { error } = await supabase
      .from('pms_data')
      .delete()
      .eq('id', recordId)
      .eq('client_id', clientId);

    if (error) {
      throw new Error(`Failed to delete PMS record: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'PMS record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PMS record:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validate PMS CSV row data
 */
function validatePMSRow(row: any, rowNumber: number): { isValid: boolean; data?: any; errors: string[] } {
  const errors: string[] = [];
  const requiredFields = ['date', 'referral_type'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!row[field] || row[field].trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (row.date && !dateRegex.test(row.date)) {
    errors.push(`Row ${rowNumber}: Invalid date format. Expected YYYY-MM-DD`);
  }

  // Validate referral_type
  const validReferralTypes = ['doctor_referral', 'self_referral', 'insurance_referral', 'emergency', 'other'];
  if (row.referral_type && !validReferralTypes.includes(row.referral_type)) {
    errors.push(`Row ${rowNumber}: Invalid referral_type. Must be one of: ${validReferralTypes.join(', ')}`);
  }

  // Validate numeric fields
  if (row.patient_count && isNaN(parseInt(row.patient_count))) {
    errors.push(`Row ${rowNumber}: patient_count must be a number`);
  }

  if (row.production_amount && isNaN(parseFloat(row.production_amount))) {
    errors.push(`Row ${rowNumber}: production_amount must be a number`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return cleaned data
  return {
    isValid: true,
    data: {
      date: row.date,
      referral_type: row.referral_type,
      referral_source: row.referral_source || null,
      patient_count: parseInt(row.patient_count) || 1,
      production_amount: parseFloat(row.production_amount) || 0,
      appointment_type: row.appointment_type || null,
      treatment_category: row.treatment_category || null,
      notes: row.notes || null
    },
    errors: []
  };
}

/**
 * Aggregate PMS data by specified grouping
 */
function aggregatePMSData(data: any[], groupBy: string) {
  const grouped = new Map();

  data.forEach(record => {
    let key: string;
    
    switch (groupBy) {
      case 'referral_type':
        key = record.referral_type;
        break;
      case 'month':
        key = record.date.substring(0, 7); // YYYY-MM
        break;
      case 'week':
        const date = new Date(record.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().substring(0, 10);
        break;
      default:
        key = record.date;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        patient_count: 0,
        production_amount: 0,
        records: 0
      });
    }

    const group = grouped.get(key);
    group.patient_count += record.patient_count;
    group.production_amount += record.production_amount;
    group.records += 1;
  });

  return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Calculate PMS analytics
 */
function calculatePMSAnalytics(data: any[]) {
  if (data.length === 0) {
    return {
      totalPatients: 0,
      totalProduction: 0,
      averageProductionPerPatient: 0,
      referralBreakdown: {},
      topReferralSources: [],
      monthlyTrend: []
    };
  }

  const totalPatients = data.reduce((sum, record) => sum + record.patient_count, 0);
  const totalProduction = data.reduce((sum, record) => sum + record.production_amount, 0);
  
  // Referral type breakdown
  const referralBreakdown = data.reduce((acc, record) => {
    acc[record.referral_type] = (acc[record.referral_type] || 0) + record.patient_count;
    return acc;
  }, {});

  // Top referral sources
  const sourceMap = new Map();
  data.forEach(record => {
    if (record.referral_source) {
      sourceMap.set(record.referral_source, (sourceMap.get(record.referral_source) || 0) + record.patient_count);
    }
  });
  
  const topReferralSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Monthly trend
  const monthlyData = aggregatePMSData(data, 'month');

  return {
    totalPatients,
    totalProduction,
    averageProductionPerPatient: totalProduction / totalPatients,
    referralBreakdown,
    topReferralSources,
    monthlyTrend: monthlyData
  };
}

export default router;