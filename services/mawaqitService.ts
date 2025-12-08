import type { PrayerData, PrayerTimes, Settings } from '../types';

const API_BASE_URL = 'https://api.aladhan.com/v1/timingsByCity';

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  [key: string]: string;
}

interface AladhanApiResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanTimings;
    date: {
      readable: string;
      hijri: {
        day: string;
        month: {
          ar: string;
        };
        year: string;
      };
      gregorian: {
        weekday: {
          en: string;
        };
        day: string;
        month: {
          en: string;
        };
        year: string;
      }
    };
  };
}

const mapApiTimingsToPrayerTimes = (timings: AladhanTimings): PrayerTimes => ({
  fajr: timings.Fajr.split(' ')[0],
  shourouq: timings.Sunrise.split(' ')[0],
  dhuhr: timings.Dhuhr.split(' ')[0],
  asr: timings.Asr.split(' ')[0],
  maghrib: timings.Maghrib.split(' ')[0],
  isha: timings.Isha.split(' ')[0],
  imsak: timings.Imsak.split(' ')[0],
});


import { prayerCacheService } from './prayerCacheService';

const CALENDAR_API_URL = 'https://api.aladhan.com/v1/calendarByCity';

export const getPrayerTimes = async (settings: Settings): Promise<PrayerData> => {
  const { city, country, method, isHanafiAsr } = settings;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Helper to ensure we have data for a specific date (fetches month if needed)
  const getDataForDate = async (targetDate: Date) => {
    // Try cache first
    let monthData = prayerCacheService.getCachedMonth(settings, targetDate);

    if (!monthData) {
      // Fetch from API
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      const school = isHanafiAsr ? 1 : 0;

      const url = `${CALENDAR_API_URL}?city=${city}&country=${country}&method=${method}&school=${school}&month=${month}&year=${year}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch calendar: ${response.status}`);
        }
        const json = await response.json();
        if (json.code !== 200) {
          throw new Error(json.status);
        }
        monthData = json.data;
        // Cache the result
        prayerCacheService.setCachedMonth(settings, targetDate, monthData);
      } catch (error) {
        console.error("Network request failed, checking if we have any stale cache?", error);
        throw error;
      }
    }

    // Find the specific day in the monthly array
    // API returns array of days. We match by day number to be safe.
    const targetDay = targetDate.getDate();
    const dayData = monthData.find((d: any) => parseInt(d.date.gregorian.day) === targetDay);

    if (!dayData) {
      throw new Error(`Date ${targetDay} not found in fetched month data`);
    }
    return dayData;
  };

  try {
    const [todayData, tomorrowData] = await Promise.all([
      getDataForDate(today),
      getDataForDate(tomorrow)
    ]);

    // Format output as expected by the app
    const todayPrayers = todayData;
    const tomorrowPrayers = tomorrowData;

    const hijriDateFormatted = `${todayPrayers.date.hijri.day} ${todayPrayers.date.hijri.month.ar} ${todayPrayers.date.hijri.year} هـ`;

    const gregorianDateFormatted = today.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      hijri: hijriDateFormatted,
      date: gregorianDateFormatted,
      prayers: {
        today: mapApiTimingsToPrayerTimes(todayPrayers.timings),
        tomorrow: mapApiTimingsToPrayerTimes(tomorrowPrayers.timings),
      },
    };
  } catch (error) {
    console.error("Error in getPrayerTimes:", error);
    throw error;
  }
};