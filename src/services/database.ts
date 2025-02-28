
import { BusinessUnit, Employee } from "@/types/business-unit";

// Database keys
const DB_KEYS = {
  BUSINESS_UNITS: 'office_schedule_business_units',
  CSV_UPLOADS: 'office_schedule_csv_uploads',
  LAST_UPDATED: 'office_schedule_last_updated'
};

interface CSVUploadRecord {
  id: string;
  timestamp: string;
  filename: string;
  employees: Partial<Employee>[];
  importedAt: string;
}

/**
 * Save business units to localStorage
 */
export const saveBusinessUnits = (businessUnits: BusinessUnit[]): void => {
  try {
    localStorage.setItem(DB_KEYS.BUSINESS_UNITS, JSON.stringify(businessUnits));
    localStorage.setItem(DB_KEYS.LAST_UPDATED, new Date().toISOString());
    console.log("Business units saved to database");
  } catch (error) {
    console.error("Error saving business units to database:", error);
  }
};

/**
 * Load business units from localStorage
 */
export const loadBusinessUnits = (): BusinessUnit[] | null => {
  try {
    const data = localStorage.getItem(DB_KEYS.BUSINESS_UNITS);
    if (!data) return null;
    return JSON.parse(data) as BusinessUnit[];
  } catch (error) {
    console.error("Error loading business units from database:", error);
    return null;
  }
};

/**
 * Save CSV upload record
 */
export const saveCSVUpload = (uploadData: Omit<CSVUploadRecord, 'id'>): CSVUploadRecord => {
  try {
    // Generate a unique ID for this upload
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecord: CSVUploadRecord = {
      id,
      ...uploadData
    };
    
    // Get existing uploads
    const existingUploads = getCSVUploads();
    
    // Add new upload to the list
    const updatedUploads = [newRecord, ...existingUploads];
    
    // Save back to localStorage
    localStorage.setItem(DB_KEYS.CSV_UPLOADS, JSON.stringify(updatedUploads));
    console.log("CSV upload saved to database with ID:", id);
    
    return newRecord;
  } catch (error) {
    console.error("Error saving CSV upload to database:", error);
    throw error;
  }
};

/**
 * Get all CSV upload records
 */
export const getCSVUploads = (): CSVUploadRecord[] => {
  try {
    const data = localStorage.getItem(DB_KEYS.CSV_UPLOADS);
    if (!data) return [];
    return JSON.parse(data) as CSVUploadRecord[];
  } catch (error) {
    console.error("Error loading CSV uploads from database:", error);
    return [];
  }
};

/**
 * Get CSV upload by ID
 */
export const getCSVUploadById = (id: string): CSVUploadRecord | null => {
  try {
    const uploads = getCSVUploads();
    return uploads.find(upload => upload.id === id) || null;
  } catch (error) {
    console.error("Error getting CSV upload by ID:", error);
    return null;
  }
};

/**
 * Delete CSV upload by ID
 */
export const deleteCSVUpload = (id: string): boolean => {
  try {
    const uploads = getCSVUploads();
    const updatedUploads = uploads.filter(upload => upload.id !== id);
    
    // Only update storage if something was removed
    if (uploads.length !== updatedUploads.length) {
      localStorage.setItem(DB_KEYS.CSV_UPLOADS, JSON.stringify(updatedUploads));
      console.log("CSV upload deleted from database, ID:", id);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting CSV upload:", error);
    return false;
  }
};

/**
 * Get the last time the data was updated
 */
export const getLastUpdated = (): string | null => {
  return localStorage.getItem(DB_KEYS.LAST_UPDATED);
};

/**
 * Clear all data from the database
 */
export const clearDatabase = (): void => {
  localStorage.removeItem(DB_KEYS.BUSINESS_UNITS);
  localStorage.removeItem(DB_KEYS.CSV_UPLOADS);
  localStorage.removeItem(DB_KEYS.LAST_UPDATED);
  console.log("Database cleared");
};
