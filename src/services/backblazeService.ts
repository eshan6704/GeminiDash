/**
 * Backblaze B2 Institutional Storage Service
 * 
 * Provides high-level methods for interacting with B2 storage via 
 * server-side proxy routes. Handles JSON (state), CSV (reports), 
 * and generic binary data.
 */

export interface B2Item {
  name: string;
  size: number;
  lastModified: string;
}

export const backblazeService = {
  /**
   * Saves simulator state or any JSON object to B2
   */
  async saveJson(filename: string, data: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });
      
      return await this.uploadRawFile(file);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Loads and parses a JSON file from B2
   */
  async loadJson<T>(filename: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/storage/download/${filename}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error(`Failed to load JSON ${filename}:`, err);
      return null;
    }
  },

  /**
   * Saves data as a CSV file to B2
   * @param filename - e.g. "report.csv"
   * @param headers - Array of column headers
   * @param rows - Array of objects matching headers
   */
  async saveCsv(filename: string, headers: string[], rows: any[]): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(header => {
          const val = row[header];
          // Handle strings with commas or quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val === undefined || val === null ? '' : val;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });
      
      return await this.uploadRawFile(file);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Loads and parses a CSV file from B2
   */
  async loadCsv(filename: string): Promise<any[] | null> {
    try {
      const response = await fetch(`/api/storage/download/${filename}`);
      if (!response.ok) return null;
      const text = await response.text();
      
      const lines = text.split('\n');
      if (lines.length < 1) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      });
      
      return data;
    } catch (err) {
      console.error(`Failed to load CSV ${filename}:`, err);
      return null;
    }
  },

  /**
   * Generic file upload via server proxy
   */
  async uploadRawFile(file: File): Promise<{ success: boolean; filename?: string; url?: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // We pass a 'preserveName' flag to the server if we want it to not prefix with timestamp
      // This is useful for state files that should have deterministic names
      const response = await fetch('/api/storage/upload?preserveName=true', {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error: any) {
      console.error('B2 Upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletes a file from the bucket
   */
  async deleteItem(filename: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/storage/delete/${filename}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error(`Failed to delete ${filename}:`, err);
      return false;
    }
  },

  /**
   * Lists all files in the bucket
   */
  async listAll(): Promise<B2Item[]> {
    try {
      const response = await fetch('/api/storage/files');
      const result = await response.json();
      return result.success ? result.files : [];
    } catch (err) {
      console.error('B2 List failed:', err);
      return [];
    }
  }
};
