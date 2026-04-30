import { useState, useEffect } from 'react';

const CURRENT_VERSION = '3.0.0';
// This will fetch from the latest version of your website/PWA
const UPDATE_URL = '/version.json';

export interface UpdateInfo {
  version: string;
  isAvailable: boolean;
  notes: string;
  apkUrl: string;
}

export const useUpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const checkUpdates = async () => {
    try {
      const response = await fetch(UPDATE_URL);
      const data = await response.json();
      
      setUpdateInfo({
        version: data.version,
        isAvailable: data.version !== CURRENT_VERSION,
        notes: data.notes || '',
        apkUrl: data.apkUrl || ''
      });
    } catch (error) {
      console.error("Update check failed:", error);
    }
  };

  useEffect(() => {
    // Check for updates on mount
    checkUpdates();
  }, []);

  return { updateInfo, checkUpdates };
};
