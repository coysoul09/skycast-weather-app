/**
 * ================================================================
 * AETHER WEATHER — api/weather.api.js
 *
 * Purpose: Single responsibility API layer. All network calls live
 * here. The UI (script.js) never touches fetch() directly.
 *
 * Pattern: Module-exported async functions that return structured
 * { data, error } objects — never throw. Callers always get a
 * predictable shape regardless of success or failure.
 *
 * Dev Note: Separating API concerns from UI means you can swap
 * OpenWeatherMap for any other provider (Tomorrow.io, WeatherAPI)
 * by editing only this file.
 * ================================================================
 */

import { CONFIG } from '../api/config.js';

/* ── In-flight request registry for cancellation ──────────────── */
const controllers = {};

/**
 * Internal: cancellable fetch wrapper.
 * Each `requestKey` maps to one AbortController. Calling the same
 * key again cancels the previous request automatically.
 */
async function _fetch(url, requestKey = 'default') {
  if (controllers[requestKey]) {
    controllers[requestKey].abort();
  }
  controllers[requestKey] = new AbortController();

  try {
    const res = await fetch(url, { signal: controllers[requestKey].signal });
    delete controllers[requestKey];

    if (!res.ok) {
      return { data: null, error: _httpError(res.status) };
    }

    const data = await res.json();
    return { data, error: null };

  } catch (err) {
    if (err.name === 'AbortError') {
      return { data: null, error: { type: 'CANCELLED', message: 'Request cancelled' } };
    }
    return { data: null, error: { type: 'NETWORK', message: 'Connection failed. Check your internet.' } };
  }
}

/** Maps HTTP status codes to user-friendly error objects */
function _httpError(status) {
  const map = {
    401: { type: 'AUTH',    message: 'Invalid API key. Update CONFIG.API_KEY.' },
    404: { type: 'NOT_FOUND', message: 'City not found. Try a different search.' },
    429: { type: 'RATE_LIMIT', message: 'Too many requests. Please wait a moment.' },
    500: { type: 'SERVER',  message: 'Weather service unavailable. Try again later.' },
  };
  return map[status] || { type: 'HTTP', message: `Unexpected error (HTTP ${status}).` };
}

/* ================================================================
   PUBLIC API METHODS
================================================================ */

/**
 * getCurrentWeatherByCity
 * Fetches current weather conditions by city name string.
 * @param {string} city - e.g. "London" or "New York,US"
 * @returns {{ data: OWMCurrentWeather|null, error: object|null }}
 */
export async function getCurrentWeatherByCity(city) {
  const url = `${CONFIG.BASE_URL}/weather`
    + `?q=${encodeURIComponent(city)}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'current');
}

/**
 * getCurrentWeatherByCoords
 * Fetches current weather by GPS coordinates (from geolocation).
 * @param {number} lat
 * @param {number} lon
 */
export async function getCurrentWeatherByCoords(lat, lon) {
  const url = `${CONFIG.BASE_URL}/weather`
    + `?lat=${lat}&lon=${lon}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'current');
}

/**
 * getForecast5Day
 * Returns 5-day / 3-hour forecast list (40 data points).
 * We process these into daily buckets in script.js.
 * @param {number} lat
 * @param {number} lon
 */
export async function getForecast5Day(lat, lon) {
  const url = `${CONFIG.BASE_URL}/forecast`
    + `?lat=${lat}&lon=${lon}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'forecast');
}

/**
 * getAirQuality
 * Returns AQI and pollutant breakdown (CO, NO2, O3, PM2.5, PM10).
 * Free tier endpoint — no subscription needed.
 * @param {number} lat
 * @param {number} lon
 */
export async function getAirQuality(lat, lon) {
  const url = `${CONFIG.BASE_URL}/air_pollution`
    + `?lat=${lat}&lon=${lon}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'airquality');
}

/**
 * getOneCallCurrent
 * One Call API 3.0 — returns current + minutely + hourly + daily + alerts.
 * Requires a paid OWM subscription (One Call 3.0).
 * Dev Note: This single endpoint replaces 3 separate calls for production
 * apps. We use it here for UV index, which isn't in the free /weather endpoint.
 * @param {number} lat
 * @param {number} lon
 * @param {string[]} exclude - parts to exclude, e.g. ['minutely','alerts']
 */
export async function getOneCallCurrent(lat, lon, exclude = ['minutely', 'alerts']) {
  const url = `${CONFIG.ONE_CALL_URL}`
    + `?lat=${lat}&lon=${lon}`
    + `&exclude=${exclude.join(',')}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'onecall');
}

/**
 * getYesterday
 * One Call Time Machine — historical data for exactly 24h ago.
 * Requires One Call 3.0 subscription.
 * @param {number} lat
 * @param {number} lon
 */
export async function getYesterday(lat, lon) {
  const dt = Math.floor(Date.now() / 1000) - 86400;
  const url = `${CONFIG.ONE_CALL_URL}/timemachine`
    + `?lat=${lat}&lon=${lon}`
    + `&dt=${dt}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'yesterday');
}

/**
 * geocodeCity
 * Converts a city name to lat/lon using OWM Geocoding API.
 * Useful for getting precise coords before One Call requests.
 * @param {string} city
 * @param {number} limit - max results (default 1)
 */
export async function geocodeCity(city, limit = 1) {
  const url = `${CONFIG.GEO_URL}/direct`
    + `?q=${encodeURIComponent(city)}`
    + `&limit=${limit}`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'geocode');
}

/**
 * reverseGeocode
 * Converts lat/lon back to a human-readable city name.
 * Used after geolocation detection.
 * @param {number} lat
 * @param {number} lon
 */
export async function reverseGeocode(lat, lon) {
  const url = `${CONFIG.GEO_URL}/reverse`
    + `?lat=${lat}&lon=${lon}`
    + `&limit=1`
    + `&appid=${CONFIG.API_KEY}`;
  return _fetch(url, 'reverse-geocode');
}

/**
 * cancelAll
 * Cancels every in-flight request. Call on page unload or route change.
 */
export function cancelAll() {
  Object.values(controllers).forEach(c => c.abort());
}
