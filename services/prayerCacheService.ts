import { Settings } from '../types';

const CACHE_PREFIX = 'mawaqit_cache_v1_';

interface CachedMonthData {
    timestamp: number;
    data: any; // Raw API response for the month
}

export const prayerCacheService = {
    getKey(settings: Settings, date: Date): string {
        const { city, country, method, isHanafiAsr } = settings;
        const month = date.getMonth();
        const year = date.getFullYear();
        // Unique key for city, method, and specific month
        return `${CACHE_PREFIX}${city}_${country}_${method}_${isHanafiAsr ? 1 : 0}_${month}_${year}`;
    },

    getCachedMonth(settings: Settings, date: Date): any | null {
        try {
            const key = this.getKey(settings, date);
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const { data } = JSON.parse(cached) as CachedMonthData;
            return data;
        } catch (error) {
            console.error('Error reading from cache', error);
            return null;
        }
    },

    setCachedMonth(settings: Settings, date: Date, data: any): void {
        try {
            const key = this.getKey(settings, date);
            const cacheEntry: CachedMonthData = {
                timestamp: Date.now(),
                data
            };
            localStorage.setItem(key, JSON.stringify(cacheEntry));

            // Cleanup old caches (optional, maybe keep last 2 months)
            this.cleanupOldCaches(settings, date);
        } catch (error) {
            console.error('Error writing to cache', error);
        }
    },

    // Basic cleanup to remove previous months (keep current and next)
    cleanupOldCaches(settings: Settings, currentDate: Date) {
        // Implementation can be added if localStorage usage gets too high
        // For now, text data is small enough.
    }
};
