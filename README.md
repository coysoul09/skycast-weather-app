<<<<<<< HEAD
# ☁️ Aether Weather — Project Structure

```
aether-weather/
│
├── index.html                   ← App shell & semantic markup
├── style.css                    ← Core design system + glassmorphism
├── script.js                    ← App logic, state, UI rendering
│
├── api/
│   ├── config.js                ← All endpoints, keys & app constants
│   ├── weather.api.js           ← All fetch() calls (single API layer)
│   └── cache.js                 ← localStorage TTL cache
│
└── assets/
    ├── icons/
    │   ├── icon-map.js          ← OWM condition ID → SVG path mapper
    │   ├── clear-day.svg
    │   ├── clear-night.svg
    │   ├── partly-cloudy-day.svg
    │   ├── cloudy.svg
    │   ├── rain.svg
    │   ├── drizzle.svg
    │   ├── thunderstorm.svg
    │   ├── snow.svg
    │   ├── mist.svg
    │   ├── wind.svg
    │   ├── humidity.svg
    │   ├── pressure.svg
    │   ├── uv.svg
    │   ├── sunrise.svg
    │   └── sunset.svg
    │
    └── backgrounds/
        └── themes.css           ← All 10 weather background themes
```

---

## 🚀 Quick Start

### 1. Get a free API key
Sign up at [openweathermap.org](https://openweathermap.org/api) — free tier includes current weather, 5-day forecast, and AQI.

### 2. Add your key
Open `api/config.js` and replace:
```js
API_KEY: 'YOUR_OPENWEATHER_API_KEY',
```

### 3. Link the new files in `index.html`
Add to `<head>`:
```html
<link rel="stylesheet" href="assets/backgrounds/themes.css" />
```

Add to `<script>` imports (if using ES modules):
```html
<script type="module" src="script.js"></script>
```

### 4. Use the API layer in `script.js`
Replace direct `fetch()` calls with the API module:
```js
import { getCurrentWeatherByCity, getForecast5Day } from './api/weather.api.js';
import { cacheGet, cacheSet } from './api/cache.js';
import { getIconPath, getThemeClass } from './assets/icons/icon-map.js';

// Cache-first weather load
async function loadWeather(city) {
  const cacheKey = `current:${city.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return renderHero(cached);

  const { data, error } = await getCurrentWeatherByCity(city);
  if (error) { showToast(error.message, 'error'); return; }

  cacheSet(cacheKey, data);
  renderHero(data);
}
```

---

## 🎨 Background Themes

Themes are applied by adding a class to `<body>`:

| Class                  | Condition         |
|------------------------|-------------------|
| `theme-clear`          | Clear / Sunny     |
| `theme-clouds`         | Cloudy / Overcast |
| `theme-rain`           | Rain              |
| `theme-drizzle`        | Drizzle           |
| `theme-thunderstorm`   | Thunderstorm      |
| `theme-snow`           | Snow              |
| `theme-atmosphere`     | Mist / Fog / Haze |
| `theme-night`          | Night (any)       |
| `theme-heat`           | Heat wave (>35°C) |

---

## 🔑 API Tiers

| Feature                | Free Tier | One Call 3.0 |
|------------------------|-----------|--------------|
| Current weather        | ✅        | ✅           |
| 5-day / 3h forecast    | ✅        | ✅           |
| Air quality (AQI)      | ✅        | ✅           |
| UV index               | ❌        | ✅           |
| Hourly forecast (48h)  | ❌        | ✅           |
| Yesterday (Time Machine)| ❌       | ✅           |
| Minutely precipitation | ❌        | ✅           |

One Call 3.0 pricing: first 1,000 calls/day free, then ~$0.001/call.

---

## 🛠 Architecture Notes

- **`weather.api.js`** — All network calls. Returns `{ data, error }` — never throws.
- **`cache.js`** — localStorage TTL cache (default 10min). Prevents redundant calls.
- **`icon-map.js`** — Condition ID → SVG + emoji + CSS theme class.
- **`config.js`** — Single source for all constants. `Object.freeze()` prevents mutation.
- **`themes.css`** — Self-contained theme blocks. Zero cascade conflicts with `style.css`.
=======

>>>>>>> 1b05d53f72825761ecca906fbb99da84a6a2f6f7
