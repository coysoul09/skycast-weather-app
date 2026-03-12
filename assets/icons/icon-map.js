/**
 * ================================================================
 * AETHER WEATHER — assets/icons/icon-map.js
 *
 * Purpose: Maps OpenWeatherMap weather condition IDs and main-group
 * strings to local SVG icon paths.
 *
 * Dev Note: Using local SVGs instead of OWM's hosted PNGs gives us:
 *   1. Full CSS styling control (fill, stroke, size, filters)
 *   2. No external image request per page load
 *   3. Infinite resolution (SVG scales to any DPI)
 *   4. Custom animations via CSS on SVG elements
 *
 * Usage:
 *   import { getIconPath, getIconEmoji } from './assets/icons/icon-map.js';
 *   const src = getIconPath(800, 'day');   // → 'assets/icons/clear-day.svg'
 *   const emoji = getIconEmoji(800);       // → '☀️'
 * ================================================================
 */

/** 
 * SVG icon paths indexed by OWM weather condition ID ranges.
 * Each entry maps to { day, night } variants where applicable.
 */
const ICON_MAP = [
  // Thunderstorm (200–232)
  { min: 200, max: 232, day:   'assets/icons/thunderstorm.svg',
                         night: 'assets/icons/thunderstorm.svg' },
  // Drizzle (300–321)
  { min: 300, max: 321, day:   'assets/icons/drizzle.svg',
                         night: 'assets/icons/drizzle.svg' },
  // Light rain (500–501)
  { min: 500, max: 501, day:   'assets/icons/rain.svg',
                         night: 'assets/icons/rain.svg' },
  // Freezing / sleet (511)
  { min: 511, max: 511, day:   'assets/icons/snow.svg',
                         night: 'assets/icons/snow.svg' },
  // Shower rain (520–531)
  { min: 520, max: 531, day:   'assets/icons/rain.svg',
                         night: 'assets/icons/rain.svg' },
  // Heavy rain (502–504)
  { min: 502, max: 504, day:   'assets/icons/rain.svg',
                         night: 'assets/icons/rain.svg' },
  // Snow (600–622)
  { min: 600, max: 622, day:   'assets/icons/snow.svg',
                         night: 'assets/icons/snow.svg' },
  // Atmosphere / mist / fog (700–781)
  { min: 700, max: 781, day:   'assets/icons/mist.svg',
                         night: 'assets/icons/mist.svg' },
  // Clear sky (800)
  { min: 800, max: 800, day:   'assets/icons/clear-day.svg',
                         night: 'assets/icons/clear-night.svg' },
  // Few clouds (801)
  { min: 801, max: 801, day:   'assets/icons/partly-cloudy-day.svg',
                         night: 'assets/icons/partly-cloudy-day.svg' },
  // Scattered / broken / overcast clouds (802–804)
  { min: 802, max: 804, day:   'assets/icons/cloudy.svg',
                         night: 'assets/icons/cloudy.svg' },
];

/**
 * getIconPath
 * Returns the local SVG path for a given OWM condition ID.
 * @param {number} conditionId   - e.g. 800
 * @param {'day'|'night'} period - defaults to 'day'
 * @returns {string} relative path to the SVG file
 */
export function getIconPath(conditionId, period = 'day') {
  const entry = ICON_MAP.find(
    r => conditionId >= r.min && conditionId <= r.max
  );
  if (!entry) return 'assets/icons/clear-day.svg'; // fallback
  return entry[period] || entry.day;
}

/**
 * getIconEmoji
 * Returns a fallback emoji for inline use (e.g. forecast list).
 * @param {number} conditionId
 * @returns {string} emoji character
 */
export function getIconEmoji(conditionId) {
  if (conditionId >= 200 && conditionId < 300) return '⛈️';
  if (conditionId >= 300 && conditionId < 400) return '🌦️';
  if (conditionId >= 500 && conditionId < 504) return '🌧️';
  if (conditionId === 511)                      return '🌨️';
  if (conditionId >= 520 && conditionId < 600) return '🌦️';
  if (conditionId >= 600 && conditionId < 700) return '❄️';
  if (conditionId >= 700 && conditionId < 800) return '🌫️';
  if (conditionId === 800)                      return '☀️';
  if (conditionId === 801)                      return '🌤️';
  if (conditionId === 802)                      return '⛅';
  if (conditionId >= 803 && conditionId < 900) return '☁️';
  return '🌡️';
}

/**
 * getThemeClass
 * Returns the CSS theme class for a given OWM main condition string.
 * @param {string} main - e.g. 'Clear', 'Rain', 'Snow'
 * @returns {string} CSS class name
 */
export function getThemeClass(main) {
  const map = {
    Clear:        'theme-clear',
    Clouds:       'theme-clouds',
    Rain:         'theme-rain',
    Drizzle:      'theme-drizzle',
    Thunderstorm: 'theme-thunderstorm',
    Snow:         'theme-snow',
    Mist:         'theme-atmosphere',
    Smoke:        'theme-atmosphere',
    Haze:         'theme-atmosphere',
    Dust:         'theme-atmosphere',
    Fog:          'theme-atmosphere',
    Sand:         'theme-atmosphere',
    Ash:          'theme-atmosphere',
    Squall:       'theme-atmosphere',
    Tornado:      'theme-thunderstorm',
  };
  return map[main] || 'theme-clear';
}

/**
 * ALL_ICONS
 * Flat list of all available icon filenames.
 * Useful for preloading or generating a sprite sheet.
 */
export const ALL_ICONS = [
  'clear-day',
  'clear-night',
  'partly-cloudy-day',
  'cloudy',
  'rain',
  'drizzle',
  'thunderstorm',
  'snow',
  'mist',
  'wind',
  'humidity',
  'pressure',
  'uv',
  'sunrise',
  'sunset',
];
