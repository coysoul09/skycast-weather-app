/**
 * SKYCAST — Royal Weather
 * Desktop UI with Royal Design
 */

const WeatherApp = (() => {
  'use strict';

  const CONFIG = {
    API_KEY:        'd223f15d8945675e513db736ca5770e7',
    BASE_URL:       'https://api.openweathermap.org/data/2.5',
    DEBOUNCE_MS:    450,
    TOAST_DURATION: 3500,
    DEFAULT_CITY:   'London',
  };

  const state = {
    currentWeather: null,
    forecastData:   null,
    yesterdayData:  null,
    units:          'metric',
    lat:            null,
    lon:            null,
  };

  const $ = id => document.getElementById(id);

  /* ── UTILS ─────────────────────────────────────────────────────── */
  function debounce(fn, wait) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  }

  function unixToTime(unix, tzOffset) {
    const d = new Date((unix + tzOffset) * 1000);
    return String(d.getUTCHours()).padStart(2,'0') + ':' +
           String(d.getUTCMinutes()).padStart(2,'0');
  }

  function unixToDayName(unix) {
    return new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short' });
  }

  function fmtTemp(kelvin) {
    const c = kelvin - 273.15;
    return state.units === 'metric' ? Math.round(c) : Math.round(c * 9/5 + 32);
  }

  function fmtTempC(celsius) {
    return state.units === 'metric' ? Math.round(celsius) : Math.round(celsius * 9/5 + 32);
  }

  function fmtWind(mps) {
    return state.units === 'imperial'
      ? Math.round(mps * 2.237) + ' mph'
      : Math.round(mps) + ' m/s';
  }

  function tempUnit() { return state.units === 'metric' ? '°C' : '°F'; }

  function conditionEmoji(id) {
    if (id >= 200 && id < 300) return '⛈️';
    if (id >= 300 && id < 400) return '🌦️';
    if (id >= 500 && id < 504) return '🌧️';
    if (id === 511)             return '🌨️';
    if (id >= 520 && id < 600) return '🌦️';
    if (id >= 600 && id < 700) return '❄️';
    if (id >= 700 && id < 800) return '🌫️';
    if (id === 800)             return '☀️';
    if (id === 801)             return '🌤️';
    if (id === 802)             return '⛅';
    if (id >= 803)             return '☁️';
    return '🌡️';
  }

  function conditionTheme(main) {
    const map = {
      Clear:'theme-clear', Clouds:'theme-clouds',
      Rain:'theme-rain', Drizzle:'theme-rain',
      Thunderstorm:'theme-thunderstorm', Snow:'theme-snow',
      Mist:'theme-atmosphere', Smoke:'theme-atmosphere',
      Haze:'theme-atmosphere', Dust:'theme-atmosphere',
      Fog:'theme-atmosphere', Sand:'theme-atmosphere',
      Ash:'theme-atmosphere', Squall:'theme-atmosphere',
      Tornado:'theme-thunderstorm',
    };
    return map[main] || 'theme-clear';
  }

  function uvLabel(v) {
    if (v < 3)  return { text: 'Low',      pct: v/11 };
    if (v < 6)  return { text: 'Moderate', pct: v/11 };
    if (v < 8)  return { text: 'High',     pct: v/11 };
    if (v < 11) return { text: 'Very High',pct: v/11 };
    return             { text: 'Extreme',  pct: 1 };
  }

  /* ── TOAST ──────────────────────────────────────────────────────── */
  function toast(msg, type = 'info') {
    const icons = { error:'⚠️', success:'✦', info:'◈' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
    $('toast-container').appendChild(el);
    setTimeout(() => {
      el.classList.add('dismissing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, CONFIG.TOAST_DURATION);
  }

  /* ── SKELETON BUILDERS ──────────────────────────────────────────── */
  function skeletonHero() {
    return `
      <div style="padding:8px 0;width:100%">
        <div class="skel w-60" style="height:12px;margin-bottom:20px"></div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div class="skel" style="width:52px;height:52px;border-radius:50%"></div>
          <div class="skel w-40" style="height:64px"></div>
        </div>
        <div class="skel w-60" style="height:14px;margin-bottom:24px"></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="skel" style="height:38px;border-radius:12px"></div>
          <div class="skel" style="height:38px;border-radius:12px"></div>
          <div class="skel" style="height:38px;border-radius:12px"></div>
        </div>
      </div>`;
  }

  function skeletonStats() {
    return ['','',''].map(() =>
      `<div class="stat-card glass-panel" style="min-height:110px">
         <div class="skel w-40" style="height:10px;margin-bottom:12px"></div>
         <div class="skel w-60" style="height:42px;margin-bottom:8px"></div>
         <div class="skel w-40" style="height:10px"></div>
       </div>`
    ).join('');
  }

  function skeletonSun() {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
          <div class="skel" style="height:10px;width:48px"></div>
          <div class="skel" style="height:24px;width:60px"></div>
        </div>
        <div class="skel" style="flex:1;height:30px;border-radius:8px"></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
          <div class="skel" style="height:10px;width:48px"></div>
          <div class="skel" style="height:24px;width:60px"></div>
        </div>
      </div>`;
  }

  function skeletonForecast() {
    return Array(7).fill(0).map(() =>
      `<div class="forecast-item" style="opacity:1;transform:none">
         <div class="skel" style="height:10px;width:40px"></div>
         <div class="skel" style="width:36px;height:36px;border-radius:50%"></div>
         <div class="skel" style="height:10px;width:50px"></div>
         <div class="skel" style="height:22px;width:40px"></div>
       </div>`
    ).join('');
  }

  /* ── REAL CONTENT BUILDERS ──────────────────────────────────────── */
  function htmlHero(data) {
    const w = data.weather[0];
    const tu = tempUnit();
    return `
      <div class="hero-location fade-up">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <span>${data.name}</span>
        <span class="country-tag">${data.sys.country}</span>
      </div>
      <div class="hero-temp-row fade-up" style="animation-delay:60ms">
        <div class="weather-icon-wrap">${conditionEmoji(w.id)}</div>
        <div class="temp-block">
          <span class="temp-value">${fmtTemp(data.main.temp)}</span>
          <span class="temp-unit">${tu}</span>
        </div>
      </div>
      <p class="hero-desc fade-up" style="animation-delay:120ms">${w.description}</p>
      <div class="hero-meta fade-up" style="animation-delay:180ms">
        <div class="meta-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
          <span>Feels like <strong>${fmtTemp(data.main.feels_like)}${tu}</strong></span>
        </div>
        <div class="meta-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          <span>Humidity <strong>${data.main.humidity}%</strong></span>
        </div>
        <div class="meta-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
          </svg>
          <span>Wind <strong>${fmtWind(data.wind.speed)}</strong></span>
        </div>
      </div>`;
  }

  function htmlStats(data, uvi) {
    const vis = data.visibility ? (data.visibility / 1000).toFixed(1) : 'N/A';
    const pres = data.main.pressure;

    let uvContent;
    if (uvi !== null && uvi !== undefined) {
      const u = uvLabel(uvi);
      uvContent = `
        <span class="stat-label">UV Index</span>
        <span class="stat-value">${Math.round(uvi)}</span>
        <span class="stat-sub">${u.text}</span>
        <div class="uv-bar-track">
          <div class="uv-bar-fill" style="width:${Math.min(u.pct*100,100).toFixed(0)}%"></div>
        </div>`;
    } else {
      uvContent = `
        <span class="stat-label">UV Index</span>
        <span class="stat-value">—</span>
        <span class="stat-sub">Unavailable</span>
        <div class="uv-bar-track"><div class="uv-bar-fill" style="width:0%"></div></div>`;
    }

    return `
      <div class="stat-card glass-panel fade-up">${uvContent}</div>
      <div class="stat-card glass-panel fade-up" style="animation-delay:60ms">
        <span class="stat-label">Visibility</span>
        <span class="stat-value">${vis}</span>
        <span class="stat-sub">kilometres</span>
      </div>
      <div class="stat-card glass-panel fade-up" style="animation-delay:120ms">
        <span class="stat-label">Pressure</span>
        <span class="stat-value">${pres}</span>
        <span class="stat-sub">hPa</span>
      </div>`;
  }

  function htmlSun(data) {
    const tz = data.timezone;
    const sr = unixToTime(data.sys.sunrise, tz);
    const ss = unixToTime(data.sys.sunset, tz);

    const now = Math.floor(Date.now() / 1000);
    const progress = Math.max(0, Math.min(1,
      (now - data.sys.sunrise) / (data.sys.sunset - data.sys.sunrise)
    ));
    const t = progress;
    const cx = ((1-t)*(1-t)*10 + 2*(1-t)*t*60 + t*t*110).toFixed(1);
    const cy = ((1-t)*(1-t)*55 + 2*(1-t)*t*5  + t*t*55).toFixed(1);

    return `
      <div class="sun-content">
        <div class="sun-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <span class="sun-label">Sunrise</span>
          <span class="sun-time">${sr}</span>
        </div>
        <div class="sun-arc">
          <svg viewBox="0 0 120 60" fill="none">
            <path d="M10 55 Q60 5 110 55" stroke="rgba(201,162,39,0.35)" stroke-width="1.5" stroke-dasharray="4 3"/>
            <circle cx="${cx}" cy="${cy}" r="5" fill="#c9a227" filter="url(#glow)"/>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
          </svg>
        </div>
        <div class="sun-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <span class="sun-label">Sunset</span>
          <span class="sun-time">${ss}</span>
        </div>
      </div>`;
  }

  function htmlForecast(data) {
    const dailyMap = {};
    const today = new Date().toDateString();

    data.list.forEach(item => {
      const d = new Date(item.dt * 1000);
      const key = d.toDateString();
      if (key === today) return;
      const h = d.getHours();
      if (!dailyMap[key] || Math.abs(h - 12) < Math.abs(new Date(dailyMap[key].dt*1000).getHours() - 12)) {
        dailyMap[key] = item;
      }
    });

    const days = Object.values(dailyMap).slice(0, 7);
    const allHi = days.map(d => d.main.temp_max);
    const allLo = days.map(d => d.main.temp_min);
    const rangeHi = Math.max(...allHi);
    const rangeLo = Math.min(...allLo);
    const range = (rangeHi - rangeLo) || 1;

    return days.map((item, i) => {
      const day = i === 0 ? 'Tmrw' : unixToDayName(item.dt);
      const hi = fmtTemp(item.main.temp_max);
      const lo = fmtTemp(item.main.temp_min);
      const barL = ((item.main.temp_min - rangeLo) / range * 100).toFixed(1);
      const barW = ((item.main.temp_max - item.main.temp_min) / range * 100).toFixed(1);

      return `
        <div class="forecast-item" role="listitem" data-index="${i}">
          <span class="forecast-day">${day}</span>
          <span class="forecast-icon">${conditionEmoji(item.weather[0].id)}</span>
          <span class="forecast-desc">${item.weather[0].description}</span>
          <div class="forecast-bar-wrap">
            <div class="forecast-bar-fill" style="left:${barL}%;width:${barW}%"></div>
          </div>
          <div class="forecast-temps">
            <span class="forecast-hi">${hi}°</span>
            <span class="forecast-lo">${lo}°</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ── FETCH ──────────────────────────────────────────────────────── */
  let ctrl = null;

  async function fetchWeather(query) {
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();

    const url = typeof query === 'object'
      ? `${CONFIG.BASE_URL}/weather?lat=${query.lat}&lon=${query.lon}&appid=${CONFIG.API_KEY}`
      : `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(query)}&appid=${CONFIG.API_KEY}`;

    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (r.status === 404) { toast('City not found.', 'error'); return null; }
      if (r.status === 401) { toast('Invalid API key.', 'error'); return null; }
      if (!r.ok) { toast(`Error ${r.status}. Try again.`, 'error'); return null; }
      return await r.json();
    } catch (e) {
      if (e.name !== 'AbortError') toast('Connection failed.', 'error');
      return null;
    }
  }

  async function fetchForecast(lat, lon) {
    try {
      const r = await fetch(`${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`);
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  async function fetchUVI(lat, lon) {
    try {
      const r = await fetch(`${CONFIG.BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`);
      if (!r.ok) return null;
      const d = await r.json();
      return d.value ?? null;
    } catch { return null; }
  }

  /* ── YESTERDAY: REAL DATA via Open-Meteo Archive ────────────────
   * Open-Meteo archive-api gives ACTUAL historical data — free, no key.
   * Uses past_days=1 to get exactly yesterday's 24 hourly readings.
   *
   * API: https://archive-api.open-meteo.com/v1/archive
   *   ?latitude=&longitude=
   *   &start_date=YYYY-MM-DD   ← yesterday's date
   *   &end_date=YYYY-MM-DD     ← yesterday's date
   *   &hourly=temperature_2m,relativehumidity_2m
   *   &timezone=auto
   *
   * Returns: { avgTemp, maxTemp, minTemp, avgHumidity }
   * All temps in °C. Null only on network failure.
   * ─────────────────────────────────────────────────────────────── */
  async function getYesterdayWeather(lat, lon) {
    try {
      // Step 1: Calculate yesterday's exact calendar date
      const yd  = new Date(Date.now() - 86400000);
      const pad = n => String(n).padStart(2, '0');
      const date = `${yd.getFullYear()}-${pad(yd.getMonth() + 1)}-${pad(yd.getDate())}`;

      // Step 2: Open-Meteo ARCHIVE endpoint — real historical data, 100% free
      const url =
        `https://archive-api.open-meteo.com/v1/archive` +
        `?latitude=${lat}&longitude=${lon}` +
        `&start_date=${date}&end_date=${date}` +
        `&hourly=temperature_2m,relativehumidity_2m` +
        `&timezone=auto`;

      const r = await fetch(url);
      if (!r.ok) return null;

      const data = await r.json();

      // Step 3: Extract 24 hourly values for that date
      const temps  = data?.hourly?.temperature_2m;
      const humids = data?.hourly?.relativehumidity_2m;
      if (!temps || temps.length === 0) return null;

      // Step 4: Compute stats from all 24 real hourly readings
      const sum = arr => arr.reduce((a, b) => a + b, 0);

      const avgTemp     = Math.round((sum(temps)  / temps.length)  * 10) / 10;
      const maxTemp     = Math.round(Math.max(...temps) * 10) / 10;
      const minTemp     = Math.round(Math.min(...temps) * 10) / 10;
      const avgHumidity = Math.round(sum(humids) / humids.length);

      // Step 5: Return structured object
      return { avgTemp, maxTemp, minTemp, avgHumidity };

    } catch (err) {
      console.error('SkyCast: getYesterdayWeather failed —', err);
      return null;
    }
  }

  /* ── YESTERDAY SKELETON ─────────────────────────────────────────── */
  function skeletonYesterday() {
    return Array(4).fill(0).map(() =>
      `<div class="yesterday-stat">
        <div class="skel" style="height:10px;width:70%;margin-bottom:10px"></div>
        <div class="skel" style="height:36px;width:60%"></div>
      </div>`
    ).join('');
  }

  /* ── YESTERDAY UI UPDATER ───────────────────────────────────────── */
  function renderYesterdayUI(result) {
    const grid = $('yesterday-grid');
    if (!grid) return;

    if (!result) {
      grid.innerHTML = `
        <div class="yesterday-unavailable">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          <span>Weather data could not be loaded. Check your connection.</span>
        </div>`;
      return;
    }

    state.yesterdayData = result;
    const tu = tempUnit();

    // Trend arrow: compare yesterday avg vs today's current temp
    const todayC = state.currentWeather ? (state.currentWeather.main.temp - 273.15) : null;
    const diff   = todayC !== null ? Math.round(todayC - result.avgTemp) : null;
    const trend  = diff === null   ? '' :
      diff > 0  ? `<span class="ystat-trend trend-up">▲ ${diff}° warmer today</span>` :
      diff < 0  ? `<span class="ystat-trend trend-down">▼ ${Math.abs(diff)}° cooler today</span>` :
                  `<span class="ystat-trend trend-flat">Same as today</span>`;

    const cards = [
      {
        label:    'Avg Temperature',
        value:    fmtTempC(result.avgTemp),
        unit:     tu,
        extra:    trend,
        iconPath: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3',
        color:    '#c9a227',
      },
      {
        label:    'Highest Temp',
        value:    fmtTempC(result.maxTemp),
        unit:     tu,
        extra:    '',
        iconPath: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4',
        color:    '#f97316',
      },
      {
        label:    'Lowest Temp',
        value:    fmtTempC(result.minTemp),
        unit:     tu,
        extra:    '',
        iconPath: 'M12 22V12M12 12 8 8m4 4 4-4M4 20h16',
        color:    '#60a5fa',
      },
      {
        label:    'Avg Humidity',
        value:    result.avgHumidity,
        unit:     '%',
        extra:    '',
        iconPath: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
        color:    '#818cf8',
      },
    ];

    grid.innerHTML = cards.map((c, i) => `
      <div class="yesterday-stat fade-up" style="animation-delay:${i * 60}ms">
        <div class="ystat-icon" style="color:${c.color}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
            <path d="${c.iconPath}"/>
          </svg>
        </div>
        <span class="stat-label">${c.label}</span>
        <div class="ystat-value-row">
          <span class="stat-value">${c.value}</span>
          <span class="ystat-unit">${c.unit}</span>
        </div>
        ${c.extra}
      </div>`
    ).join('');
  }

  /* ── YESTERDAY TOGGLE ───────────────────────────────────────────── */
  function toggleYesterday() {
    const btn     = $('yesterday-toggle');
    const content = $('yesterday-content');
    const isOpen  = btn.getAttribute('aria-expanded') === 'true';

    btn.setAttribute('aria-expanded', String(!isOpen));
    btn.querySelector('span').textContent    = isOpen ? 'Show Details' : 'Hide Details';
    btn.querySelector('svg').style.transform = isOpen ? '' : 'rotate(180deg)';
    content.style.display = isOpen ? 'none' : 'block';

    // If opening and data already loaded, re-render (handles unit toggle)
    if (!isOpen && state.yesterdayData !== undefined) {
      renderYesterdayUI(state.yesterdayData);
    }
  }

  /* ── MAIN LOAD ──────────────────────────────────────────────────── */
  async function loadWeather(query) {
    $('hero-card').innerHTML     = skeletonHero();
    $('stat-grid').innerHTML     = skeletonStats();
    $('sun-card').innerHTML      = skeletonSun();
    $('forecast-list').innerHTML = skeletonForecast();

    // Reset yesterday state and show skeleton
    state.yesterdayData = undefined;
    const yContent = $('yesterday-content');
    const yToggle  = $('yesterday-toggle');
    if (yContent && yContent.style.display !== 'none') {
      $('yesterday-grid').innerHTML = skeletonYesterday();
    }

    if (typeof query === 'string') {
      localStorage.setItem('skycast_last_city', query);
    }

    const current = await fetchWeather(query);
    if (!current) return;

    state.currentWeather = current;
    state.lat = current.coord.lat;
    state.lon = current.coord.lon;

    document.body.className = conditionTheme(current.weather[0].main);

    $('hero-card').innerHTML = htmlHero(current);
    $('sun-card').innerHTML  = htmlSun(current);

    $('footer-city-time').textContent =
      `${current.name} — ${unixToTime(Math.floor(Date.now() / 1000), current.timezone)}`;

    // Fire all secondary fetches in parallel (forecast + UVI + yesterday)
    const [forecast, uvi, yesterdayResult] = await Promise.all([
      fetchForecast(state.lat, state.lon),
      fetchUVI(state.lat, state.lon),
      getYesterdayWeather(state.lat, state.lon),
    ]);

    $('stat-grid').innerHTML = htmlStats(current, uvi);

    if (forecast) {
      state.forecastData = forecast;
      $('forecast-list').innerHTML = htmlForecast(forecast);
      $('forecast-list').querySelectorAll('.forecast-item').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 70 + 60);
      });
    }

    // Update yesterday
    state.yesterdayData = yesterdayResult;

    // Set yesterday date label
    const yDateEl = $('yesterday-date');
    if (yDateEl) {
      const yd = new Date(Date.now() - 86400000);
      yDateEl.textContent = yd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    // Auto-expand the section so users see the data immediately
    if (yContent && yesterdayResult) {
      yContent.style.display = 'block';
      yToggle.setAttribute('aria-expanded', 'true');
      yToggle.querySelector('span').textContent    = 'Hide Details';
      yToggle.querySelector('svg').style.transform = 'rotate(180deg)';
    }

    if (yContent && yContent.style.display !== 'none') {
      renderYesterdayUI(yesterdayResult);
    }

    toast(`${current.name} — weather updated`, 'success');
  }

  /* ── GEO ────────────────────────────────────────────────────────── */
  function detectLocation() {
    if (!navigator.geolocation) { toast('Geolocation not supported.', 'error'); return; }
    toast('Detecting your location…', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        const m = { 1:'Permission denied.', 2:'Location unavailable.', 3:'Timed out.' };
        toast(m[err.code] || 'Location error.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  /* ── UNIT TOGGLE ────────────────────────────────────────────────── */
  function toggleUnits() {
    state.units = state.units === 'metric' ? 'imperial' : 'metric';
    localStorage.setItem('skycast_units', state.units);
    $('unit-label').textContent = state.units === 'metric' ? 'Switch to °F' : 'Switch to °C';
    if (state.currentWeather) {
      $('hero-card').innerHTML = htmlHero(state.currentWeather);
    }
    if (state.forecastData) {
      $('forecast-list').innerHTML = htmlForecast(state.forecastData);
      $('forecast-list').querySelectorAll('.forecast-item').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 70 + 30);
      });
    }
    // Re-render yesterday with new unit (uses cached data — no re-fetch)
    const yContent = $('yesterday-content');
    if (yContent && yContent.style.display !== 'none' && state.yesterdayData !== undefined) {
      renderYesterdayUI(state.yesterdayData);
    }
  }

  /* ── SEARCH SETUP ───────────────────────────────────────────────── */
  function setupSearch() {
    const input = $('search-input');
    const clear = $('search-clear');

    input.addEventListener('input', () => {
      clear.style.display = input.value.trim() ? 'flex' : 'none';
    });
    clear.addEventListener('click', () => {
      input.value = '';
      clear.style.display = 'none';
      input.focus();
    });

    const debounced = debounce(v => {
      if (v.trim().length >= 2) loadWeather(v.trim());
    }, CONFIG.DEBOUNCE_MS);

    input.addEventListener('input', e => debounced(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) loadWeather(input.value.trim());
    });
  }

  /* ── INIT ───────────────────────────────────────────────────────── */
  function init() {
    const saved = localStorage.getItem('skycast_units');
    if (saved) {
      state.units = saved;
      $('unit-label').textContent = saved === 'metric' ? 'Switch to °F' : 'Switch to °C';
    }

    $('geo-btn').addEventListener('click', detectLocation);
    $('unit-toggle').addEventListener('click', toggleUnits);
    $('yesterday-toggle').addEventListener('click', toggleYesterday);

    setupSearch();

    const lastCity = localStorage.getItem('skycast_last_city') || CONFIG.DEFAULT_CITY;
    if (lastCity !== CONFIG.DEFAULT_CITY) $('search-input').value = lastCity;
    loadWeather(lastCity);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', WeatherApp.init);
