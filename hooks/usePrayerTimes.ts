import { useState, useEffect, useCallback } from 'react';
import { getPrayerTimes } from '../services/mawaqitService';
import type { PrayerData, Settings } from '../types';

export const usePrayerTimes = (settings: Settings) => {
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimes = useCallback(async (currentSettings: Settings) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrayerTimes(currentSettings);
      setPrayerData(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimes(settings);
  }, [settings.city, settings.country, settings.method, settings.isHanafiAsr, fetchTimes]);

  return { prayerData, loading, error };
};