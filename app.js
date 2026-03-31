const DAILY_GOAL_OZ = 96;
const STORAGE_KEY = "rain-water-tracker-v2";
const RAIN_BOTTLE_OZ = 16;
const QUICK_ADDS = [
  { ounces: RAIN_BOTTLE_OZ, label: "Log a RAIN", note: "One 16 oz RAIN bottle" },
];

const HYDRATION_LEVELS = [
  {
    key: "diluted",
    label: "Too diluted to trust",
    minScore: 86,
    color: "#eef3ef",
    summary:
      "This sample looks very washed out or water-clear. RAIN treats that as diluted, so take another check later instead of assuming ideal hydration.",
    badgeClass: "warn",
  },
  {
    key: "well",
    label: "Well hydrated",
    minScore: 72,
    color: "#efe8a6",
    summary:
      "The sample looks light straw, which lines up best with a healthy hydration range.",
    badgeClass: "",
  },
  {
    key: "good",
    label: "Borderline hydrated",
    minScore: 60,
    color: "#e6cf73",
    summary:
      "This looks more yellow than the ideal straw range, so RAIN treats it as a sign to keep hydrating.",
    badgeClass: "warn",
  },
  {
    key: "low",
    label: "Drink more water",
    minScore: 42,
    color: "#dfb24b",
    summary:
      "The color reads yellow to dark yellow, which usually means you need more hydration.",
    badgeClass: "warn",
  },
  {
    key: "dehydrated",
    label: "Possible dehydration",
    minScore: 0,
    color: "#ba7a2d",
    summary:
      "The image trends amber or deep yellow. Treat this as a prompt to hydrate and seek care for symptoms or concerns.",
    badgeClass: "alert",
  },
];

