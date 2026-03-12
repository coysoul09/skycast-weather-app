/**
 * ================================================================
 * AETHER WEATHER — api/config.js
 *
 * Single source of truth for ALL configuration values.
 * Never scatter endpoint strings or magic numbers in component code.
 *
 * HOW TO USE:
 *   1. Replace API_KEY with your OpenWeatherMap key.
 *   2. For production, move API_KEY to a .env file and reference
 *      process.env.OWM_KEY (never commit keys to version control).
 *
 * OWM FREE TIER covers:
 *   ✅ /weather       — current conditions
 *   ✅ /forecast      — 5-day / 3-hour
 *   ✅ /air_pollution — AQI
 *   ✅ /geo/direct    — geocoding
 *
 * OWM ONE CALL 3.0 (paid, ~$0.001/call after 1000 free/day):
 *   🔑 /onecall            — UV index, hourly, daily
 *   🔑 /onecall/timemachine — historical data
 * ================================================================
 */

export const CONFIG = Object.freeze({

  /* ── API Credentials ─────────────────────────────────────────── */
  // Dev Note: Object.freeze() prevents accidental mutation of config
  // at runtime — acts as a lightweight immutable record.
  API_KEY: 'd223f15d8945675e513db736ca5770e7',   // ← replace this

  /* ── Endpoint Base URLs ──────────────────────────────────────── */
  BASE_URL:     'https://api.openweathermap.org/data/2.5',
  ONE_CALL_URL: 'https://api.openweathermap.org/data/3.0/onecall',
  GEO_URL:      'https://api.openweathermap.org/geo/1.0',
  ICON_BASE:    'https://openweathermap.org/img/wn',  // append /{code}@2x.png

  /* ── App Behaviour ───────────────────────────────────────────── */
  DEBOUNCE_MS:      450,     // ms to wait after keystroke before search fires
  TOAST_DURATION:   3500,    // ms before toast auto-dismisses
  CACHE_TTL:        600,     // seconds — cache weather data to avoid re-fetching
  GEO_TIMEOUT:      8000,    // ms — geolocation request timeout
  DEFAULT_CITY:     'London',

  /* ── Units ───────────────────────────────────────────────────── */
  UNITS: {
    METRIC:   'metric',
    IMPERIAL: 'imperial',
  },

  /* ── LocalStorage Keys ───────────────────────────────────────── */
  STORAGE_KEYS: {
    LAST_CITY:  'aether_last_city',
    UNITS:      'aether_units',
    CACHE:      'aether_cache',
  },

  /* ── Forecast ────────────────────────────────────────────────── */
  FORECAST_DAYS: 7,          // number of forecast cards to show

  /* ── Weather Condition ID Ranges ─────────────────────────────── */
  // OWM condition IDs: https://openweathermap.org/weather-conditions
  CONDITION_RANGES: {
    THUNDERSTORM: [200, 232],
    DRIZZLE:      [300, 321],
    RAIN:         [500, 531],
    SNOW:         [600, 622],
    ATMOSPHERE:   [701, 781],
    CLEAR:        [800, 800],
    CLOUDS:       [801, 804],
  },

  /* ── AQI Labels (EU standard used by OWM) ────────────────────── */
  AQI_LABELS: {
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor',
  },

});