const elements = {
  consumedRains: document.getElementById("consumed-rains"),
  goalRains: document.getElementById("goal-rains"),
  goalInline: document.getElementById("goal-inline"),
  analysisStatus: document.getElementById("analysis-status"),
  streak: document.getElementById("streak-days"),
  streakCalendar: document.getElementById("streak-calendar"),
  rankPosition: document.getElementById("rank-position"),
  leaderboardList: document.getElementById("leaderboard-list"),
  message: document.getElementById("goal-message"),
  quickAddGrid: document.getElementById("quick-add-grid"),
  weekChart: document.getElementById("week-chart"),
  entryList: document.getElementById("entry-list"),
  quickLogToday: document.getElementById("quick-log-today"),
  quickScanToday: document.getElementById("quick-scan-today"),
  resetDay: document.getElementById("reset-day"),
  todayLabel: document.getElementById("today-label"),
  photoInput: document.getElementById("photo-input"),
  photoPreview: document.getElementById("photo-preview"),
  photoPlaceholder: document.getElementById("photo-placeholder"),
  analyzePhoto: document.getElementById("analyze-photo"),
  shareResult: document.getElementById("share-result"),
  analysisLabel: document.getElementById("analysis-label"),
  analysisSummary: document.getElementById("analysis-summary"),
  analysisSwatch: document.getElementById("analysis-swatch"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

let state = loadState();
let currentPhotoDataUrl = "";
let currentPhotoImage = null;
let latestAnalysis = null;
let activeTab = "today";

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setActiveTab(tabName) {
  activeTab = tabName;

  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function fileLooksLikeHeic(file) {
  const name = (file && file.name ? file.name : "").toLowerCase();
  const type = (file && file.type ? file.type : "").toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type.includes("heic") ||
    type.includes("heif")
  );
}

function createDemoState() {
  const entriesByDate = {};
  const analysesByDate = {};
  const demoDays = [
    { offset: 0, ounces: [16, 16, 16, 16, 16, 16], levelKey: "well" },
    { offset: 1, ounces: [16, 16, 16, 16, 16, 12], levelKey: "well" },
    { offset: 2, ounces: [16, 16, 16, 16, 16], levelKey: "good" },
    { offset: 3, ounces: [16, 16, 16, 16, 16, 16], levelKey: "well" },
    { offset: 4, ounces: [16, 16, 16, 16], levelKey: "low" },
    { offset: 5, ounces: [16, 16, 16, 16, 16, 16], levelKey: "well" },
    { offset: 6, ounces: [16, 16, 16], levelKey: "low" },
  ];

  demoDays.forEach((demoDay) => {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - demoDay.offset);
    const key = getDateKey(day);
    const level = HYDRATION_LEVELS.find((item) => item.key === demoDay.levelKey) || HYDRATION_LEVELS[1];

    entriesByDate[key] = demoDay.ounces.map((ounces, index) => {
      const timestamp = new Date(day);
      timestamp.setHours(8 + index * 2, index % 2 === 0 ? 15 : 45, 0, 0);

      return {
        id: createId(),
        ounces,
        timestamp: timestamp.toISOString(),
      };
    });

    const analysisTime = new Date(day);
    analysisTime.setHours(9, 30, 0, 0);

    analysesByDate[key] = [
      {
        id: createId(),
        timestamp: analysisTime.toISOString(),
        score:
          level.key === "well"
            ? 78
            : level.key === "good"
              ? 63
              : level.key === "low"
                ? 46
                : 24,
        levelKey: level.key,
        label: level.label,
        summary: level.summary,
        swatch: level.color,
        badgeClass: level.badgeClass,
      },
    ];
  });

  return {
    goal: DAILY_GOAL_OZ,
    entriesByDate,
    analysesByDate,
  };
}

function loadState() {
  const fallback = createDemoState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      goal: Number(parsed.goal) || DAILY_GOAL_OZ,
      entriesByDate: parsed.entriesByDate || {},
      analysesByDate: parsed.analysesByDate || {},
    };
  } catch (error) {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getEntriesForDate(dateKey) {
  return [...(state.entriesByDate[dateKey] || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function getAnalysesForDate(dateKey) {
  return [...(state.analysesByDate[dateKey] || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function getTotalForDate(dateKey) {
  return getEntriesForDate(dateKey).reduce((sum, entry) => sum + entry.ounces, 0);
}

function getRainCountForDate(dateKey) {
  return Math.floor(getTotalForDate(dateKey) / RAIN_BOTTLE_OZ);
}

function addEntry(ounces) {
  const amount = Number(ounces);
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const dateKey = getDateKey();
  const nextEntry = {
    id: createId(),
    ounces: amount,
    timestamp: new Date().toISOString(),
  };

  if (!state.entriesByDate[dateKey]) {
    state.entriesByDate[dateKey] = [];
  }

  state.entriesByDate[dateKey].push(nextEntry);
  saveState();
  render();
}

function addAnalysis(result) {
  const dateKey = getDateKey();
  const nextAnalysis = {
    id: createId(),
    timestamp: new Date().toISOString(),
    ...result,
  };

  if (!state.analysesByDate[dateKey]) {
    state.analysesByDate[dateKey] = [];
  }

  state.analysesByDate[dateKey].push(nextAnalysis);
  latestAnalysis = nextAnalysis;
  saveState();
  setActiveTab("scan");
  render();
}

function resetToday() {
  const dateKey = getDateKey();
  state.entriesByDate[dateKey] = [];
  state.analysesByDate[dateKey] = [];
  latestAnalysis = null;
  currentPhotoDataUrl = "";
  currentPhotoImage = null;
  elements.photoPreview.src = "";
  elements.photoPreview.classList.add("hidden");
  elements.photoPlaceholder.classList.remove("hidden");
  elements.shareResult.disabled = true;
  elements.photoInput.value = "";
  saveState();
  render();
}

function getLast7Days() {
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = getDateKey(day);
    const analysis = getAnalysesForDate(key)[0] || null;

    days.push({
      key,
      shortLabel: day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      dayLabel: day.toLocaleDateString("en-US", { weekday: "short" }),
      total: getTotalForDate(key),
      hydrated: didHitHydrationTarget(key),
      analysis,
    });
  }

  return days;
}

function getCurrentWeekDays() {
  const days = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  const daysSinceSaturday = (today.getDay() + 1) % 7;
  start.setDate(today.getDate() - daysSinceSaturday);

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const key = getDateKey(day);
    const isFuture = day > today;
    const analysis = isFuture ? null : getAnalysesForDate(key)[0] || null;

    days.push({
      key,
      shortLabel: day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      dayLabel: day.toLocaleDateString("en-US", { weekday: "short" }),
      total: isFuture ? 0 : getTotalForDate(key),
      hydrated: isFuture ? false : didHitHydrationTarget(key),
      analysis,
      isFuture,
    });
  }

  return days;
}

function didHitHydrationTarget(dateKey) {
  const hasWaterLog = getEntriesForDate(dateKey).length > 0;
  const hasScan = getAnalysesForDate(dateKey).length > 0;
  const ouncesGoalHit = getTotalForDate(dateKey) >= state.goal;
  const bestAnalysis = getAnalysesForDate(dateKey)[0];
  const imageLooksHydrated =
    bestAnalysis && bestAnalysis.levelKey === "well";

  return hasWaterLog || hasScan || ouncesGoalHit || imageLooksHydrated;
}

function getStreakDays() {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (true) {
    const key = getDateKey(cursor);
    if (didHitHydrationTarget(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getGoalMessage(consumed) {
  const todayAnalysis = getAnalysesForDate(getDateKey())[0];

  if (todayAnalysis) {
    return `RAIN result: ${todayAnalysis.summary}`;
  }

  if (consumed === 0) {
    return "Upload a urine photo first, then log a 16 oz RAIN when you hydrate.";
  }

  if (consumed < state.goal * 0.4) {
    return "Nice start. Keep adding RAIN bottles to build your hydration streak.";
  }

  if (consumed < state.goal) {
    return "You’re moving in the right direction. Keep checking and keep sipping RAIN.";
  }

  return "Daily goal reached with RAIN. Keep the streak alive.";
}

function getWeeklyHydrationScore() {
  return getLast7Days().reduce((score, day) => {
    let next = score + day.total;
    if (day.hydrated) {
      next += 30;
    }
    if (day.analysis && day.analysis.levelKey === "well") {
      next += 20;
    }
    return next;
  }, 0);
}

function getLeaderboard() {
  const yourScore = getWeeklyHydrationScore();
  const board = [
    { name: "Ava", score: 812 },
    { name: "Miles", score: 768 },
    { name: "You", score: yourScore },
    { name: "Sage", score: 706 },
    { name: "Kai", score: 664 },
  ]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return board;
}

function renderQuickAdds() {
  elements.quickAddGrid.innerHTML = QUICK_ADDS.map(
    (option) => `
      <button class="quick-add-button" type="button" data-ounces="${option.ounces}">
        <strong>${option.ounces} oz</strong>
        <span>${option.label}</span>
        <span>${option.note}</span>
      </button>
    `
  ).join("");

  elements.quickAddGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => addEntry(button.dataset.ounces));
  });
}

function getColorMetrics(imageData) {
  const { data, width, height } = imageData;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  const startX = Math.floor(width * 0.2);
  const endX = Math.floor(width * 0.8);
  const startY = Math.floor(height * 0.2);
  const endY = Math.floor(height * 0.8);

  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = data[index + 3];

      if (alpha < 200) {
        continue;
      }

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = (max + min) / 2;

      if (brightness < 30 || brightness > 245) {
        continue;
      }

      red += r;
      green += g;
      blue += b;
      count += 1;
    }
  }

  if (!count) {
    return { red: 230, green: 214, blue: 152 };
  }

  return {
    red: Math.round(red / count),
    green: Math.round(green / count),
    blue: Math.round(blue / count),
  };
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / delta + 2) / 6;
        break;
      default:
        hue = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: hue * 360,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function getHydrationLevel(score) {
  return (
    HYDRATION_LEVELS.find((level) => score >= level.minScore) ||
    HYDRATION_LEVELS[HYDRATION_LEVELS.length - 1]
  );
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function analyzeCurrentPhoto() {
  if (!currentPhotoImage) {
    elements.analysisLabel.textContent = "Add a photo first";
    elements.analysisSummary.textContent =
      "Choose a clear urine photo before running the RAIN estimate.";
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const size = 180;

  canvas.width = size;
  canvas.height = size;
  context.drawImage(currentPhotoImage, 0, 0, size, size);

  const metrics = getColorMetrics(context.getImageData(0, 0, size, size));
  const hsl = rgbToHsl(metrics.red, metrics.green, metrics.blue);
  const hueDistanceFromStraw = Math.abs(hsl.h - 52);
  const strawHueScore = Math.max(0, 100 - hueDistanceFromStraw * 2.2);
  const lightnessCenterScore = Math.max(0, 100 - Math.abs(hsl.l - 73) * 2.5);
  const saturationCenterScore = Math.max(0, 100 - Math.abs(hsl.s - 48) * 2.1);
  const dilutionPenalty =
    hsl.l > 82 && hsl.s < 26 ? (hsl.l - 82) * 3.4 + (26 - hsl.s) * 2.6 : 0;
  const darkYellowPenalty = hsl.l < 58 ? (58 - hsl.l) * 2.3 : 0;
  const amberPenalty = hsl.h > 62 ? (hsl.h - 62) * 1.3 : 0;
  const rawScore =
    strawHueScore * 0.34 +
    lightnessCenterScore * 0.36 +
    saturationCenterScore * 0.3 -
    dilutionPenalty -
    darkYellowPenalty -
    amberPenalty;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));
  const level = getHydrationLevel(score);
  const hex = rgbToHex(metrics.red, metrics.green, metrics.blue);

  addAnalysis({
    score,
    levelKey: level.key,
    label: level.label,
    summary: level.summary,
    swatch: hex,
    badgeClass: level.badgeClass,
  });

  elements.shareResult.disabled = false;
}

function renderWeekChart() {
  const last7Days = getCurrentWeekDays();

  elements.weekChart.innerHTML = last7Days
    .map((day) => {
      const fillHeight = Math.min((day.total / state.goal) * 100, 100);
      const completeClass = day.hydrated ? "complete" : "";
      const futureClass = day.isFuture ? "future" : "";
      const barHeight = day.isFuture || day.total === 0 ? 0 : Math.max(fillHeight, 8);
      const dayAmountLabel = day.isFuture ? "--" : `${day.total}oz`;
      const ariaLabel = day.isFuture
        ? `${day.dayLabel}: upcoming`
        : `${day.dayLabel}: ${day.total} ounces`;

      return `
        <div class="day-bar ${futureClass}" aria-label="${ariaLabel}">
          <div class="day-total">${dayAmountLabel}</div>
          <div class="bar-shell">
            <div class="bar-fill ${completeClass}" style="height:${barHeight}%"></div>
          </div>
          <div class="day-label">${day.shortLabel}</div>
        </div>
      `;
    })
    .join("");
}

function renderStreakCalendar() {
  const last7Days = getCurrentWeekDays();

  elements.streakCalendar.innerHTML = last7Days
    .map(
      (day) => `
        <div class="streak-day" aria-label="${day.dayLabel} ${day.hydrated ? "complete" : "not complete"}">
          <span class="streak-dot ${day.hydrated ? "filled" : ""} ${day.isFuture ? "future" : ""}"></span>
          <span class="streak-label">${day.shortLabel}</span>
        </div>
      `
    )
    .join("");
}

function renderLeaderboard() {
  const board = getLeaderboard();
  const yourEntry = board.find((entry) => entry.name === "You");

  elements.rankPosition.textContent = yourEntry ? `#${yourEntry.rank}` : "#--";
  elements.leaderboardList.innerHTML = board
    .slice(0, 4)
    .map(
      (entry) => `
        <button class="leaderboard-row ${entry.name === "You" ? "current-user" : ""}" type="button" data-member="${entry.name}">
          <span class="leaderboard-rank">#${entry.rank}</span>
          <span class="leaderboard-name">${entry.name}</span>
          <span class="leaderboard-score">${entry.score}</span>
        </button>
      `
    )
    .join("");

  elements.leaderboardList.querySelectorAll(".leaderboard-row").forEach((row) => {
    row.addEventListener("click", () => setActiveTab("history"));
  });
}

function renderEntries() {
  const dateKey = getDateKey();
  const waterEntries = getEntriesForDate(dateKey).map((entry) => ({
    type: "water",
    timestamp: entry.timestamp,
    title: `${entry.ounces} oz logged`,
    detail: "RAIN bottle added",
    badge: "RAIN",
    badgeClass: "",
  }));

  const analyses = getAnalysesForDate(dateKey).map((analysis) => ({
    type: "scan",
    timestamp: analysis.timestamp,
    title: analysis.label,
    detail: analysis.summary,
    badge: "SCAN",
    badgeClass: analysis.badgeClass || "",
  }));

  const activity = [...waterEntries, ...analyses].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (!activity.length) {
    elements.entryList.innerHTML = `
      <p class="empty-state">
        No activity yet today. Upload a photo or tap a bottle size to begin.
      </p>
    `;
    return;
  }

  elements.entryList.innerHTML = activity
    .map(
      (item) => `
        <div class="entry-row">
          <div class="entry-main">
            <strong>${item.title}</strong>
            <span>${timeFormatter.format(new Date(item.timestamp))} · ${item.detail}</span>
          </div>
          <div class="entry-badge ${item.badgeClass}">${item.badge}</div>
        </div>
      `
    )
    .join("");
}

function renderAnalysisCard() {
  const todayAnalysis = getAnalysesForDate(getDateKey())[0] || latestAnalysis;

  if (!todayAnalysis) {
    elements.analysisLabel.textContent = "No scan yet";
    elements.analysisSummary.textContent =
      "RAIN estimates hydration from the dominant yellow tone in the uploaded urine photo.";
    elements.analysisSwatch.style.background = "linear-gradient(180deg, #e9eff5, #cfdce8)";
    elements.shareResult.disabled = true;
    return;
  }

  elements.analysisLabel.textContent = `${todayAnalysis.label} · ${todayAnalysis.score}%`;
  elements.analysisSummary.textContent = todayAnalysis.summary;
  elements.analysisSwatch.style.background = todayAnalysis.swatch;
  elements.shareResult.disabled = !currentPhotoDataUrl;
}

function render() {
  const todayKey = getDateKey();
  const consumed = getTotalForDate(todayKey);
  const streak = getStreakDays();
  const latestTodayAnalysis = getAnalysesForDate(todayKey)[0];
  const rainsDrank = getRainCountForDate(todayKey);
  const rainGoal = Math.round(state.goal / RAIN_BOTTLE_OZ);

  elements.todayLabel.textContent = dateFormatter.format(new Date());
  elements.goalRains.textContent = rainGoal;
  elements.goalInline.textContent = state.goal;
  elements.consumedRains.textContent = rainsDrank;
  elements.analysisStatus.textContent = latestTodayAnalysis
    ? latestTodayAnalysis.label
    : "No scan";
  elements.streak.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  elements.message.textContent = getGoalMessage(consumed);

  renderAnalysisCard();
  renderStreakCalendar();
  renderLeaderboard();
  renderWeekChart();
  renderEntries();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function drawableToPreviewUrl(drawable) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = drawable.width || drawable.naturalWidth || 1;
  const height = drawable.height || drawable.naturalHeight || 1;
  const scale = Math.min(320 / width, 320 / height, 1);

  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  context.drawImage(drawable, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function loadDrawableFromFile(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        drawable: bitmap,
        previewUrl: drawableToPreviewUrl(bitmap),
      };
    } catch (error) {
      // Fall through to data URL loading for browsers that decode via <img>.
    }
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  return {
    drawable: image,
    previewUrl: dataUrl,
  };
}

async function handlePhotoSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const { drawable, previewUrl } = await loadDrawableFromFile(file);

  currentPhotoDataUrl = previewUrl;
  currentPhotoImage = drawable;
  latestAnalysis = null;

  elements.photoPreview.src = previewUrl;
  elements.photoPreview.classList.remove("hidden");
  elements.photoPlaceholder.classList.add("hidden");
  elements.analysisLabel.textContent = "Photo ready";
  elements.analysisSummary.textContent =
    "Run the RAIN estimate to classify the dominant yellow tone in this urine photo.";
  elements.shareResult.disabled = true;
  setActiveTab("scan");
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let nextY = y;

  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line.trim(), x, nextY);
      line = `${word} `;
      nextY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    context.fillText(line.trim(), x, nextY);
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function createShareCardBlob() {
  if (!latestAnalysis || !currentPhotoImage) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 1080;
  canvas.height = 1350;

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#eef9ff");
  gradient.addColorStop(1, "#fff3ee");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.8)";
  drawRoundedRect(context, 70, 70, 940, 1210, 48);
  context.fill();

  context.fillStyle = "#2f90d8";
  context.font = "700 34px Poppins";
  context.fillText("RAIN hydration check", 130, 150);

  context.fillStyle = "#0d2540";
  context.font = "800 72px Poppins";
  context.fillText(latestAnalysis.label, 130, 245);

  context.fillStyle = "#5f7890";
  context.font = "500 34px Poppins";
  wrapText(context, latestAnalysis.summary, 130, 305, 760, 46);

  context.fillStyle = latestAnalysis.swatch;
  drawRoundedRect(context, 810, 150, 110, 110, 28);
  context.fill();

  context.save();
  drawRoundedRect(context, 130, 390, 820, 520, 42);
  context.clip();
  context.drawImage(currentPhotoImage, 130, 390, 820, 520);
  context.restore();

  context.fillStyle = "#0d2540";
  context.font = "700 42px Poppins";
  context.fillText(`${getTotalForDate(getDateKey())} oz today`, 130, 1010);

  context.fillStyle = "#5f7890";
  context.font = "500 30px Poppins";
  context.fillText(`Hydration streak: ${getStreakDays()} day(s)`, 130, 1065);
  context.fillText(`Scanned on ${dateFormatter.format(new Date())}`, 130, 1110);

  context.fillStyle = "#2f90d8";
  context.font = "700 28px Poppins";
  context.fillText("Photo-based estimate only. Not medical advice.", 130, 1185);

  return canvasToBlob(canvas);
}

async function shareLatestResult() {
  if (!latestAnalysis || !currentPhotoDataUrl) {
    return;
  }

  const blob = await createShareCardBlob();
  if (!blob) {
    return;
  }

  const file = new File([blob], "rain-hydration-check.png", { type: "image/png" });
  const shareText = `${latestAnalysis.label} on RAIN Hydration Check. ${latestAnalysis.summary}`;

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "RAIN hydration check",
      text: shareText,
      files: [file],
    });
    return;
  }

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "rain-hydration-check.png";
  link.click();
  URL.revokeObjectURL(downloadUrl);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(shareText);
  }
}

elements.photoInput.addEventListener("change", (event) => {
  handlePhotoSelection(event).catch(() => {
    elements.analysisLabel.textContent = "Photo error";
    elements.analysisSummary.textContent = fileLooksLikeHeic(
      event.target.files && event.target.files[0]
    )
      ? "This browser could not decode that iPhone HEIC photo. Try another browser or export the image as JPG first."
      : "We couldn’t read that image. Try another urine photo with clear lighting.";
  });
});
elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});
elements.quickLogToday.addEventListener("click", () => addEntry(RAIN_BOTTLE_OZ));
elements.quickScanToday.addEventListener("click", () => setActiveTab("scan"));

elements.analyzePhoto.addEventListener("click", analyzeCurrentPhoto);
elements.shareResult.addEventListener("click", () => {
  shareLatestResult().catch(() => {
    elements.analysisSummary.textContent =
      "Sharing hit a snag on this device. Your result card can still be downloaded.";
  });
});
elements.resetDay.addEventListener("click", resetToday);

setActiveTab(activeTab);
renderQuickAdds();
render();
