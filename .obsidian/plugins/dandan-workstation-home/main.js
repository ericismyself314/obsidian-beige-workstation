/* dandan-workstation-home v0.3.0 */

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WorkstationHomePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/settings.ts
var DEFAULT_DATA = {
  version: 1,
  inspirations: [],
  todos: [],
  documentLines: [],
  settings: {
    openOnStartup: true,
    diaryFolder: "\u65E5\u8BB0",
    defaultDocumentFolder: "\u7814\u7A76",
    diaryDateFormat: "YYYY-MM-DD",
    recentDiaryCount: 7,
    weekStartsOn: 1,
    openDiaryIn: "current",
    showWeather: false,
    location: void 0,
    temperatureUnit: "celsius",
    holidayRegion: "CN",
    holidaySecondary: "",
    writeWeatherIntoNewDiary: false
  },
  weatherCache: {},
  holidayCache: {},
  geocodeCache: {}
};
function asString(v, fallback) {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function asInt(v, fallback) {
  return typeof v === "number" && isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}
function asWeekStart(v) {
  return v === 0 || v === 1 ? v : 1;
}
function asOpenTarget(v) {
  return v === "tab" || v === "split" ? v : "current";
}
function asTempUnit(v) {
  return v === "fahrenheit" ? "fahrenheit" : "celsius";
}
function asBool(v, fallback) {
  return typeof v === "boolean" ? v : fallback;
}
function validateLocation(v) {
  if (!v || typeof v !== "object") return void 0;
  const l = v;
  if (typeof l.latitude !== "number" || typeof l.longitude !== "number") return void 0;
  if (typeof l.name !== "string" || !l.name) return void 0;
  return {
    name: l.name,
    admin1: typeof l.admin1 === "string" ? l.admin1 : void 0,
    country: typeof l.country === "string" ? l.country : void 0,
    countryCode: typeof l.countryCode === "string" ? l.countryCode : void 0,
    latitude: l.latitude,
    longitude: l.longitude,
    timezone: typeof l.timezone === "string" && l.timezone ? l.timezone : "Asia/Shanghai"
  };
}
function mergeAndValidateData(def, saved) {
  const out = {
    version: 1,
    inspirations: [],
    todos: [],
    documentLines: [],
    settings: { ...def.settings },
    weatherCache: {},
    holidayCache: {},
    geocodeCache: {}
  };
  if (!saved || typeof saved !== "object") return out;
  const s = saved;
  if (Array.isArray(s.inspirations)) {
    out.inspirations = s.inspirations.filter((i) => !!i && typeof i.id === "string").map((i) => {
      const it = i;
      return {
        id: it.id,
        text: typeof it.text === "string" ? it.text : "",
        createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
        updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
        order: typeof it.order === "number" ? it.order : 0
      };
    });
  }
  if (Array.isArray(s.todos)) {
    out.todos = s.todos.filter((i) => !!i && typeof i.id === "string").map((i) => {
      const it = i;
      return {
        id: it.id,
        text: typeof it.text === "string" ? it.text : "",
        completed: typeof it.completed === "boolean" ? it.completed : false,
        createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
        updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
        order: typeof it.order === "number" ? it.order : 0
      };
    });
  }
  if (Array.isArray(s.documentLines)) {
    out.documentLines = s.documentLines.filter((l) => !!l && typeof l.id === "string").map((l) => {
      const it = l;
      return {
        id: it.id,
        title: typeof it.title === "string" && it.title.trim() ? it.title : "\u672A\u547D\u540D\u5DE5\u4F5C\u9879",
        documentPaths: Array.isArray(it.documentPaths) ? it.documentPaths.filter((p) => typeof p === "string") : [],
        steps: Array.isArray(it.steps) ? it.steps.filter((step) => !!step && typeof step.text === "string" && step.text.trim()).map((step) => ({
          id: typeof step.id === "string" && step.id ? step.id : uid(),
          text: step.text.trim(),
          createdAt: typeof step.createdAt === "number" ? step.createdAt : Date.now(),
          updatedAt: typeof step.updatedAt === "number" ? step.updatedAt : Date.now()
        })) : [],
        createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
        updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
        order: typeof it.order === "number" ? it.order : 0
      };
    });
  }
  if (s.settings && typeof s.settings === "object") {
    const st = s.settings;
    const d = def.settings;
    out.settings = {
      openOnStartup: asBool(st.openOnStartup, d.openOnStartup),
      diaryFolder: asString(st.diaryFolder, d.diaryFolder),
      defaultDocumentFolder: asString(st.defaultDocumentFolder, d.defaultDocumentFolder),
      diaryDateFormat: asString(st.diaryDateFormat, d.diaryDateFormat),
      recentDiaryCount: asInt(st.recentDiaryCount, d.recentDiaryCount),
      weekStartsOn: asWeekStart(st.weekStartsOn),
      openDiaryIn: asOpenTarget(st.openDiaryIn),
      showWeather: asBool(st.showWeather, d.showWeather),
      location: validateLocation(st.location) ?? d.location,
      temperatureUnit: asTempUnit(st.temperatureUnit),
      holidayRegion: asString(st.holidayRegion, d.holidayRegion),
      holidaySecondary: asString(st.holidaySecondary, d.holidaySecondary),
      writeWeatherIntoNewDiary: asBool(st.writeWeatherIntoNewDiary, d.writeWeatherIntoNewDiary)
    };
  }
  if (s.weatherCache && typeof s.weatherCache === "object") {
    out.weatherCache = s.weatherCache;
  }
  if (s.holidayCache && typeof s.holidayCache === "object") {
    out.holidayCache = s.holidayCache;
  }
  if (s.geocodeCache && typeof s.geocodeCache === "object") {
    out.geocodeCache = s.geocodeCache;
  }
  if (typeof s.hkHolidayFetchedAt === "number") {
    out.hkHolidayFetchedAt = s.hkHolidayFetchedAt;
  }
  out.inspirations.sort((a, b) => a.order - b.order);
  out.todos.sort((a, b) => a.order - b.order);
  out.documentLines.sort((a, b) => a.order - b.order);
  return out;
}

// src/diary-repository.ts
var import_obsidian = require("obsidian");

// src/date-utils.ts
var WEEKDAYS_ZH = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatLocalDate(d) {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}
function parseLocalDate(s) {
  if (typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}
function parseDateFromName(name, format) {
  const escaped = format.replace(/YYYY/g, "(\\d{4})").replace(/YY/g, "(\\d{2})").replace(/MM/g, "(\\d{1,2})").replace(/M/g, "(\\d{1,2})").replace(/DD/g, "(\\d{1,2})").replace(/D/g, "(\\d{1,2})");
  const re = new RegExp("^" + escaped + "$");
  const m = name.trim().match(re);
  if (!m) return null;
  const groups = format.match(/YYYY|YY|MM|M|DD|D/g) ?? [];
  let year = 0, month = 0, day = 0;
  groups.forEach((tok, i) => {
    const val = parseInt(m[i + 1], 10);
    if (tok === "YYYY") year = val;
    else if (tok === "YY") year = 2e3 + val;
    else if (tok === "MM" || tok === "M") month = val;
    else if (tok === "DD" || tok === "D") day = val;
  });
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
function daysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1];
}
function todayLocalDate() {
  const now = /* @__PURE__ */ new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
function compareLocalDate(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}
function diffDays(a, b) {
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / 864e5);
}
function addDays(d, n) {
  const base = Date.UTC(d.year, d.month - 1, d.day);
  const r = new Date(base + n * 864e5);
  return { year: r.getUTCFullYear(), month: r.getUTCMonth() + 1, day: r.getUTCDate() };
}
function addMonths(d, n) {
  let m = d.month - 1 + n;
  let y = d.year + Math.floor(m / 12);
  m = (m % 12 + 12) % 12;
  let day = d.day;
  const dim = daysInMonth(y, m + 1);
  if (day > dim) day = dim;
  return { year: y, month: m + 1, day };
}
function weekdayOf(d) {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}
function buildMonthGrid(year, month, weekStart) {
  const first = { year, month, day: 1 };
  const firstWeekday = weekdayOf(first);
  const leading = (firstWeekday - weekStart + 7) % 7;
  const start = addDays(first, -leading);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    cells.push({ date, inCurrentMonth: date.month === month && date.year === year });
  }
  return cells;
}
function formatDisplayDate(d, withWeekday = true) {
  const wd = withWeekday ? " " + WEEKDAYS_ZH[weekdayOf(d)] : "";
  return `${d.year}\u5E74${d.month}\u6708${d.day}\u65E5${wd}`;
}

// src/diary-template.ts
function buildDefaultDiaryContent(date, weatherNote) {
  const weekday = WEEKDAYS_ZH[weekdayOf(date)].replace("\u5468", "\u661F\u671F");
  const cleanWeather = (weatherNote ?? "").replace(/^\u5929\u6C14\s*[:\uFF1A]\s*/, "");
  const yamlWeather = cleanWeather ? `"${cleanWeather.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : '""';
  return `---
\u65E5\u671F: ${formatLocalDate(date)}
\u661F\u671F: ${weekday}
\u5FC3\u60C5: ""
\u5929\u6C14: ${yamlWeather}
---

## \u4ECA\u5929\u6700\u5927\u7684\u6536\u83B7\u662F\u4EC0\u4E48\uFF1F


## \u6709\u4EC0\u4E48\u9700\u8981\u53CD\u601D\u7684\uFF1F

`;
}
function isoWeekInfo(date) {
  const source = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const weekday = source.getUTCDay() || 7;
  source.setUTCDate(source.getUTCDate() + 4 - weekday);
  const year = source.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((source.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return { year, week };
}
function buildWeeklyReviewContent(date) {
  const info = isoWeekInfo(date);
  const mondayOffset = (weekdayOf(date) + 6) % 7;
  const monday = addDays(date, -mondayOffset);
  const sunday = addDays(monday, 6);
  return `---
\u7C7B\u578B: \u5468\u8BB0
\u5468\u6B21: ${info.year}-W${pad2(info.week)}
\u65E5\u671F\u8303\u56F4: "${formatLocalDate(monday)} \u2014 ${formatLocalDate(sunday)}"
\u5FC3\u60C5: ""
---

## \u672C\u5468\u5173\u952E\u8BCD


## \u505A\u5F97\u597D\u7684\u4E8B


## \u503C\u5F97\u8C03\u6574\u7684\u4E8B


## \u4E0B\u5468\u6700\u91CD\u8981\u7684\u4E00\u4EF6\u4E8B

`;
}
async function openOrCreateWeeklyReview(api, date) {
  const settings = api.getSettings();
  const info = isoWeekInfo(date);
  const folder = (0, import_obsidian.normalizePath)(`${settings.diaryFolder}/\u6BCF\u5468\u56DE\u987E`);
  await ensureFolderPath(api.app, folder);
  const path = (0, import_obsidian.normalizePath)(`${folder}/${info.year}-W${pad2(info.week)}.md`);
  let file = api.app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) {
    file = await api.app.vault.create(path, buildWeeklyReviewContent(date));
  }
  const target = settings.openDiaryIn;
  const leaf = api.app.workspace.getLeaf(target === "current" ? true : target);
  await leaf.openFile(file, { active: true });
}

// src/diary-repository.ts
var EXCERPT_MAX = 280;
function extractExcerpt(content) {
  let body = content;
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fm) body = body.slice(fm[0].length);
  const lines = body.split(/\r?\n/);
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) continue;
    if (/^:::\s/.test(trimmed)) continue;
    kept.push(trimmed);
  }
  let text = kept.join(" ").replace(/\s+/g, " ").trim();
  if (text.length > EXCERPT_MAX) text = text.slice(0, EXCERPT_MAX).trimEnd() + "\u2026";
  return text;
}
async function ensureFolderPath(app, folderPath) {
  const normalized = (0, import_obsidian.normalizePath)(folderPath);
  if (!normalized || normalized === "/") return;
  const parts = normalized.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = app.vault.getAbstractFileByPath(current);
    if (!existing) {
      await app.vault.createFolder(current);
    } else if (!(existing instanceof import_obsidian.TFolder)) {
      throw new Error(`${current} \u5DF2\u5B58\u5728\u4E14\u4E0D\u662F\u6587\u4EF6\u5939`);
    }
  }
}
var DiaryRepository = class {
  constructor(app, getSettings) {
    this.app = app;
    this.getSettings = getSettings;
    this.index = /* @__PURE__ */ new Map();
    this.dirty = true;
  }
  folderPath() {
    return (0, import_obsidian.normalizePath)(this.getSettings().diaryFolder);
  }
  dateFormat() {
    return this.getSettings().diaryDateFormat;
  }
  rebuildIndex() {
    const map = /* @__PURE__ */ new Map();
    const folder = this.app.vault.getAbstractFileByPath(this.folderPath());
    if (folder instanceof import_obsidian.TFolder) {
      this.walkFolder(folder, map);
    }
    for (const arr of map.values()) {
      if (arr.length > 1) arr.forEach((r) => r.conflict = true);
    }
    this.index = map;
    this.dirty = false;
  }
  walkFolder(folder, map) {
    for (const child of folder.children) {
      if (child instanceof import_obsidian.TFolder) {
        this.walkFolder(child, map);
        continue;
      }
      if (!(child instanceof import_obsidian.TFile) || child.extension !== "md") continue;
      const d = parseDateFromName(child.basename, this.dateFormat());
      if (!d) continue;
      const dateStr = formatLocalDate(d);
      const ref = {
        date: dateStr,
        path: child.path,
        modifiedAt: child.stat.mtime
      };
      const arr = map.get(dateStr) ?? [];
      arr.push(ref);
      map.set(dateStr, arr);
    }
  }
  ensureIndex() {
    if (this.dirty) this.rebuildIndex();
  }
  getEntriesForDate(date) {
    this.ensureIndex();
    return this.index.get(formatLocalDate(date)) ?? [];
  }
  hasEntry(date) {
    return this.getEntriesForDate(date).length > 0;
  }
  listAll() {
    this.ensureIndex();
    const out = [];
    for (const arr of this.index.values()) out.push(...arr);
    out.sort((a, b) => b.modifiedAt - a.modifiedAt);
    return out;
  }
  /** 最近 n 天（含今天），从近到远 */
  recentDaysWithStatus(n) {
    const today = todayLocalDate();
    const out = [];
    for (let i = 0; i < n; i++) {
      const date = addDays(today, -i);
      out.push({ date, entries: this.getEntriesForDate(date) });
    }
    return out;
  }
  async getExcerpt(ref) {
    const file = this.app.vault.getAbstractFileByPath(ref.path);
    if (!(file instanceof import_obsidian.TFile)) return "";
    return extractExcerpt(await this.app.vault.read(file));
  }
  async openDiary(ref, target) {
    const file = this.app.vault.getAbstractFileByPath(ref.path);
    if (!(file instanceof import_obsidian.TFile)) return;
    const leaf = this.app.workspace.getLeaf(target === "current" ? true : target);
    await leaf.openFile(file, { active: true });
  }
  async ensureFolder() {
    await ensureFolderPath(this.app, this.folderPath());
  }
  /** 创建（或返回已有）某天日记文件，不覆盖已有 */
  async createOrOpen(date, writeWeatherNote) {
    await this.ensureFolder();
    const path = (0, import_obsidian.normalizePath)(`${this.folderPath()}/${formatLocalDate(date)}.md`);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian.TFile) {
      return existing;
    }
    const content = buildDefaultDiaryContent(date, writeWeatherNote);
    const created = await this.app.vault.create(path, content);
    this.dirty = true;
    return created;
  }
  async createAndOpen(date, target, writeWeatherNote) {
    const file = await this.createOrOpen(date, writeWeatherNote);
    await this.openDiary(
      { date: formatLocalDate(date), path: file.path, modifiedAt: file.stat.mtime },
      target
    );
  }
  markChanged() {
    this.dirty = true;
  }
  /** Vault 事件入口 */
  handleVaultEvent(path) {
    const folder = this.folderPath();
    if (path === folder || path.startsWith(folder + "/")) {
      this.dirty = true;
    }
  }
};

// src/weather/open-meteo.ts
var import_obsidian2 = require("obsidian");
var FORECAST_TTL = 4 * 60 * 60 * 1e3;
var RECENT_TTL = 24 * 60 * 60 * 1e3;
var HISTORICAL_TTL = 30 * 24 * 60 * 60 * 1e3;
var PAST_DAYS = 7;
var FORECAST_DAYS = 16;
var WMO_TEXT = {
  0: "\u6674",
  1: "\u5927\u81F4\u6674\u6717",
  2: "\u5C40\u90E8\u591A\u4E91",
  3: "\u9634",
  45: "\u96FE",
  48: "\u96FE\u51C7",
  51: "\u5C0F\u6BDB\u6BDB\u96E8",
  53: "\u6BDB\u6BDB\u96E8",
  55: "\u5927\u6BDB\u6BDB\u96E8",
  56: "\u51BB\u6BDB\u6BDB\u96E8",
  57: "\u5F3A\u51BB\u6BDB\u6BDB\u96E8",
  61: "\u5C0F\u96E8",
  63: "\u4E2D\u96E8",
  65: "\u5927\u96E8",
  66: "\u51BB\u96E8",
  67: "\u5F3A\u51BB\u96E8",
  71: "\u5C0F\u96EA",
  73: "\u4E2D\u96EA",
  75: "\u5927\u96EA",
  77: "\u96EA\u7C92",
  80: "\u9635\u96E8",
  81: "\u5F3A\u9635\u96E8",
  82: "\u66B4\u96E8",
  85: "\u9635\u96EA",
  86: "\u5F3A\u9635\u96EA",
  90: "\u9635\u6027\u96F7\u96E8",
  95: "\u96F7\u66B4",
  96: "\u96F7\u66B4\u4F34\u5C0F\u51B0\u96F9",
  99: "\u96F7\u66B4\u4F34\u5927\u51B0\u96F9"
};
function weatherText(code) {
  if (code === void 0 || code === null) return "\u672A\u77E5";
  return WMO_TEXT[code] ?? "\u672A\u77E5";
}
function iconKind(code) {
  if (code === void 0 || code === null) return "cloud";
  if (code === 0) return "sun";
  if (code === 1) return "cloud-sun";
  if (code === 2) return "cloud-sun";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67 || code >= 80 && code <= 82) return "rain";
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return "snow";
  if (code >= 90) return "storm";
  return "cloud";
}
var ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/>',
  "cloud-sun": '<circle cx="8" cy="8" r="3"/><path d="M8 13a4 4 0 0 0 0 8h8a3.5 3.5 0 0 0 0-7"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 18"/>',
  fog: '<path d="M4 9h16M4 13h16M4 17h12"/>',
  drizzle: '<path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 14"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>',
  rain: '<path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 14"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  snow: '<path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 14"/><path d="M9 19h.01M12 21v-2M15 19h.01M12 19v2"/>',
  storm: '<path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 17 14"/><path d="M12 13l-2 4h3l-2 4"/>'
};
function weatherIconSvg(code, size = 18) {
  const kind = iconKind(code);
  const text = weatherText(code);
  const path = ICON_PATHS[kind] ?? ICON_PATHS.cloud;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${text}" focusable="false"><title>${text}</title>${path}</svg>`;
}
function convertTemp(celsius, unit) {
  if (celsius === void 0 || celsius === null) return void 0;
  return unit === "fahrenheit" ? Math.round(celsius * 9 / 5 + 32) : celsius;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function locKey(loc) {
  return `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
}
var WeatherService = class {
  constructor(getSettings, opts = {}) {
    this.getSettings = getSettings;
    this.fetcher = opts.fetcher ?? defaultFetcher;
    this.cache = opts.cacheStore ?? new MemoryWeatherCache();
    this.geocodeCache = opts.geocodeCacheStore ?? new MemoryGeocodeCache();
    this.onGeocodeCache = opts.onGeocodeCache;
    this.now = opts.now ?? (() => Date.now());
  }
  isConfigured() {
    return !!this.getSettings().location;
  }
  /* ----------------------- 地理编码 ----------------------- */
  async geocode(query) {
    const q = query.trim();
    if (!q) return [];
    const cached = this.geocodeCache.get(q);
    if (cached && cached.length) return cached;
    const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(q) + "&count=5&language=zh&format=json";
    const res = await this.fetcher(url);
    if (res.status !== 200 || !res.data || !Array.isArray(res.data.results)) return [];
    const locs = res.data.results.map((r) => ({
      name: String(r.name ?? q),
      admin1: r.admin1 ? String(r.admin1) : void 0,
      country: r.country ? String(r.country) : void 0,
      countryCode: r.country_code ? String(r.country_code) : void 0,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      timezone: r.timezone ? String(r.timezone) : "Asia/Shanghai"
    }));
    this.geocodeCache.set(q, locs);
    if (this.onGeocodeCache) this.onGeocodeCache(q, locs);
    return locs;
  }
  /* ----------------------- 数据获取 ----------------------- */
  parseDaily(data) {
    const d = data?.daily;
    if (!d || !Array.isArray(d.time)) return [];
    const out = [];
    const today = todayLocalDate();
    for (let i = 0; i < d.time.length; i++) {
      const dateStr = String(d.time[i]);
      const ld = parseLocalDate(dateStr);
      if (!ld) continue;
      const isPast = compareLocalDate(ld, today) < 0;
      out.push({
        date: dateStr,
        kind: isPast ? "recent" : "forecast",
        weatherCode: num(d.weather_code?.[i]),
        temperatureMax: num(d.temperature_2m_max?.[i]),
        temperatureMin: num(d.temperature_2m_min?.[i]),
        precipitationProbabilityMax: num(d.precipitation_probability_max?.[i]),
        precipitationSum: num(d.precipitation_sum?.[i])
      });
    }
    return out;
  }
  async ensureForecastWindow() {
    const loc = this.getSettings().location;
    if (!loc) return [];
    const key = `fw:${locKey(loc)}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.days;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=${encodeURIComponent(loc.timezone)}&past_days=${PAST_DAYS}&forecast_days=${FORECAST_DAYS}`;
    try {
      const res = await this.fetcher(url);
      if (res.status !== 200) throw new Error("\u5929\u6C14\u9884\u62A5\u8BF7\u6C42\u5931\u8D25: HTTP " + res.status);
      const days = this.parseDaily(res.data);
      const ttl = Math.min(FORECAST_TTL, RECENT_TTL);
      this.cache.set({ key, fetchedAt: this.now(), expiresAt: this.now() + ttl, days });
      return days;
    } catch (e) {
      if (cached) return cached.days;
      throw e;
    }
  }
  async ensureHistoricalMonth(year, month) {
    const loc = this.getSettings().location;
    if (!loc) return [];
    const key = `hist:${locKey(loc)}:${year}-${pad2(month)}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.days;
    const start = `${year}-${pad2(month)}-01`;
    const end = `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.latitude}&longitude=${loc.longitude}&start_date=${start}&end_date=${end}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeURIComponent(loc.timezone)}`;
    try {
      const res = await this.fetcher(url);
      if (res.status !== 200) throw new Error("\u5386\u53F2\u5929\u6C14\u8BF7\u6C42\u5931\u8D25: HTTP " + res.status);
      const d = res.data?.daily;
      const days = [];
      if (d && Array.isArray(d.time)) {
        for (let i = 0; i < d.time.length; i++) {
          const dateStr = String(d.time[i]);
          if (!parseLocalDate(dateStr)) continue;
          days.push({
            date: dateStr,
            kind: "historical",
            weatherCode: num(d.weather_code?.[i]),
            temperatureMax: num(d.temperature_2m_max?.[i]),
            temperatureMin: num(d.temperature_2m_min?.[i]),
            precipitationSum: num(d.precipitation_sum?.[i])
          });
        }
      }
      this.cache.set({ key, fetchedAt: this.now(), expiresAt: this.now() + HISTORICAL_TTL, days });
      return days;
    } catch (e) {
      if (cached) return cached.days;
      throw e;
    }
  }
  /** 获取某月可见天气（历史 / 近期预报 / 远期无数据） */
  async getWeatherForMonth(year, month) {
    const loc = this.getSettings().location;
    if (!loc) return [];
    const today = todayLocalDate();
    const lastDay = { year, month, day: daysInMonth(year, month) };
    const prefix = `${year}-${pad2(month)}-`;
    if (compareLocalDate(lastDay, today) < 0) {
      try {
        return (await this.ensureHistoricalMonth(year, month)).filter((d) => d.date.startsWith(prefix));
      } catch {
        return [];
      }
    }
    try {
      const window2 = await this.ensureForecastWindow();
      return window2.filter((d) => d.date.startsWith(prefix));
    } catch {
      return [];
    }
  }
  /** 最近 n 天天气（仅过去部分），用于首页卡片 */
  async getRecentWeather(n) {
    if (!this.getSettings().location) return [];
    try {
      const window2 = await this.ensureForecastWindow();
      const today = todayLocalDate();
      return window2.filter((d) => {
        const ld = parseLocalDate(d.date);
        return ld && compareLocalDate(ld, today) <= 0;
      }).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, n);
    } catch {
      return [];
    }
  }
  /** 单日天气 */
  async getWeatherForDate(date) {
    const days = await this.getWeatherForMonth(date.year, date.month);
    return days.find((d) => d.date === formatLocalDate(date));
  }
  /** 年视图月度天气摘要：过去与当前月度=历史/混合；未来=none */
  async getYearSummary(year) {
    const loc = this.getSettings().location;
    const out = [];
    if (!loc) {
      for (let m = 1; m <= 12; m++) out.push({ year, month: m, basedOn: "none" });
      return out;
    }
    const today = todayLocalDate();
    for (let m = 1; m <= 12; m++) {
      const lastDay = { year, month: m, day: daysInMonth(year, m) };
      if (compareLocalDate(lastDay, today) < 0) {
        try {
          const days = await this.ensureHistoricalMonth(year, m);
          out.push({ ...summarize(days, year, m), basedOn: "historical" });
        } catch {
          out.push({ year, month: m, basedOn: "none" });
        }
      } else if (year === today.year && m === today.month) {
        const days = [];
        try {
          days.push(...await this.ensureHistoricalMonth(year, m));
        } catch {
        }
        try {
          const fw = await this.ensureForecastWindow();
          days.push(...fw.filter((d) => d.date.startsWith(`${year}-${pad2(m)}-`)));
        } catch {
        }
        const uniq = dedupeByDate(days);
        out.push({ ...summarize(uniq, year, m), basedOn: uniq.length ? "mixed" : "none" });
      } else {
        out.push({ year, month: m, basedOn: "none" });
      }
    }
    return out;
  }
};
function summarize(days, year, month) {
  const withTemps = days.filter(
    (d) => typeof d.temperatureMax === "number" && typeof d.temperatureMin === "number"
  );
  if (withTemps.length === 0) {
    return { year, month, basedOn: "none" };
  }
  const avgMax = withTemps.reduce((s, d) => s + d.temperatureMax, 0) / withTemps.length;
  const avgMin = withTemps.reduce((s, d) => s + d.temperatureMin, 0) / withTemps.length;
  const precipDays = days.filter(
    (d) => (d.precipitationSum ?? 0) > 0 || (d.precipitationProbabilityMax ?? 0) >= 50
  ).length;
  return { year, month, avgMax: round1(avgMax), avgMin: round1(avgMin), precipDays, basedOn: "historical" };
}
function dedupeByDate(days) {
  const map = /* @__PURE__ */ new Map();
  for (const d of days) {
    const existing = map.get(d.date);
    if (!existing) map.set(d.date, d);
    else if (existing.kind !== "historical" && d.kind === "historical") map.set(d.date, d);
  }
  return Array.from(map.values());
}
function num(v) {
  if (v === void 0 || v === null || v === "" || typeof v === "number" && isNaN(v)) return void 0;
  const n = Number(v);
  return isNaN(n) ? void 0 : n;
}
function defaultFetcher(url) {
  return (0, import_obsidian2.requestUrl)({ url, method: "GET" }).then((r) => ({
    status: r.status,
    data: r.json ?? (r.text ? JSON.parse(r.text) : null)
  }));
}
var MemoryWeatherCache = class {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(entry) {
    this.map.set(entry.key, entry);
    if (this.map.size > 200) {
      let oldest = null;
      let oldestExp = Infinity;
      for (const [k, v] of this.map) {
        if (v.expiresAt < oldestExp) {
          oldestExp = v.expiresAt;
          oldest = k;
        }
      }
      if (oldest) this.map.delete(oldest);
    }
  }
};
var MemoryGeocodeCache = class {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  get(query) {
    return this.map.get(query);
  }
  set(query, results) {
    this.map.set(query, results);
  }
};

// src/holidays/holiday-service.ts
var import_obsidian3 = require("obsidian");
var CN_2025 = [
  { name: "\u5143\u65E6", off: ["2025-01-01", "2025-01-01"], workdays: [] },
  {
    name: "\u6625\u8282",
    off: ["2025-01-28", "2025-02-04"],
    workdays: ["2025-01-26", "2025-02-08"]
  },
  { name: "\u6E05\u660E\u8282", off: ["2025-04-04", "2025-04-06"], workdays: [] },
  {
    name: "\u52B3\u52A8\u8282",
    off: ["2025-05-01", "2025-05-05"],
    workdays: ["2025-04-27"]
  },
  { name: "\u7AEF\u5348\u8282", off: ["2025-05-31", "2025-06-02"], workdays: [] },
  {
    name: "\u56FD\u5E86\u8282\u3001\u4E2D\u79CB\u8282",
    off: ["2025-10-01", "2025-10-08"],
    workdays: ["2025-09-28", "2025-10-11"]
  }
];
var CN_2026 = [
  {
    name: "\u5143\u65E6",
    off: ["2026-01-01", "2026-01-03"],
    workdays: ["2026-01-04"]
  },
  {
    name: "\u6625\u8282",
    off: ["2026-02-15", "2026-02-23"],
    workdays: ["2026-02-14", "2026-02-28"]
  },
  { name: "\u6E05\u660E\u8282", off: ["2026-04-04", "2026-04-06"], workdays: [] },
  {
    name: "\u52B3\u52A8\u8282",
    off: ["2026-05-01", "2026-05-05"],
    workdays: ["2026-05-09"]
  },
  { name: "\u7AEF\u5348\u8282", off: ["2026-06-19", "2026-06-21"], workdays: [] },
  { name: "\u4E2D\u79CB\u8282", off: ["2026-09-25", "2026-09-27"], workdays: [] },
  {
    name: "\u56FD\u5E86\u8282",
    off: ["2026-10-01", "2026-10-07"],
    workdays: ["2026-09-20", "2026-10-10"]
  }
];
var CN_ANNOUNCED_YEARS = /* @__PURE__ */ new Set([2025, 2026]);
function expandRange(start, end) {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return [];
  const out = [];
  let cur = s;
  while (compareLocalDate(cur, e) <= 0) {
    out.push(formatLocalDate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}
function buildCnYear(year) {
  const festivals = year === 2025 ? CN_2025 : year === 2026 ? CN_2026 : [];
  const out = [];
  for (const f of festivals) {
    for (const d of expandRange(f.off[0], f.off[1])) {
      out.push({
        date: d,
        name: f.name,
        kind: "day-off",
        region: "CN",
        confirmed: true,
        source: "gov.cn"
      });
    }
    for (const w of f.workdays) {
      out.push({
        date: w,
        name: `${f.name} \u8865\u73ED`,
        kind: "adjusted-workday",
        region: "CN",
        confirmed: true,
        source: "gov.cn"
      });
    }
  }
  return out;
}
var HK_RAW = [
  // [date, summary]
  ["2025-01-01", "\u4E00\u6708\u4E00\u65E5"],
  ["2025-01-29", "\u519C\u5386\u5E74\u521D\u4E00"],
  ["2025-01-30", "\u519C\u5386\u5E74\u521D\u4E8C"],
  ["2025-01-31", "\u519C\u5386\u5E74\u521D\u4E09"],
  ["2025-04-04", "\u6E05\u660E\u8282"],
  ["2025-04-18", "\u8036\u7A23\u53D7\u96BE\u8282"],
  ["2025-04-19", "\u8036\u7A23\u53D7\u96BE\u8282\u7FCC\u65E5"],
  ["2025-04-21", "\u590D\u6D3B\u8282\u661F\u671F\u4E00"],
  ["2025-05-01", "\u52B3\u52A8\u8282"],
  ["2025-05-05", "\u4F5B\u8BDE"],
  ["2025-05-31", "\u7AEF\u5348\u8282"],
  ["2025-07-01", "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A\u6210\u7ACB\u7EAA\u5FF5\u65E5"],
  ["2025-10-01", "\u56FD\u5E86\u65E5"],
  ["2025-10-07", "\u4E2D\u79CB\u8282\u7FCC\u65E5"],
  ["2025-10-29", "\u91CD\u9633\u8282"],
  ["2025-12-25", "\u5723\u8BDE\u8282"],
  ["2025-12-26", "\u5723\u8BDE\u8282\u540E\u7B2C\u4E00\u4E2A\u5468\u65E5"],
  ["2026-01-01", "\u4E00\u6708\u4E00\u65E5"],
  ["2026-02-17", "\u519C\u5386\u5E74\u521D\u4E00"],
  ["2026-02-18", "\u519C\u5386\u5E74\u521D\u4E8C"],
  ["2026-02-19", "\u519C\u5386\u5E74\u521D\u4E09"],
  ["2026-04-03", "\u8036\u7A23\u53D7\u96BE\u8282"],
  ["2026-04-04", "\u8036\u7A23\u53D7\u96BE\u8282\u7FCC\u65E5"],
  ["2026-04-06", "\u6E05\u660E\u8282\u7FCC\u65E5"],
  ["2026-04-07", "\u590D\u6D3B\u8282\u661F\u671F\u4E00\u7FCC\u65E5"],
  ["2026-05-01", "\u52B3\u52A8\u8282"],
  ["2026-05-25", "\u4F5B\u8BDE\u7FCC\u65E5"],
  ["2026-06-19", "\u7AEF\u5348\u8282"],
  ["2026-07-01", "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A\u6210\u7ACB\u7EAA\u5FF5\u65E5"],
  ["2026-09-26", "\u4E2D\u79CB\u8282\u7FCC\u65E5"],
  ["2026-10-01", "\u56FD\u5E86\u65E5"],
  ["2026-10-19", "\u91CD\u9633\u8282\u7FCC\u65E5"],
  ["2026-12-25", "\u5723\u8BDE\u8282"],
  ["2026-12-26", "\u5723\u8BDE\u8282\u540E\u7B2C\u4E00\u4E2A\u5468\u65E5"],
  ["2027-01-01", "\u4E00\u6708\u4E00\u65E5"],
  ["2027-02-06", "\u519C\u5386\u5E74\u521D\u4E00"],
  ["2027-02-08", "\u519C\u5386\u5E74\u521D\u4E09"],
  ["2027-02-09", "\u519C\u5386\u5E74\u521D\u56DB"],
  ["2027-03-26", "\u8036\u7A23\u53D7\u96BE\u8282"],
  ["2027-03-27", "\u8036\u7A23\u53D7\u96BE\u8282\u7FCC\u65E5"],
  ["2027-03-29", "\u590D\u6D3B\u8282\u661F\u671F\u4E00"],
  ["2027-04-05", "\u6E05\u660E\u8282"],
  ["2027-05-01", "\u52B3\u52A8\u8282"],
  ["2027-05-13", "\u4F5B\u8BDE"],
  ["2027-06-09", "\u7AEF\u5348\u8282"],
  ["2027-07-01", "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A\u6210\u7ACB\u7EAA\u5FF5\u65E5"],
  ["2027-09-16", "\u4E2D\u79CB\u8282\u7FCC\u65E5"],
  ["2027-10-01", "\u56FD\u5E86\u65E5"],
  ["2027-10-08", "\u91CD\u9633\u8282"],
  ["2027-12-25", "\u5723\u8BDE\u8282"],
  ["2027-12-27", "\u5723\u8BDE\u8282\u540E\u7B2C\u4E00\u4E2A\u5468\u65E5"]
];
var HK_BUNDLED = HK_RAW.map(([date, name]) => ({
  date,
  endDateExclusive: formatLocalDate(addDays(parseLocalDate(date), 1)),
  name,
  uid: `${date}@1823.gov.hk`,
  language: "sc",
  timezone: "Asia/Hong_Kong",
  source: "hk-1823"
}));
var HK_EVENTS = HK_BUNDLED;
function setHongKongEvents(events) {
  if (Array.isArray(events) && events.length) HK_EVENTS = events;
}
function parseHongKongJson(text) {
  const cleaned = text.replace(/^﻿/, "");
  let json;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return [];
  }
  const vcal = json?.vcalendar;
  if (!Array.isArray(vcal)) return [];
  const vevents = [];
  for (const cal of vcal) {
    if (cal && Array.isArray(cal.vevent)) vevents.push(...cal.vevent);
  }
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const ev of vevents) {
    const dtstart = ev?.dtstart;
    const uid2 = typeof ev?.uid === "string" ? ev.uid : "";
    if (!Array.isArray(dtstart) || typeof dtstart[0] !== "string") continue;
    const date = dtstart[0];
    const dtend = ev?.dtend;
    const endDateExclusive = Array.isArray(dtend) && typeof dtend[0] === "string" ? dtend[0] : void 0;
    const summary = typeof ev?.summary === "string" ? ev.summary : "";
    if (!parseLocalDate(date) || !summary) continue;
    const key = uid2 ? uid2 : `${date}:${summary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lang = summary && /[一-龥]/.test(summary) ? "sc" : "en";
    out.push({
      date,
      endDateExclusive,
      name: summary,
      uid: uid2,
      language: lang,
      timezone: "Asia/Hong_Kong",
      source: "hk-1823"
    });
  }
  return out;
}
function cnYearHolidays(year) {
  return buildCnYear(year);
}
function hkYearHolidays(year) {
  return HK_EVENTS.filter((e) => e.date.startsWith(`${year}-`)).map((e) => ({
    date: e.date,
    name: e.name,
    kind: "public-holiday",
    region: "HK",
    confirmed: true,
    source: "hk-1823"
  }));
}
var HolidayService = class {
  constructor(getSettings, opts = {}) {
    this.getSettings = getSettings;
    this.fetcher = opts.fetcher ?? defaultFetcher2;
    this.cache = opts.cacheStore ?? new MemoryHolidayCache();
    this.onCache = opts.onCache;
  }
  isYearConfirmed(region, year) {
    if (region === "CN") return CN_ANNOUNCED_YEARS.has(year);
    if (region === "HK") return year >= 2025 && year <= 2027;
    return true;
  }
  async getHolidaysForYear(region, year) {
    const key = `${region}:${year}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    let list = [];
    if (region === "CN") {
      list = cnYearHolidays(year);
    } else if (region === "HK") {
      list = hkYearHolidays(year);
    } else {
      list = await this.fetchNager(region, year);
    }
    this.cache.set(key, list);
    if (this.onCache) this.onCache(key, list);
    return list;
  }
  async getHolidaysForMonth(region, year, month) {
    const all = await this.getHolidaysForYear(region, year);
    const prefix = `${year}-${String(month).padStart(2, "0")}-`;
    return all.filter((h) => h.date.startsWith(prefix));
  }
  /** 下一个放假（不含补班）。primaryRegion 为“主要假期地区” */
  async getNextHoliday(from) {
    const primary = this.getSettings().holidayRegion;
    const secondary = this.getSettings().holidaySecondary;
    const result = {};
    const pInfo = await this.nextDayOff(primary, from);
    if (pInfo) {
      result.primary = pInfo.holiday;
      result.daysToPrimary = diffDays(from, parseLocalDate(pInfo.holiday.date));
    }
    if (secondary && secondary !== primary) {
      const sInfo = await this.nextDayOff(secondary, from);
      if (sInfo) {
        result.secondary = sInfo.holiday;
        result.daysToSecondary = diffDays(from, parseLocalDate(sInfo.holiday.date));
      }
    }
    if (primary === "CN") {
      const wd = await this.nextAdjustedWorkday(from);
      if (wd) result.upcomingWorkday = wd;
    }
    return result;
  }
  async nextDayOff(region, from) {
    for (let y = from.year; y <= from.year + 2; y++) {
      const list = await this.getHolidaysForYear(region, y);
      const candidates = list.filter((h) => h.kind !== "adjusted-workday").filter((h) => {
        const d = parseLocalDate(h.date);
        return d && compareLocalDate(d, from) >= 0;
      }).sort((a, b) => a.date < b.date ? -1 : 1);
      if (candidates.length) return { holiday: candidates[0] };
    }
    return void 0;
  }
  async nextAdjustedWorkday(from) {
    for (let y = from.year; y <= from.year + 1; y++) {
      const list = await this.getHolidaysForYear("CN", y);
      const candidates = list.filter((h) => h.kind === "adjusted-workday").filter((h) => {
        const d = parseLocalDate(h.date);
        return d && compareLocalDate(d, from) >= 0;
      }).sort((a, b) => a.date < b.date ? -1 : 1);
      if (candidates.length) return candidates[0];
    }
    return void 0;
  }
  async fetchNager(region, year) {
    const url = `https://nagerholidays.com/api/v4/Holidays/${region}/${year}`;
    try {
      const res = await this.fetcher(url);
      if (res.status !== 200) return [];
      const arr = JSON.parse(res.text);
      if (!Array.isArray(arr)) return [];
      return arr.filter((i) => i && (i.global === true || !Array.isArray(i.counties) || i.counties.length === 0)).map((i) => ({
        date: String(i.date).slice(0, 10),
        name: String(i.name ?? ""),
        kind: Array.isArray(i.types) && i.types.includes("Public") ? "public-holiday" : "observance",
        region,
        confirmed: true,
        source: "nager"
      }));
    } catch {
      return [];
    }
  }
  /** 实时抓取 1823 官方公众假期（简/繁/英）。成功则覆盖运行时数据，并调用 onHolidayCache 持久化。 */
  async refreshHongKong(lang = "sc") {
    const urlMap = {
      sc: "https://www.1823.gov.hk/common/ical/sc.json",
      tc: "https://www.1823.gov.hk/common/ical/tc.json",
      en: "https://www.1823.gov.hk/common/ical/en.json"
    };
    try {
      const res = await this.fetcher(urlMap[lang]);
      if (res.status !== 200) return [];
      const events = parseHongKongJson(res.text);
      if (events.length) {
        setHongKongEvents(events);
        const byYear = /* @__PURE__ */ new Map();
        for (const e of events) {
          const y = parseLocalDate(e.date)?.year;
          if (!y) continue;
          const arr = byYear.get(y) ?? [];
          arr.push({
            date: e.date,
            name: e.name,
            kind: "public-holiday",
            region: "HK",
            confirmed: true,
            source: "hk-1823"
          });
          byYear.set(y, arr);
        }
        for (const [y, list] of byYear) {
          const key = `HK:${y}`;
          this.cache.set(key, list);
          if (this.onCache) this.onCache(key, list);
        }
      }
      return events;
    } catch {
      return [];
    }
  }
};
var MemoryHolidayCache = class {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    return this.map.get(key);
  }
  set(key, list) {
    this.map.set(key, list);
    if (this.map.size > 300) {
      const firstKey = this.map.keys().next().value;
      if (firstKey) this.map.delete(firstKey);
    }
  }
};
function defaultFetcher2(url) {
  return (0, import_obsidian3.requestUrl)({ url, method: "GET" }).then((r) => ({
    status: r.status,
    text: r.text ?? (r.json ? JSON.stringify(r.json) : "")
  }));
}

// src/home-view.ts
var import_obsidian4 = require("obsidian");

// src/home-diary-card.ts
function weekdayHeader(weekStart) {
  const order = weekStart === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  return order.map((i) => WEEKDAYS_ZH[i].replace("\u5468", ""));
}
function isWeekend(d, weekStart) {
  const w = weekdayOf(d);
  return weekStart === 1 ? w === 6 || w === 0 : w === 0 || w === 6;
}
function buildFestMap(holidays, year, month) {
  const map = /* @__PURE__ */ new Map();
  const dayOffKinds = /* @__PURE__ */ new Set(["day-off", "public-holiday"]);
  for (const h of holidays) {
    if (!h.date.startsWith(`${year}-${String(month).padStart(2, "0")}-`)) continue;
    if (h.kind === "adjusted-workday") {
      map.set(h.date, { ban: true });
    } else if (dayOffKinds.has(h.kind)) {
      const prevDate = formatLocalDate(addDays(parseLD(h.date), -1));
      const prev = holidays.find(
        (x) => x.date === prevDate && x.name === h.name && dayOffKinds.has(x.kind)
      );
      if (!prev) {
        map.set(h.date, { label: h.name.slice(0, 2) });
      }
    }
  }
  return map;
}
function parseLD(s) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { year: +m[1], month: +m[2], day: +m[3] } : null;
}
function parseFrontmatterField(content, field) {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return "";
  const m = fm[1].match(new RegExp("^" + field + "\\s*:\\s*(.*)$", "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["'\u201C\u201D]/, "").replace(/["'\u201C\u201D]$/, "");
}
function countBodyChars(content) {
  let body = content;
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fm) body = body.slice(fm[0].length);
  return body.split(/\r?\n/).filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("#");
  }).join("").replace(/\s+/g, "").length;
}
/** 首页日记卡片：显示「今天日记写了什么」，随日期与文件变动自动更新 */
async function renderTodayPreview(el, api, today) {
  el.empty();
  const entries = api.repo.getEntriesForDate(today);
  const ref = entries[0];
  let excerpt = "";
  let mood = "";
  let chars = 0;
  if (ref) {
    try {
      const file = api.repo.app.vault.getAbstractFileByPath(ref.path);
      if (file instanceof import_obsidian.TFile) {
        const raw = await api.repo.app.vault.cachedRead(file);
        mood = parseFrontmatterField(raw, "\u5FC3\u60C5");
        chars = countBodyChars(raw);
        excerpt = extractExcerpt(raw);
      }
    } catch {
    }
  }
  if (!excerpt) {
    el.addClass("dwh-diary__preview--empty");
    el.createDiv({
      cls: "dwh-diary__pv-empty",
      text: "\u4ECA\u5929\u8FD8\u6CA1\u5199\u3002\u70B9\u4E0A\u65B9\u6309\u94AE\u5F00\u59CB\u8BB0\u5F55\u3002"
    });
    return;
  }
  if (excerpt.length > 110) excerpt = excerpt.slice(0, 110).trimEnd() + "\u2026";
  const meta = el.createDiv({ cls: "dwh-diary__pv-meta" });
  if (mood) meta.createSpan({ cls: "dwh-diary__pv-mood", text: mood });
  meta.createSpan({
    cls: "dwh-diary__pv-count",
    text: chars > 0 ? "\u4ECA\u5929\u5DF2\u5199 " + chars + " \u5B57" : "\u4ECA\u5929\u5DF2\u8BB0\u5F55"
  });
  el.createDiv({ cls: "dwh-diary__pv-text", text: excerpt });
  const openBtn = el.createEl("button", {
    cls: "dwh-btn dwh-btn--ghost dwh-diary__pv-open",
    text: "\u7EE7\u7EED\u5199\u4ECA\u5929"
  });
  openBtn.addEventListener("click", () => void openOrCreate(api, today));
}
async function renderHomeDiaryCard(container, api, onOpenCalendar) {
  container.empty();
  container.addClass("dwh-diary");
  container.createEl("h2", { cls: "dwh-panel__title", text: "\u65E5\u8BB0" });
  const settings = api.getSettings();
  const today = todayLocalDate();
  const todayStr = formatLocalDate(today);
  const weekStart = settings.weekStartsOn;
  let todayWeather;
  if (settings.showWeather && api.weather.isConfigured()) {
    try {
      todayWeather = await api.weather.getWeatherForDate(today);
    } catch {
    }
  }
  const todayEl = container.createDiv({ cls: "dwh-diary__today" });
  const tday = todayEl.createDiv({ cls: "dwh-diary__tday", text: String(today.day) });
  const tmeta = todayEl.createDiv({ cls: "dwh-diary__tmeta" });
  tmeta.createDiv({
    cls: "dwh-diary__tmd1",
    text: `${today.month}\u6708 \xB7 ${WEEKDAYS_ZH[weekdayOf(today)]}`
  });
  if (todayWeather) {
    const wLine = tmeta.createDiv({ cls: "dwh-diary__tmd2" });
    const icon = wLine.createSpan({ cls: "dwh-diary__wicon" });
    icon.innerHTML = weatherIconSvg(todayWeather.weatherCode, 14);
    const hi = convertTemp(todayWeather.temperatureMax, settings.temperatureUnit);
    const lo = convertTemp(todayWeather.temperatureMin, settings.temperatureUnit);
    wLine.appendText(
      ` ${weatherText(todayWeather.weatherCode)} ${hi !== void 0 ? hi + "\xB0" : "\u2014"}/${lo !== void 0 ? lo + "\xB0" : "\u2014"}`
    );
  }
  const hasToday = api.repo.getEntriesForDate(today).length > 0;
  const writeBtn = tmeta.createEl("button", {
    cls: "dwh-btn dwh-btn--primary dwh-diary__write",
    text: hasToday ? "\u7EE7\u7EED\u4ECA\u5929" : "\u5199\u4ECA\u5929"
  });
  writeBtn.addEventListener("click", () => void openOrCreate(api, today));
  const previewEl = container.createDiv({ cls: "dwh-diary__preview" });
  void renderTodayPreview(previewEl, api, today);
  const calWrap = container.createDiv({ cls: "dwh-diary__mini-cal" });
  calWrap.createDiv({ cls: "dwh-diary__cal-title", text: `${today.month}\u6708 ${today.year}` });
  const grid = calWrap.createDiv({ cls: "dwh-diary__grid" });
  for (const w of weekdayHeader(weekStart)) {
    grid.createDiv({ cls: "dwh-diary__dw", text: w });
  }
  let festMap = /* @__PURE__ */ new Map();
  try {
    const holidays = await api.holidays.getHolidaysForMonth(
      settings.holidayRegion,
      today.year,
      today.month
    );
    festMap = buildFestMap(holidays, today.year, today.month);
  } catch {
  }
  const cells = buildMonthGrid(today.year, today.month, weekStart);
  for (const cell of cells) {
    const d = cell.date;
    const dStr = formatLocalDate(d);
    const classes = ["dwh-diary__cell"];
    if (!cell.inCurrentMonth) classes.push("dwh-diary__cell--mute");
    else if (isWeekend(d, weekStart)) classes.push("dwh-diary__cell--we");
    if (dStr === todayStr) classes.push("dwh-diary__cell--today");
    const el = grid.createDiv({ cls: classes.join(" ") });
    el.createDiv({ cls: "dwh-diary__cnum", text: String(d.day) });
    const fest = festMap.get(dStr);
    if (fest) {
      if (fest.ban) {
        el.createDiv({ cls: "dwh-diary__ban", text: "\u73ED" });
      } else if (fest.label) {
        el.createDiv({ cls: "dwh-diary__fest", text: fest.label });
      }
    }
    if (cell.inCurrentMonth && api.repo.hasEntry(d)) {
      const dot = el.createDiv({ cls: "dwh-diary__dot" });
      dot.setAttribute("title", "\u5DF2\u5199\u65E5\u8BB0");
    }
    if (cell.inCurrentMonth) {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.addEventListener("click", () => void openOrCreate(api, d));
    }
  }
  const foot = container.createDiv({ cls: "dwh-diary__foot" });
  const weeklyBtn = foot.createEl("button", {
    cls: "dwh-btn dwh-diary__weekly",
    text: "\u672C\u5468\u56DE\u987E"
  });
  weeklyBtn.addEventListener("click", () => void openOrCreateWeeklyReview(api, today));
  const calBtn = foot.createEl("button", {
    cls: "dwh-btn dwh-diary__open-cal",
    text: "\u6253\u5F00\u65E5\u5386"
  });
  calBtn.addEventListener("click", () => onOpenCalendar());
}
async function openOrCreate(api, d) {
  const entries = api.repo.getEntriesForDate(d);
  if (entries.length > 0) {
    await api.repo.openDiary(entries[0], api.getSettings().openDiaryIn);
  } else {
    await api.repo.createAndOpen(d, api.getSettings().openDiaryIn);
  }
}

// src/home-view.ts
var VIEW_TYPE_WORKSTATION_HOME = "dandan-workstation-home-view";
function uid() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
var TextInputModal = class extends import_obsidian4.Modal {
  constructor(app, titleText, placeholder, initial, onSubmit) {
    super(app);
    this.titleText = titleText;
    this.placeholder = placeholder;
    this.initial = initial;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("dwh-modal");
    contentEl.createEl("h3", { text: this.titleText, cls: "dwh-modal__title" });
    const input = new import_obsidian4.TextComponent(contentEl).setPlaceholder(this.placeholder).setValue(this.initial);
    input.inputEl.addClass("dwh-modal__input");
    const submit = () => {
      const value = input.getValue().trim();
      if (!value) {
        new import_obsidian4.Notice("\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      this.close();
      this.onSubmit(value);
    };
    input.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    });
    const actions = contentEl.createDiv({ cls: "dwh-modal__actions" });
    actions.createEl("button", { text: "\u53D6\u6D88", cls: "dwh-btn" }).addEventListener("click", () => this.close());
    const ok = actions.createEl("button", { text: "\u786E\u5B9A", cls: "dwh-btn dwh-btn--primary" });
    ok.addEventListener("click", submit);
    window.setTimeout(() => input.inputEl.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var MarkdownFileSuggestModal = class extends import_obsidian4.FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder("\u641C\u7D22 Markdown \u6587\u4EF6\u2026");
  }
  getItems() {
    return this.app.vault.getMarkdownFiles();
  }
  getItemText(file) {
    return file.path;
  }
  onChooseItem(file) {
    this.onChoose(file);
  }
};
function dayKeyOf(d) {
  return d.year + "-" + d.month + "-" + d.day;
}
var WorkstationHomeView = class extends import_obsidian4.ItemView {
  constructor(leaf, api) {
    super(leaf);
    this.confirmingDeleteInspiration = /* @__PURE__ */ new Set();
    this.confirmingDeleteLine = /* @__PURE__ */ new Set();
    this.renderedDayKey = "";
    this.contentTimer = 0;
    this.api = api;
  }
  getViewType() {
    return VIEW_TYPE_WORKSTATION_HOME;
  }
  getDisplayText() {
    return "\u5DE5\u4F5C\u53F0";
  }
  getIcon() {
    return "home";
  }
  async onOpen() {
    this.render();
    this.installAutoRefresh();
  }
  onunload() {
    this.confirmingDeleteInspiration.clear();
    this.confirmingDeleteLine.clear();
    if (this.contentTimer) window.clearTimeout(this.contentTimer);
  }
  /**
   * 让首页「每天自动变」：
   * 1. 每 30 秒检查一次本地日期，跨天立即重绘（Obsidian 长期挂着也不会停在昨天）
   * 2. 窗口重新获得焦点、切回首页标签时检查一次
   * 3. 日记文件夹里新增/删除/改名笔记时，1.2 秒后重绘（内容实时跟上）
   */
  installAutoRefresh() {
    const check = () => this.refreshIfStale();
    this.registerInterval(window.setInterval(check, 30 * 1e3));
    window.addEventListener("focus", check);
    this.register(() => window.removeEventListener("focus", check));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      if (leaf && leaf.view === this) check();
    }));
    const schedule = () => {
      if (this.contentTimer) window.clearTimeout(this.contentTimer);
      this.contentTimer = window.setTimeout(() => this.refreshIfStale(true), 1200);
    };
    const inDiary = (f) => {
      const folder = (this.api.getSettings().diaryFolder || "\u65E5\u8BB0").replace(/\/+$/, "");
      return f && f.path.startsWith(folder + "/");
    };
    this.registerEvent(this.app.vault.on("create", (f) => { if (inDiary(f)) schedule(); }));
    this.registerEvent(this.app.vault.on("delete", (f) => { if (inDiary(f)) schedule(); }));
    this.registerEvent(this.app.vault.on("rename", (f) => { if (inDiary(f)) schedule(); }));
    this.registerEvent(this.app.vault.on("modify", (f) => { if (inDiary(f)) schedule(); }));
    this.register(() => { if (this.contentTimer) window.clearTimeout(this.contentTimer); });
  }
  refreshIfStale(force = false) {
    if (!this.containerEl || !this.containerEl.isConnected) return;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME);
    if (!leaves.some((l) => l.view === this)) return;
    const key = dayKeyOf(todayLocalDate());
    const dayChanged = key !== this.renderedDayKey;
    if (!dayChanged && !force) return;
    if (!dayChanged) {
      const active = document.activeElement;
      if (active && this.containerEl.contains(active)) return;
    }
    this.render();
  }
  render() {
    const content = this.containerEl.children[1];
    content.empty();
    content.addClass("dwh-home");
    const greeting = "工作台";
    const hero = content.createDiv({ cls: "dwh-home__hero" });
    const heroCopy = hero.createDiv({ cls: "dwh-home__hero-copy" });
    heroCopy.createDiv({ cls: "dwh-home__eyebrow", text: "\u4E2A\u4EBA\u5DE5\u4F5C\u7AD9" });
    heroCopy.createEl("h1", { cls: "dwh-home__title", text: greeting });
    const dateLine = heroCopy.createDiv({ cls: "dwh-home__date" });
    dateLine.createSpan({ cls: "dwh-home__date-text", text: formatDisplayDate(todayLocalDate()) });
    this.renderedDayKey = dayKeyOf(todayLocalDate());
    const grid = content.createDiv({ cls: "dwh-home__grid" });
    const leftColumn = grid.createDiv({ cls: "dwh-home__left" });
    const inspirationPanel = leftColumn.createDiv({ cls: "dwh-panel dwh-inspiration" });
    const todoPanel = leftColumn.createDiv({ cls: "dwh-panel dwh-todos" });
    const documentLinesPanel = grid.createDiv({ cls: "dwh-panel dwh-document-lines" });
    const diaryPanel = grid.createDiv({ cls: "dwh-panel dwh-diary" });
    this.renderInspirations(inspirationPanel);
    this.renderTodos(todoPanel);
    this.renderDocumentLines(documentLinesPanel);
    void renderHomeDiaryCard(diaryPanel, this.api, () => this.onOpenCalendar?.());
  }
  data() {
    return this.api.getData();
  }
  installSortable(itemEl, handle, kind, id, list) {
    itemEl.dataset.dwhId = id;
    itemEl.dataset.dwhKind = kind;
    itemEl.draggable = true;
    handle.draggable = true;
    handle.setAttribute("aria-label", "\u62D6\u52A8\u5230\u5DE5\u4F5C\u4E2D\u8FFD\u52A0\u8FDB\u5C55\uFF0C\u4E5F\u53EF\u5728\u5217\u8868\u4E2D\u8C03\u6574\u987A\u5E8F");
    handle.setAttribute("title", "\u62D6\u52A8\u5230\u5DE5\u4F5C\u4E2D\u8FFD\u52A0\u8FDB\u5C55\uFF0C\u4E5F\u53EF\u5728\u5217\u8868\u4E2D\u8C03\u6574\u987A\u5E8F");
    const clearIndicators = () => {
      for (const el of Array.from(list.querySelectorAll(".dwh-sortable--before, .dwh-sortable--after"))) {
        el.classList.remove("dwh-sortable--before", "dwh-sortable--after");
      }
    };
    itemEl.addEventListener("dragstart", (e) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, input, textarea, select, [contenteditable=true]")) {
        e.preventDefault();
        return;
      }
      itemEl.addClass("dwh-sortable--dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "copyMove";
        e.dataTransfer.setData("text/plain", `${kind}:${id}`);
      }
    });
    itemEl.addEventListener("dragend", () => {
      itemEl.removeClass("dwh-sortable--dragging");
      clearIndicators();
    });
    itemEl.addEventListener("dragover", (e) => {
      const raw = e.dataTransfer?.getData("text/plain") ?? "";
      if (raw && !raw.startsWith(kind + ":")) return;
      e.preventDefault();
      clearIndicators();
      const after = e.clientY > itemEl.getBoundingClientRect().top + itemEl.getBoundingClientRect().height / 2;
      itemEl.addClass(after ? "dwh-sortable--after" : "dwh-sortable--before");
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    itemEl.addEventListener("drop", (e) => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData("text/plain") ?? "";
      clearIndicators();
      if (!raw.startsWith(kind + ":")) return;
      const sourceId = raw.slice(kind.length + 1);
      const after = e.clientY > itemEl.getBoundingClientRect().top + itemEl.getBoundingClientRect().height / 2;
      this.reorderItems(kind, sourceId, id, after);
    });
    let pressTimer;
    let touchActive = false;
    let touchTarget;
    let touchLineTarget;
    let touchPanelTarget;
    let touchAfter = false;
    let startX = 0;
    let startY = 0;
    const finishTouch = (commit) => {
      window.clearTimeout(pressTimer);
      itemEl.removeClass("dwh-sortable--dragging");
      clearIndicators();
      if (commit && touchActive && (touchLineTarget || touchPanelTarget)) {
        const collection = kind === "inspiration" ? this.data().inspirations : this.data().todos;
        const source = collection.find((item) => item.id === id);
        const line = touchLineTarget ? this.data().documentLines.find((item) => item.id === touchLineTarget.dataset.dwhLineId) : void 0;
        if (source && line) this.appendProgressStep(line, source.text);
        else if (source && touchPanelTarget) this.addDocumentLineFromSource(source.text);
      } else if (commit && touchActive && touchTarget && touchTarget !== id) {
        this.reorderItems(kind, id, touchTarget, touchAfter);
      }
      touchLineTarget?.removeClass("dwh-document-line--drop-target");
      touchPanelTarget?.removeClass("dwh-document-lines--drop-target");
      touchActive = false;
      touchTarget = void 0;
      touchLineTarget = void 0;
      touchPanelTarget = void 0;
    };
    handle.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      startX = e.clientX;
      startY = e.clientY;
      pressTimer = window.setTimeout(() => {
        touchActive = true;
        itemEl.addClass("dwh-sortable--dragging");
        handle.setPointerCapture(e.pointerId);
      }, 260);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!touchActive) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) window.clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();
      const hitElement = document.elementFromPoint(e.clientX, e.clientY);
      const lineHit = hitElement?.closest(".dwh-document-line");
      if (lineHit instanceof HTMLElement && lineHit.dataset.dwhLineId) {
        clearIndicators();
        touchLineTarget?.removeClass("dwh-document-line--drop-target");
        touchPanelTarget?.removeClass("dwh-document-lines--drop-target");
        touchLineTarget = lineHit;
        touchPanelTarget = void 0;
        touchTarget = void 0;
        lineHit.addClass("dwh-document-line--drop-target");
        return;
      }
      const panelHit = hitElement?.closest(".dwh-document-lines");
      if (panelHit instanceof HTMLElement) {
        clearIndicators();
        touchLineTarget?.removeClass("dwh-document-line--drop-target");
        touchLineTarget = void 0;
        touchPanelTarget?.removeClass("dwh-document-lines--drop-target");
        touchPanelTarget = panelHit;
        touchTarget = void 0;
        panelHit.addClass("dwh-document-lines--drop-target");
        return;
      }
      touchLineTarget?.removeClass("dwh-document-line--drop-target");
      touchPanelTarget?.removeClass("dwh-document-lines--drop-target");
      touchLineTarget = void 0;
      touchPanelTarget = void 0;
      const hit = hitElement?.closest(`[data-dwh-kind="${kind}"]`);
      if (!(hit instanceof HTMLElement)) return;
      clearIndicators();
      touchTarget = hit.dataset.dwhId;
      touchAfter = e.clientY > hit.getBoundingClientRect().top + hit.getBoundingClientRect().height / 2;
      hit.addClass(touchAfter ? "dwh-sortable--after" : "dwh-sortable--before");
    });
    handle.addEventListener("pointerup", () => finishTouch(true));
    handle.addEventListener("pointercancel", () => finishTouch(false));
  }
  reorderItems(kind, sourceId, targetId, after) {
    if (sourceId === targetId) return;
    const collection = kind === "inspiration" ? this.data().inspirations : this.data().todos;
    const ordered = [...collection].sort((a, b) => a.order - b.order);
    const sourceIndex = ordered.findIndex((item) => item.id === sourceId);
    if (sourceIndex < 0) return;
    const [source] = ordered.splice(sourceIndex, 1);
    const targetIndex = ordered.findIndex((item) => item.id === targetId);
    if (targetIndex < 0) return;
    ordered.splice(targetIndex + (after ? 1 : 0), 0, source);
    ordered.forEach((item, index) => item.order = index);
    if (kind === "inspiration") this.data().inspirations = ordered;
    else this.data().todos = ordered;
    void this.api.saveDataNow();
    this.render();
  }
  /* ----------------------------- 灵感 ----------------------------- */
  renderInspirations(container) {
    container.empty();
    container.createEl("h2", { text: "\u6211\u7684\u7075\u611F", cls: "dwh-panel__title" });
    const list = container.createDiv({ cls: "dwh-inspiration__list" });
    const items = this.data().inspirations;
    if (items.length === 0) {
      list.createDiv({ cls: "dwh-empty", text: "\u8FD8\u6CA1\u6709\u7075\u611F" });
    } else {
      for (const item of items) this.renderInspirationCard(list, item);
    }
    const addRow = container.createDiv({ cls: "dwh-inspiration__add" });
    const textarea = addRow.createEl("textarea", {
      cls: "dwh-inspiration__input",
      attr: { placeholder: "\u5199\u4E0B\u7075\u611F\uFF0C\u6309 Enter \u4FDD\u5B58\uFF0CShift + Enter \u6362\u884C", rows: "2" }
    });
    const addBtn = addRow.createEl("button", { text: "\u6DFB\u52A0", cls: "dwh-btn dwh-btn--primary" });
    const submit = () => {
      const value = textarea.value.trim();
      if (!value) return;
      this.addInspiration(value);
      textarea.value = "";
    };
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    addBtn.addEventListener("click", submit);
  }
  renderInspirationCard(list, item) {
    const card = list.createDiv({ cls: "dwh-inspiration-card" });
    const handle = card.createDiv({ cls: "dwh-drag-handle", text: "\u22EE\u22EE" });
    this.installSortable(card, handle, "inspiration", item.id, list);
    const textEl = card.createDiv({ cls: "dwh-inspiration-card__text", text: item.text });
    textEl.addEventListener("click", () => this.beginEditInspiration(card, item));
    const actions = card.createDiv({ cls: "dwh-inspiration-card__actions" });
    if (this.confirmingDeleteInspiration.has(item.id)) {
      actions.createEl("button", { text: "\u786E\u8BA4\u5220\u9664", cls: "dwh-btn dwh-btn--danger" }).addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteInspiration(item.id);
      });
      actions.createEl("button", { text: "\u53D6\u6D88", cls: "dwh-btn" }).addEventListener("click", (e) => {
        e.stopPropagation();
        this.confirmingDeleteInspiration.delete(item.id);
        this.render();
      });
    } else {
      const del = actions.createEl("button", { text: "\u5220\u9664", cls: "dwh-btn dwh-btn--ghost" });
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        this.confirmingDeleteInspiration.add(item.id);
        this.render();
      });
    }
  }
  beginEditInspiration(card, item) {
    const editor = card.createEl("textarea", { cls: "dwh-inspiration-card__editor", value: item.text });
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    const finish = (save) => {
      if (save) {
        const value = editor.value.trim();
        if (value && value !== item.text) {
          item.text = value;
          item.updatedAt = Date.now();
          void this.api.saveDataNow();
        }
      }
      this.render();
    };
    editor.addEventListener("blur", () => finish(true));
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
  }
  addInspiration(text) {
    const now = Date.now();
    const order = this.data().inspirations.length ? Math.max(...this.data().inspirations.map((i) => i.order)) + 1 : 0;
    this.data().inspirations.push({ id: uid(), text, createdAt: now, updatedAt: now, order });
    void this.api.saveDataNow();
    this.render();
    window.setTimeout(() => this.containerEl.querySelector(".dwh-inspiration__input")?.focus(), 0);
  }
  deleteInspiration(id) {
    this.data().inspirations = this.data().inspirations.filter((i) => i.id !== id);
    this.confirmingDeleteInspiration.delete(id);
    void this.api.saveDataNow();
    this.render();
  }
  /* ----------------------------- 待办 ----------------------------- */
  renderTodos(container) {
    container.empty();
    const header = container.createDiv({ cls: "dwh-panel__header" });
    header.createEl("h2", { text: "待办", cls: "dwh-panel__title" });
    const remaining = this.data().todos.filter((item) => !item.completed).length;
    header.createSpan({ cls: "dwh-todo__count", text: remaining ? `${remaining} 项未完成` : "全部完成" });
    const list = container.createDiv({ cls: "dwh-todo__list" });
    const items = [...this.data().todos].sort((a, b) => a.order - b.order);
    if (items.length === 0) {
      list.createDiv({ cls: "dwh-empty", text: "还没有待办" });
    } else {
      for (const item of items) this.renderTodoItem(list, item);
    }
    const addRow = container.createDiv({ cls: "dwh-todo__add" });
    const input = addRow.createEl("input", {
      type: "text",
      cls: "dwh-todo__input",
      attr: { placeholder: "添加一项待办，按 Enter 保存" }
    });
    const addBtn = addRow.createEl("button", { text: "添加", cls: "dwh-btn dwh-btn--primary" });
    const submit = () => {
      const value = input.value.trim();
      if (!value) return;
      this.addTodo(value);
      input.value = "";
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    addBtn.addEventListener("click", submit);
  }
  renderTodoItem(list, item) {
    const row = list.createDiv({ cls: "dwh-todo" + (item.completed ? " dwh-todo--done" : "") });
    const handle = row.createDiv({ cls: "dwh-drag-handle", text: "\u22EE\u22EE" });
    this.installSortable(row, handle, "todo", item.id, list);
    const checkbox = row.createEl("input", { type: "checkbox", cls: "dwh-todo__check" });
    checkbox.checked = item.completed;
    checkbox.setAttribute("aria-label", item.completed ? "标记为未完成" : "标记为已完成");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        this.deleteTodo(item.id);
        return;
      }
      item.completed = checkbox.checked;
      item.updatedAt = Date.now();
      void this.api.saveDataNow();
      this.render();
    });
    const text = row.createSpan({ cls: "dwh-todo__text", text: item.text });
    text.setAttribute("title", "单击编辑");
    text.addEventListener("click", () => this.beginEditTodo(row, item));
    const del = row.createEl("button", {
      text: "删除",
      cls: "dwh-btn dwh-btn--ghost dwh-todo__delete",
      attr: { "aria-label": `删除待办：${item.text}` }
    });
    del.addEventListener("click", () => this.deleteTodo(item.id));
  }
  beginEditTodo(row, item) {
    const text = row.querySelector(".dwh-todo__text");
    if (text) text.remove();
    const editor = row.createEl("input", { type: "text", cls: "dwh-todo__edit", value: item.text });
    const deleteButton = row.querySelector(".dwh-todo__delete");
    if (deleteButton) row.insertBefore(editor, deleteButton);
    editor.focus();
    editor.select();
    let finished = false;
    const finish = (save) => {
      if (finished) return;
      finished = true;
      if (save) {
        const value = editor.value.trim();
        if (value && value !== item.text) {
          item.text = value;
          item.updatedAt = Date.now();
          void this.api.saveDataNow();
        }
      }
      this.render();
    };
    editor.addEventListener("blur", () => finish(true));
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
  }
  addTodo(text) {
    const now = Date.now();
    const order = this.data().todos.length ? Math.max(...this.data().todos.map((item) => item.order)) + 1 : 0;
    this.data().todos.push({ id: uid(), text, completed: false, createdAt: now, updatedAt: now, order });
    void this.api.saveDataNow();
    this.render();
  }
  deleteTodo(id) {
    this.data().todos = this.data().todos.filter((item) => item.id !== id);
    void this.api.saveDataNow();
    this.render();
  }
  /* --------------------------- 工作中 --------------------------- */
  renderDocumentLines(container) {
    container.empty();
    const clearPanelDropState = () => container.removeClass("dwh-document-lines--drop-target");
    container.addEventListener("dragover", (e) => {
      if (e.target instanceof HTMLElement && e.target.closest(".dwh-document-line")) return;
      const types = Array.from(e.dataTransfer?.types ?? []).map((type) => type.toLowerCase());
      if (!types.includes("text/plain")) return;
      e.preventDefault();
      container.addClass("dwh-document-lines--drop-target");
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    });
    container.addEventListener("dragleave", (e) => {
      if (e.relatedTarget instanceof Node && container.contains(e.relatedTarget)) return;
      clearPanelDropState();
    });
    container.addEventListener("drop", (e) => {
      if (e.target instanceof HTMLElement && e.target.closest(".dwh-document-line")) return;
      clearPanelDropState();
      const source = this.findDraggedCard(e.dataTransfer);
      if (!source) return;
      e.preventDefault();
      e.stopPropagation();
      this.addDocumentLineFromSource(source.text);
    });
    const header = container.createDiv({ cls: "dwh-panel__header" });
    header.createEl("h2", { text: "\u5DE5\u4F5C\u4E2D", cls: "dwh-panel__title" });
    const addLineBtn = header.createEl("button", { text: "\u65B0\u5EFA\u5DE5\u4F5C\u9879", cls: "dwh-btn dwh-btn--primary" });
    addLineBtn.addEventListener("click", () => {
      new TextInputModal(this.app, "\u65B0\u5EFA\u5DE5\u4F5C\u9879", "\u5DE5\u4F5C\u540D\u79F0\uFF0C\u4F8B\u5982\uFF1A\u5C0F\u7A0B\u5E8F", "", (title) => this.addDocumentLine(title)).open();
    });
    const lines = this.data().documentLines;
    if (lines.length === 0) {
      container.createDiv({ cls: "dwh-empty", text: "\u8FD8\u6CA1\u6709\u5DE5\u4F5C\u9879\uFF0C\u53EF\u65B0\u5EFA\uFF0C\u6216\u628A\u7075\u611F\u6216\u5F85\u529E\u62D6\u5230\u8FD9\u91CC" });
      return;
    }
    for (const line of lines) this.renderDocumentLine(container, line);
  }
  findDraggedCard(dataTransfer) {
    const raw = dataTransfer?.getData("text/plain") ?? "";
    const separator = raw.indexOf(":");
    if (separator < 1) return void 0;
    const kind = raw.slice(0, separator);
    const id = raw.slice(separator + 1);
    if (!id || (kind !== "inspiration" && kind !== "todo")) return void 0;
    const collection = kind === "inspiration" ? this.data().inspirations : this.data().todos;
    return collection.find((item) => item.id === id);
  }
  renderDocumentLine(container, line) {
    if (!Array.isArray(line.steps)) line.steps = [];
    const wrap = container.createDiv({ cls: "dwh-document-line" });
    wrap.dataset.dwhLineId = line.id;
    const clearDropState = () => wrap.removeClass("dwh-document-line--drop-target");
    wrap.addEventListener("dragover", (e) => {
      const types = Array.from(e.dataTransfer?.types ?? []).map((type) => type.toLowerCase());
      if (!types.includes("text/plain")) return;
      e.preventDefault();
      wrap.addClass("dwh-document-line--drop-target");
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    });
    wrap.addEventListener("dragleave", (e) => {
      if (e.relatedTarget instanceof Node && wrap.contains(e.relatedTarget)) return;
      clearDropState();
    });
    wrap.addEventListener("drop", (e) => {
      clearDropState();
      const source = this.findDraggedCard(e.dataTransfer);
      if (!source) return;
      e.preventDefault();
      e.stopPropagation();
      this.appendProgressStep(line, source.text);
    });
    const head = wrap.createDiv({ cls: "dwh-document-line__head" });
    const titleEl = head.createEl("div", { cls: "dwh-document-line__title", text: line.title });
    titleEl.addEventListener("click", () => {
      new TextInputModal(this.app, "\u91CD\u547D\u540D\u5DE5\u4F5C\u9879", "\u5DE5\u4F5C\u540D\u79F0", line.title, (title) => {
        line.title = title;
        line.updatedAt = Date.now();
        void this.api.saveDataNow();
        this.render();
      }).open();
    });
    const headActions = head.createDiv({ cls: "dwh-document-line__head-actions" });
    const addExisting = headActions.createEl("button", { text: "\u5173\u8054\u6587\u6863", cls: "dwh-btn" });
    addExisting.addEventListener("click", () => {
      new MarkdownFileSuggestModal(this.app, (file) => this.addExistingDoc(line, file)).open();
    });
    const newDoc = headActions.createEl("button", { text: "\u65B0\u5EFA\u6587\u6863", cls: "dwh-btn" });
    newDoc.addEventListener("click", () => {
      new TextInputModal(
        this.app,
        "\u65B0\u5EFA\u6587\u6863\u5E76\u5173\u8054\u5230\u6B64\u9879",
        "\u6587\u6863\u540D\u79F0\uFF08\u81EA\u52A8\u8865\u5168 .md\uFF09",
        "",
        (name) => void this.createNewDoc(line, name)
      ).open();
    });
    const delLine = headActions.createEl("button", { text: "\u5220\u9664\u9879\u76EE", cls: "dwh-btn dwh-btn--ghost" });
    delLine.addEventListener("click", () => {
      if (this.confirmingDeleteLine.has(line.id)) this.deleteDocumentLine(line.id);
      else {
        this.confirmingDeleteLine.add(line.id);
        this.render();
      }
    });
    if (this.confirmingDeleteLine.has(line.id)) {
      wrap.createDiv({ cls: "dwh-document-line__warn" }).setText("\u5373\u5C06\u5220\u9664\u8FD9\u4E2A\u5DE5\u4F5C\u9879\uFF0C\u4F46\u4E0D\u4F1A\u5220\u9664\u5176\u4E2D\u7684\u5173\u8054\u6587\u6863\u3002");
    }
    const progress = wrap.createDiv({ cls: "dwh-progress" });
    const progressHead = progress.createDiv({ cls: "dwh-progress__head" });
    progressHead.createEl("div", { cls: "dwh-progress__title", text: "\u8FDB\u5C55" });
    progressHead.createEl("div", { cls: "dwh-progress__hint", text: "\u62D6\u5165\u7075\u611F\u6216\u5F85\u529E\uFF0C\u53EF\u8FFD\u52A0\u4E3A\u65B0\u8FDB\u5C55" });
    const track = progress.createDiv({ cls: "dwh-progress-track" });
    if (line.steps.length === 0) {
      track.createDiv({ cls: "dwh-progress-empty", text: "\u628A\u7075\u611F\u6216\u5F85\u529E\u62D6\u5230\u8FD9\u91CC\uFF0C\u6216\u70B9\u201C\u8FFD\u52A0\u8FDB\u5C55\u201D" });
    } else {
      line.steps.forEach((step, index) => {
        const stepEl = track.createDiv({ cls: "dwh-progress-step" });
        const box = stepEl.createDiv({ cls: "dwh-progress-step__box" });
        const meta = box.createDiv({ cls: "dwh-progress-step__meta" });
        meta.createSpan({ cls: "dwh-progress-step__number", text: `\u8FDB\u5C55 ${index + 1}` });
        if (index === line.steps.length - 1) meta.createSpan({ cls: "dwh-progress-step__current", text: "\u5F53\u524D" });
        box.createDiv({ cls: "dwh-progress-step__text", text: step.text });
      });
    }
    const appendBtn = track.createEl("button", { cls: "dwh-progress-add", attr: { "aria-label": "\u8FFD\u52A0\u540E\u7EED\u5DE5\u4F5C\u8FDB\u5C55" } });
    appendBtn.createSpan({ cls: "dwh-progress-add__plus", text: "+" });
    appendBtn.createSpan({ cls: "dwh-progress-add__label", text: "\u8FFD\u52A0\u8FDB\u5C55" });
    appendBtn.addEventListener("click", () => {
      new TextInputModal(this.app, "\u8FFD\u52A0\u8FDB\u5C55", "\u8BB0\u4E0B\u4E0B\u4E00\u6B65\u6216\u5F53\u524D\u72B6\u6001", "", (text) => this.appendProgressStep(line, text)).open();
    });
    if (line.documentPaths.length > 0) {
      const documents = wrap.createDiv({ cls: "dwh-linked-documents" });
      documents.createDiv({ cls: "dwh-linked-documents__title", text: "\u5173\u8054\u6587\u6863" });
      const docTrack = documents.createDiv({ cls: "dwh-document-line__track" });
      line.documentPaths.forEach((path, index) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        const exists = file instanceof import_obsidian4.TFile;
        const node = docTrack.createDiv({ cls: "dwh-document-node" + (exists ? "" : " dwh-document-node--missing") });
        const body = node.createDiv({ cls: "dwh-document-node__body" });
        if (exists) {
          const name = file instanceof import_obsidian4.TFile ? file.basename : path.split("/").pop() ?? path;
          const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
          body.createEl("div", { cls: "dwh-document-node__name", text: name });
          if (folder) body.createEl("div", { cls: "dwh-document-node__folder", text: folder });
          node.addEventListener("click", (e) => {
            if (e.target.closest(".dwh-document-node__controls")) return;
            void this.openFile(file);
          });
        } else {
          body.createEl("div", { cls: "dwh-document-node__name", text: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
          body.createEl("div", { cls: "dwh-document-node__folder", text: path });
        }
        const controls = node.createDiv({ cls: "dwh-document-node__controls" });
        const left = controls.createEl("button", { text: "\u2190", cls: "dwh-btn dwh-btn--icon" });
        left.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveNode(line, index, -1);
        });
        const right = controls.createEl("button", { text: "\u2192", cls: "dwh-btn dwh-btn--icon" });
        right.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveNode(line, index, 1);
        });
        const remove = controls.createEl("button", { text: "\u2715", cls: "dwh-btn dwh-btn--icon dwh-btn--danger" });
        remove.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeNode(line, index);
        });
      });
    }
  }
  appendProgressStep(line, text) {
    const value = typeof text === "string" ? text.trim() : "";
    if (!value) return;
    if (!Array.isArray(line.steps)) line.steps = [];
    const now = Date.now();
    line.steps.push({ id: uid(), text: value, createdAt: now, updatedAt: now });
    line.updatedAt = now;
    void this.api.saveDataNow();
    this.render();
  }
  addDocumentLineFromSource(text) {
    const title = typeof text === "string" ? text.trim() : "";
    if (!title) return;
    const now = Date.now();
    const order = this.data().documentLines.length ? Math.max(...this.data().documentLines.map((l) => l.order)) + 1 : 0;
    this.data().documentLines.push({ id: uid(), title, documentPaths: [], steps: [], createdAt: now, updatedAt: now, order });
    void this.api.saveDataNow();
    this.render();
  }
  addDocumentLine(title) {
    const now = Date.now();
    const order = this.data().documentLines.length ? Math.max(...this.data().documentLines.map((l) => l.order)) + 1 : 0;
    this.data().documentLines.push({ id: uid(), title, documentPaths: [], steps: [], createdAt: now, updatedAt: now, order });
    void this.api.saveDataNow();
    this.render();
  }
  deleteDocumentLine(id) {
    this.data().documentLines = this.data().documentLines.filter((l) => l.id !== id);
    this.confirmingDeleteLine.delete(id);
    void this.api.saveDataNow();
    this.render();
  }
  addExistingDoc(line, file) {
    if (line.documentPaths.includes(file.path)) {
      new import_obsidian4.Notice("\u8BE5\u6587\u6863\u5DF2\u5173\u8054\u5230\u8FD9\u4E2A\u5DE5\u4F5C\u9879");
      return;
    }
    line.documentPaths.push(file.path);
    line.updatedAt = Date.now();
    void this.api.saveDataNow();
    this.render();
  }
  async createNewDoc(line, rawName) {
    try {
      const folder = this.data().settings.defaultDocumentFolder || "\u7814\u7A76";
      const base = rawName.replace(/\.md$/i, "").trim();
      if (!base) {
        new import_obsidian4.Notice("\u6587\u6863\u540D\u4E0D\u80FD\u4E3A\u7A7A");
        return;
      }
      const path = (0, import_obsidian4.normalizePath)(`${folder}/${base}.md`);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof import_obsidian4.TFile) {
        new import_obsidian4.Notice("\u540C\u540D\u6587\u4EF6\u5DF2\u5B58\u5728\uFF0C\u5DF2\u76F4\u63A5\u5173\u8054\u5230\u5DE5\u4F5C\u9879");
        if (!line.documentPaths.includes(existing.path)) line.documentPaths.push(existing.path);
        line.updatedAt = Date.now();
        void this.api.saveDataNow();
        this.render();
        await this.openFile(existing);
        return;
      }
      await ensureFolderPath(this.app, folder);
      const file = await this.app.vault.create(path, `# ${base}

`);
      if (!line.documentPaths.includes(file.path)) line.documentPaths.push(file.path);
      line.updatedAt = Date.now();
      void this.api.saveDataNow();
      this.render();
      await this.openFile(file);
    } catch (e) {
      console.error("[dandan-workstation-home] \u65B0\u5EFA\u6587\u6863\u5931\u8D25", e);
      new import_obsidian4.Notice("\u65B0\u5EFA\u6587\u6863\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : String(e)));
    }
  }
  moveNode(line, index, dir) {
    const target = index + dir;
    if (target < 0 || target >= line.documentPaths.length) return;
    const arr = line.documentPaths;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    line.updatedAt = Date.now();
    void this.api.saveDataNow();
    this.render();
  }
  removeNode(line, index) {
    line.documentPaths.splice(index, 1);
    line.updatedAt = Date.now();
    void this.api.saveDataNow();
    this.render();
  }
  async openFile(file) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file, { active: true });
  }
};

// src/calendar/diary-calendar-view.ts
var import_obsidian5 = require("obsidian");

// src/calendar/cal-context.ts
function pickHolidayForCell(hols, primaryRegion) {
  if (!hols || hols.length === 0) return {};
  const primary = hols.find((h) => h.region === primaryRegion);
  const others = hols.filter((h) => h.region !== primaryRegion);
  return { main: primary ?? hols[0], secondary: others[0] };
}

// src/calendar/month-view.ts
function tempLabel(w, unit) {
  const hi = convertTemp(w.temperatureMax, unit);
  const lo = convertTemp(w.temperatureMin, unit);
  if (hi === void 0 && lo === void 0) return "";
  if (hi === void 0) return `\u2014/${lo}\xB0`;
  if (lo === void 0) return `${hi}\xB0/\u2014`;
  return `${hi}\xB0/${lo}\xB0`;
}
function shortHolidayLabel(h) {
  if (h.kind === "adjusted-workday") return { text: "\u73ED", cls: "dwh-cal-cell__work" };
  const name = h.name.length > 4 ? h.name.slice(0, 4) : h.name;
  return { text: name, cls: "dwh-cal-cell__hol" };
}
function renderMonthView(root, ctx) {
  root.empty();
  const { cursor, weekStart, settings } = ctx;
  const today = todayLocalDate();
  const wrap = root.createDiv({ cls: "dwh-cal-month" });
  const head = wrap.createDiv({ cls: "dwh-cal-month__head" });
  for (let i = 0; i < 7; i++) {
    const wd = (weekStart + i) % 7;
    const isWeekend2 = wd === 0 || wd === 6;
    head.createDiv({
      cls: "dwh-cal-month__wd" + (isWeekend2 ? " dwh-cal-month__wd--weekend" : ""),
      text: WEEKDAYS_ZH[wd]
    });
  }
  const gridEl = wrap.createDiv({ cls: "dwh-cal-month__grid" });
  const cells = buildMonthGrid(cursor.year, cursor.month, weekStart);
  for (const cell of cells) {
    const d = cell.date;
    const ds = formatLocalDate(d);
    const isToday = compareLocalDate(d, today) === 0;
    const isSelected = ctx.selected && compareLocalDate(d, ctx.selected) === 0;
    const isWeekend2 = weekdayOf(d) === 0 || weekdayOf(d) === 6;
    const cellEl = gridEl.createDiv({
      cls: "dwh-cal-cell" + (cell.inCurrentMonth ? "" : " dwh-cal-cell--muted") + (isToday ? " dwh-cal-cell--today" : "") + (isSelected ? " dwh-cal-cell--selected" : "") + (isWeekend2 ? " dwh-cal-cell--weekend" : "")
    });
    cellEl.setAttribute("role", "gridcell");
    cellEl.setAttribute("tabindex", "0");
    cellEl.setAttribute("aria-label", `${ds}`);
    cellEl.createDiv({ cls: "dwh-cal-cell__num", text: String(d.day) });
    const { main, secondary } = pickHolidayForCell(ctx.holidaysByDate.get(ds), ctx.primaryRegion);
    if (main && main.kind !== "adjusted-workday") {
      const lbl = shortHolidayLabel(main);
      const holEl = cellEl.createDiv({ cls: lbl.cls });
      holEl.setText(lbl.text);
      holEl.setAttribute("title", `${main.name}\uFF08${regionName(main.region)}\uFF09`);
      if (secondary && secondary.region !== main.region) {
        const tag = cellEl.createDiv({ cls: "dwh-cal-cell__src" });
        tag.setText(regionShort(secondary.region));
        tag.setAttribute("title", `${secondary.name}\uFF08${regionName(secondary.region)}\uFF09`);
      }
    } else if (main && main.kind === "adjusted-workday") {
      const workEl = cellEl.createDiv({ cls: "dwh-cal-cell__work" });
      workEl.setText("\u73ED");
      workEl.setAttribute("title", `${main.name}\uFF08${regionName(main.region)}\uFF09`);
    }
    const w = ctx.weatherByDate.get(ds);
    if (w) {
      const weatherEl = cellEl.createDiv({ cls: "dwh-cal-cell__weather" });
      const iconHolder = weatherEl.createSpan({ cls: "dwh-cal-cell__wicon" });
      iconHolder.innerHTML = weatherIconSvg(w.weatherCode, 16);
      const tl = tempLabel(w, settings.temperatureUnit);
      if (tl) {
        const t = weatherEl.createSpan({ cls: "dwh-cal-cell__temp" });
        t.setText(tl);
      }
      weatherEl.setAttribute("title", `${weatherText(w.weatherCode)} ${tl}\uFF08${weatherKindLabel(w.kind)}\uFF09`);
    } else if (settings.showWeather && ctx.api.weather.isConfigured()) {
      const dObj = parseSafe(ds);
      if (dObj && compareLocalDate(dObj, today) > 0 && diffDays3(today, dObj) > 16) {
        const noneEl = cellEl.createDiv({ cls: "dwh-cal-cell__nonet" });
        noneEl.setText("\u2014");
        noneEl.setAttribute("title", "\u6682\u65E0\u9884\u62A5");
      }
    }
    const entries = ctx.diaryByDate.get(ds) ?? [];
    if (entries.length > 0) {
      const dot = cellEl.createDiv({
        cls: "dwh-cal-cell__dot" + (entries[0].conflict ? " dwh-cal-cell__dot--conflict" : "")
      });
      dot.setAttribute(
        "title",
        entries.length > 1 ? `\u68C0\u6D4B\u5230 ${entries.length} \u4E2A\u65E5\u8BB0\u6587\u4EF6\uFF0C\u70B9\u51FB\u67E5\u770B` : "\u5DF2\u5199\u65E5\u8BB0"
      );
    }
    cellEl.addEventListener("click", () => ctx.onSelectDate(d, true));
    cellEl.addEventListener(
      "dblclick",
      () => ctx.onSelectDate(d, true)
      /* 由视图决定是否打开 */
    );
  }
}
function regionName(region) {
  if (region === "CN") return "\u5185\u5730";
  if (region === "HK") return "\u9999\u6E2F";
  return region;
}
function regionShort(region) {
  if (region === "CN") return "\u5185";
  if (region === "HK") return "\u6E2F";
  return region.slice(0, 2);
}
function weatherKindLabel(kind) {
  if (kind === "historical") return "\u5386\u53F2\u5929\u6C14";
  if (kind === "recent") return "\u8FD1\u671F\u5B9E\u51B5";
  return "\u5929\u6C14\u9884\u62A5";
}
function parseSafe(s) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: +m[1], month: +m[2], day: +m[3] };
}
function diffDays3(a, b) {
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / 864e5);
}

// src/calendar/year-view.ts
function renderYearView(root, ctx, summary) {
  root.empty();
  const { cursor, weekStart } = ctx;
  const year = cursor.year;
  const today = todayLocalDate();
  const wrap = root.createDiv({ cls: "dwh-cal-year" });
  const summaryEl = wrap.createDiv({ cls: "dwh-cal-year__summary" });
  const written = Array.from(ctx.diaryByDate.values()).filter((arr) => arr.length > 0).length;
  summaryEl.createDiv({ cls: "dwh-cal-year__stat", text: `\u5DF2\u5199\u65E5\u8BB0 ${written} \u5929` });
  let maxMonth = 0;
  let maxCount = 0;
  for (const [ds, arr] of ctx.diaryByDate) {
    if (ds.startsWith(`${year}-`)) {
      const cnt = arr.length;
      const m = parseInt(ds.slice(5, 7), 10);
      if (cnt > maxCount) {
        maxCount = cnt;
        maxMonth = m;
      }
    }
  }
  if (maxMonth > 0) {
    summaryEl.createDiv({ cls: "dwh-cal-year__stat", text: `\u8BB0\u5F55\u6700\u591A\uFF1A${maxMonth} \u6708` });
  }
  const nextHol = firstHolidayAfter(ctx, year);
  if (nextHol) {
    summaryEl.createDiv({
      cls: "dwh-cal-year__stat",
      text: `\u4E0B\u4E00\u6B21\u5047\u671F\uFF1A${nextHol.name}\uFF08${nextHol.date}\uFF09`
    });
  }
  const grid = wrap.createDiv({ cls: "dwh-cal-year__grid" });
  for (let m = 1; m <= 12; m++) {
    const mini = grid.createDiv({ cls: "dwh-cal-mini" });
    const titleRow = mini.createDiv({ cls: "dwh-cal-mini__title" });
    titleRow.setText(`${m} \u6708`);
    const sum = summary.find((s) => s.month === m);
    if (sum && sum.basedOn !== "none" && sum.avgMax !== void 0) {
      const wtag = mini.createDiv({ cls: "dwh-cal-mini__wsum" });
      const unit = ctx.settings.temperatureUnit === "fahrenheit" ? "\xB0F" : "\xB0";
      wtag.setText(`\u5747 ${sum.avgMax}${unit}/${sum.avgMin}${unit}`);
    }
    const cal = mini.createDiv({ cls: "dwh-cal-mini__grid" });
    const cells = buildMonthGrid(year, m, weekStart);
    for (const cell of cells) {
      const d = cell.date;
      const ds = formatLocalDate(d);
      const dayEl = cal.createDiv({
        cls: "dwh-cal-mini__day" + (cell.inCurrentMonth ? "" : " dwh-cal-mini__day--muted") + (compareLocalDate(d, today) === 0 ? " dwh-cal-mini__day--today" : "")
      });
      dayEl.setText(String(d.day));
      const entries = ctx.diaryByDate.get(ds);
      if (entries && entries.length) dayEl.addClass("dwh-cal-mini__day--written");
      const hols = ctx.holidaysByDate.get(ds);
      if (hols && hols.length && hols[0].kind !== "adjusted-workday") {
        dayEl.addClass("dwh-cal-mini__day--hol");
      }
      if (cell.inCurrentMonth) {
        dayEl.addEventListener("click", () => ctx.onSelectDate(d, true));
      }
    }
  }
}
function firstHolidayAfter(ctx, year) {
  const dates = Array.from(ctx.holidaysByDate.keys()).filter((ds) => ds.startsWith(`${year}-`)).sort();
  for (const ds of dates) {
    const hols = ctx.holidaysByDate.get(ds) ?? [];
    const off = hols.find((h) => h.kind !== "adjusted-workday");
    if (off) {
      const d = parse(ds);
      if (d && diffDays(todayLocalDate(), d) >= 0) return { name: off.name, date: ds };
    }
  }
  return void 0;
}
function parse(s) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: +m[1], month: +m[2], day: +m[3] };
}

// src/calendar/day-detail.ts
function regionName2(region) {
  if (region === "CN") return "\u5185\u5730";
  if (region === "HK") return "\u9999\u6E2F";
  return region;
}
function kindLabel(h) {
  if (h.kind === "adjusted-workday") return "\u8865\u73ED";
  if (h.kind === "public-holiday") return "\u516C\u4F17\u5047\u671F";
  if (h.kind === "day-off") return "\u653E\u5047";
  return " observance";
}
function weatherKindLabel2(kind) {
  if (kind === "historical") return "\u5386\u53F2\u5929\u6C14\uFF08\u518D\u5206\u6790/\u6A21\u578B\u6570\u636E\uFF0C\u975E\u8857\u9053\u5B9E\u6D4B\uFF09";
  if (kind === "recent") return "\u8FD1\u671F\u5B9E\u51B5";
  return "\u5929\u6C14\u9884\u62A5";
}
async function renderDayDetail(root, p) {
  root.empty();
  const { date, entries, weather, holidays, api } = p;
  root.createEl("div", { cls: "dwh-detail__date", text: formatDisplayDate(date) });
  const holWrap = root.createDiv({ cls: "dwh-detail__section" });
  holWrap.createEl("div", { cls: "dwh-detail__label", text: "\u8282\u5047\u65E5" });
  if (holidays.length === 0) {
    holWrap.createDiv({ cls: "dwh-detail__empty", text: "\u65E0" });
  } else {
    for (const h of holidays) {
      const row = holWrap.createDiv({ cls: "dwh-detail__hol" });
      const tag = row.createSpan({
        cls: "dwh-detail__hol-tag dwh-detail__hol-tag--" + (h.kind === "adjusted-workday" ? "work" : "off")
      });
      tag.setText(h.kind === "adjusted-workday" ? "\u73ED" : "\u4F11");
      row.createSpan({ cls: "dwh-detail__hol-name", text: h.name });
      row.createSpan({
        cls: "dwh-detail__hol-meta",
        text: `${regionName2(h.region)} \xB7 ${kindLabel(h)}${h.confirmed ? "" : " \xB7 \u5C1A\u672A\u786E\u8BA4"}`
      });
    }
  }
  const wWrap = root.createDiv({ cls: "dwh-detail__section" });
  wWrap.createEl("div", { cls: "dwh-detail__label", text: "\u5929\u6C14" });
  if (!api.getSettings().showWeather || !api.weather.isConfigured()) {
    wWrap.createDiv({ cls: "dwh-detail__empty", text: "\u672A\u5F00\u542F\u5929\u6C14\u6216\u5C1A\u672A\u8BBE\u7F6E\u5730\u70B9" });
  } else if (!weather) {
    const dObj = date;
    const today = /* @__PURE__ */ new Date();
    const todayL = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
    const beyond = diffDaysLocal(todayL, dObj);
    wWrap.createDiv({
      cls: "dwh-detail__empty",
      text: beyond > 16 ? "\u6682\u65E0\u9884\u62A5\uFF08\u8FDC\u671F\u4E0D\u4F2A\u9020\u5929\u6C14\uFF09" : "\u5929\u6C14\u6682\u65F6\u65E0\u6CD5\u66F4\u65B0\uFF08\u53EF\u80FD\u79BB\u7EBF\uFF09"
    });
  } else {
    const row = wWrap.createDiv({ cls: "dwh-detail__weather" });
    const icon = row.createSpan({ cls: "dwh-detail__wicon" });
    icon.innerHTML = weatherIconSvg(weather.weatherCode, 22);
    const info = row.createDiv({ cls: "dwh-detail__winfo" });
    const hi = convertTemp(weather.temperatureMax, api.getSettings().temperatureUnit);
    const lo = convertTemp(weather.temperatureMin, api.getSettings().temperatureUnit);
    info.createEl("div", {
      cls: "dwh-detail__wtemp",
      text: `${weatherText(weather.weatherCode)}\u3000${hi !== void 0 ? hi + "\xB0" : "\u2014"}/${lo !== void 0 ? lo + "\xB0" : "\u2014"}`
    });
    info.createEl("div", { cls: "dwh-detail__wkind", text: weatherKindLabel2(weather.kind) });
    if (weather.precipitationProbabilityMax !== void 0) {
      info.createEl("div", {
        cls: "dwh-detail__wprecip",
        text: `\u964D\u6C34\u6982\u7387 ${weather.precipitationProbabilityMax}%`
      });
    }
  }
  const dWrap = root.createDiv({ cls: "dwh-detail__section" });
  dWrap.createEl("div", { cls: "dwh-detail__label", text: "\u65E5\u8BB0" });
  if (entries.length === 0) {
    dWrap.createDiv({ cls: "dwh-detail__empty", text: "\u8FD8\u6CA1\u6709\u5199\u8FD9\u4E00\u5929" });
    const btn = dWrap.createEl("button", { cls: "dwh-btn dwh-btn--primary dwh-btn--block", text: "\u5199\u8FD9\u4E00\u5929" });
    btn.addEventListener("click", () => p.onCreate());
  } else {
    if (entries[0].conflict) {
      dWrap.createDiv({
        cls: "dwh-detail__warn",
        text: `\u68C0\u6D4B\u5230 ${entries.length} \u4E2A\u540C\u65E5\u671F\u6587\u4EF6\uFF0C\u8BF7\u9009\u62E9\u8981\u6253\u5F00\u7684\u65E5\u8BB0\uFF08\u4E0D\u4F1A\u81EA\u52A8\u5408\u5E76/\u5220\u9664\uFF09`
      });
    }
    for (const ref of entries) {
      const item = dWrap.createDiv({ cls: "dwh-detail__diary" });
      const name = item.createDiv({ cls: "dwh-detail__diary-name", text: ref.path.split("/").pop() ?? ref.path });
      const openBtn = item.createEl("button", { cls: "dwh-btn", text: "\u6253\u5F00" });
      openBtn.addEventListener("click", () => p.onOpen(ref));
    }
    if (!entries[0].conflict) {
      const excerpt = await api.repo.getExcerpt(entries[0]).catch(() => "");
      if (excerpt) {
        const ex = dWrap.createDiv({ cls: "dwh-detail__excerpt" });
        ex.setText(excerpt);
      }
    }
  }
}
function diffDaysLocal(a, b) {
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / 864e5);
}

// src/calendar/diary-calendar-view.ts
var VIEW_TYPE_DIARY_CALENDAR = "dandan-diary-calendar-view";
var DiaryCalendarView = class extends import_obsidian5.ItemView {
  constructor(leaf, api) {
    super(leaf);
    this.mode = "month";
    this.cursor = todayLocalDate();
    this.selected = todayLocalDate();
    this.detailOpen = true;
    this.status = "";
    this.renderToken = 0;
    this.api = api;
  }
  getViewType() {
    return VIEW_TYPE_DIARY_CALENDAR;
  }
  getDisplayText() {
    return "\u65E5\u8BB0\u65E5\u5386";
  }
  getIcon() {
    return "calendar-days";
  }
  async onOpen() {
    this.selected = todayLocalDate();
    this.render();
  }
  async onClose() {
  }
  /** 外部（设置变更）触发的重新渲染 */
  refresh() {
    this.render();
  }
  /** 由外部（首页“打开日历”/命令）调用，定位到某天并打开详情 */
  focusDate(d) {
    this.cursor = { year: d.year, month: d.month, day: 1 };
    this.selected = d;
    this.mode = "month";
    this.detailOpen = true;
    this.render();
  }
  /* ----------------------------- 渲染骨架 ----------------------------- */
  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("dwh-cal-root");
    const nav = root.createDiv({ cls: "dwh-cal__nav" });
    const prev = nav.createEl("button", { cls: "dwh-btn dwh-btn--icon", text: "\u2039" });
    prev.setAttribute("aria-label", "\u4E0A\u4E00\u4E2A");
    prev.addEventListener("click", () => this.navigate(-1));
    const next = nav.createEl("button", { cls: "dwh-btn dwh-btn--icon", text: "\u203A" });
    next.setAttribute("aria-label", "\u4E0B\u4E00\u4E2A");
    next.addEventListener("click", () => this.navigate(1));
    const title = nav.createDiv({ cls: "dwh-cal__title" });
    title.setText(this.mode === "month" ? `${this.cursor.year} \u5E74 ${this.cursor.month} \u6708` : `${this.cursor.year} \u5E74`);
    const todayBtn = nav.createEl("button", { cls: "dwh-btn", text: "\u4ECA\u5929" });
    todayBtn.addEventListener("click", () => this.goToday());
    const toggle = nav.createEl("button", { cls: "dwh-btn", text: this.mode === "month" ? "\u5E74" : "\u6708" });
    toggle.addEventListener("click", () => {
      this.mode = this.mode === "month" ? "year" : "month";
      this.render();
    });
    const spacer = nav.createDiv({ cls: "dwh-cal__spacer" });
    const locLabel = nav.createDiv({ cls: "dwh-cal__loc" });
    const loc = this.api.getSettings().location;
    locLabel.setText(loc ? `\u{1F4CD} ${loc.name}` : "\u672A\u8BBE\u7F6E\u5730\u70B9");
    const statusEl = nav.createDiv({ cls: "dwh-cal__status" });
    statusEl.setText(this.status);
    const refresh = nav.createEl("button", { cls: "dwh-btn dwh-btn--icon", text: "\u27F3" });
    refresh.setAttribute("aria-label", "\u5237\u65B0\u5929\u6C14\u4E0E\u5047\u671F");
    refresh.addEventListener("click", () => this.refreshData());
    const body = root.createDiv({ cls: "dwh-cal__body" });
    const main = body.createDiv({ cls: "dwh-cal__main" });
    const detail = body.createDiv({ cls: "dwh-cal__detail" });
    this.attachKeyboard(root);
    void this.renderContent(main, detail, title, statusEl);
  }
  async renderContent(main, detail, titleEl, statusEl) {
    const token = ++this.renderToken;
    const settings = this.api.getSettings();
    const weekStart = settings.weekStartsOn;
    const primary = settings.holidayRegion;
    const secondary = settings.holidaySecondary;
    let diaryByDate = /* @__PURE__ */ new Map();
    let holidaysByDate = /* @__PURE__ */ new Map();
    let weatherByDate = /* @__PURE__ */ new Map();
    let summary = [];
    try {
      const all = this.api.repo.listAll();
      for (const e of all) {
        const arr = diaryByDate.get(e.date) ?? [];
        arr.push(e);
        diaryByDate.set(e.date, arr);
      }
      if (this.mode === "month") {
        const mHols = await this.api.holidays.getHolidaysForMonth(primary, this.cursor.year, this.cursor.month);
        const hols = [...mHols];
        if (secondary && secondary !== primary) {
          hols.push(...await this.api.holidays.getHolidaysForMonth(secondary, this.cursor.year, this.cursor.month));
        }
        for (const h of hols) {
          const arr = holidaysByDate.get(h.date) ?? [];
          if (!arr.some((x) => x.region === h.region && x.name === h.name)) arr.push(h);
          holidaysByDate.set(h.date, arr);
        }
        const wDays = await this.api.weather.getWeatherForMonth(this.cursor.year, this.cursor.month);
        for (const w of wDays) weatherByDate.set(w.date, w);
      } else {
        const yHols = await this.api.holidays.getHolidaysForYear(primary, this.cursor.year);
        const hols = [...yHols];
        if (secondary && secondary !== primary) {
          hols.push(...await this.api.holidays.getHolidaysForYear(secondary, this.cursor.year));
        }
        for (const h of hols) {
          const arr = holidaysByDate.get(h.date) ?? [];
          if (!arr.some((x) => x.region === h.region && x.name === h.name)) arr.push(h);
          holidaysByDate.set(h.date, arr);
        }
        summary = await this.api.weather.getYearSummary(this.cursor.year);
      }
    } catch (e) {
      console.error("[dandan-diary-calendar] \u6570\u636E\u52A0\u8F7D\u5931\u8D25", e);
      this.status = "\u90E8\u5206\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF08\u53EF\u80FD\u79BB\u7EBF\uFF09\uFF0C\u5DF2\u663E\u793A\u53EF\u7528\u5185\u5BB9";
      statusEl.setText(this.status);
    }
    if (token !== this.renderToken) return;
    const ctx = {
      api: this.api,
      cursor: this.cursor,
      selected: this.selected,
      weekStart,
      settings,
      weatherByDate,
      holidaysByDate,
      diaryByDate,
      primaryRegion: primary,
      secondaryRegion: secondary,
      onSelectDate: (d, open) => this.onSelectDate(d, open),
      onOpenMonth: (y, m) => {
        this.cursor = { year: y, month: m, day: 1 };
        this.mode = "month";
        this.render();
      }
    };
    if (this.mode === "month") {
      renderMonthView(main, ctx);
    } else {
      renderYearView(main, ctx, summary);
    }
    titleEl.setText(this.mode === "month" ? `${this.cursor.year} \u5E74 ${this.cursor.month} \u6708` : `${this.cursor.year} \u5E74`);
    if (this.detailOpen && this.selected) {
      const ds = formatLocalDate(this.selected);
      const entries = diaryByDate.get(ds) ?? [];
      const hols = holidaysByDate.get(ds) ?? [];
      let weather;
      try {
        weather = await this.api.weather.getWeatherForDate(this.selected);
      } catch {
        weather = weatherByDate.get(ds);
      }
      if (token !== this.renderToken) return;
      void renderDayDetail(detail, {
        api: this.api,
        date: this.selected,
        entries,
        weather,
        holidays: hols,
        onOpen: (ref) => void this.api.repo.openDiary(ref, settings.openDiaryIn),
        onCreate: () => void this.openOrCreate(this.selected)
      });
    } else {
      detail.empty();
      detail.createDiv({ cls: "dwh-detail__placeholder", text: "\u9009\u62E9\u4E00\u4E2A\u65E5\u671F\u67E5\u770B\u8BE6\u60C5" });
    }
  }
  /* ----------------------------- 交互 ----------------------------- */
  navigate(dir) {
    if (this.mode === "month") {
      this.cursor = addMonths(this.cursor, dir);
    } else {
      this.cursor = { ...this.cursor, year: this.cursor.year + dir };
    }
    this.render();
  }
  goToday() {
    const t = todayLocalDate();
    this.cursor = { year: t.year, month: t.month, day: 1 };
    this.selected = t;
    this.mode = "month";
    this.detailOpen = true;
    this.render();
  }
  onSelectDate(d, openDetail) {
    this.selected = d;
    if (this.mode === "year") {
      this.mode = "month";
      this.cursor = { year: d.year, month: d.month, day: 1 };
    } else {
      this.cursor = { year: d.year, month: d.month, day: 1 };
    }
    this.detailOpen = openDetail;
    this.render();
  }
  async openOrCreate(d) {
    const entries = this.api.repo.getEntriesForDate(d);
    if (entries.length > 0) {
      await this.api.repo.openDiary(entries[0], this.api.getSettings().openDiaryIn);
      return;
    }
    let note;
    if (this.api.getSettings().writeWeatherIntoNewDiary) {
      try {
        const w = await this.api.weather.getWeatherForDate(d);
        if (w) note = `\u5929\u6C14\uFF1A${weatherText(w.weatherCode)}${w.temperatureMax !== void 0 ? " " + w.temperatureMax + "\xB0" : ""}`;
      } catch {
      }
    }
    await this.api.repo.createAndOpen(d, this.api.getSettings().openDiaryIn, note);
  }
  async refreshData() {
    this.status = "\u6B63\u5728\u5237\u65B0\u2026";
    this.render();
    try {
      const settings = this.api.getSettings();
      if (settings.holidayRegion === "HK" || settings.holidaySecondary === "HK") {
        await this.api.holidays.refreshHongKong("sc");
      }
      await this.api.saveDataNow();
    } catch (e) {
      console.error("[dandan-diary-calendar] \u5237\u65B0\u5931\u8D25", e);
    }
    this.status = "";
    this.render();
  }
  attachKeyboard(root) {
    root.addEventListener("keydown", (e) => {
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (!this.selected) return;
      let handled = true;
      if (e.key === "ArrowLeft") this.moveSelection(-1);
      else if (e.key === "ArrowRight") this.moveSelection(1);
      else if (e.key === "ArrowUp") this.moveSelection(-7);
      else if (e.key === "ArrowDown") this.moveSelection(7);
      else if (e.key === "Enter") void this.openOrCreate(this.selected);
      else if (e.key === "Escape") {
        if (this.detailOpen) {
          this.detailOpen = false;
          this.render();
        } else handled = false;
      } else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
  moveSelection(deltaDays) {
    if (!this.selected) return;
    if (this.mode === "year") {
      this.mode = "month";
      this.cursor = { year: this.selected.year, month: this.selected.month, day: 1 };
    }
    const next = addDays(this.selected, deltaDays);
    this.selected = next;
    if (next.month !== this.cursor.month || next.year !== this.cursor.year) {
      this.cursor = { year: next.year, month: next.month, day: 1 };
    }
    this.detailOpen = true;
    this.render();
  }
};

// src/settings-tab.ts
var import_obsidian6 = require("obsidian");
var HOLIDAY_REGIONS = [
  { value: "CN", label: "\u4E2D\u56FD\u5927\u9646\uFF08CN\uFF09" },
  { value: "HK", label: "\u4E2D\u56FD\u9999\u6E2F\uFF08HK\uFF09" },
  { value: "US", label: "\u7F8E\u56FD\uFF08US\uFF09" },
  { value: "JP", label: "\u65E5\u672C\uFF08JP\uFF09" },
  { value: "GB", label: "\u82F1\u56FD\uFF08GB\uFF09" },
  { value: "DE", label: "\u5FB7\u56FD\uFF08DE\uFF09" },
  { value: "FR", label: "\u6CD5\u56FD\uFF08FR\uFF09" },
  { value: "SG", label: "\u65B0\u52A0\u5761\uFF08SG\uFF09" }
];
var WorkstationSettingTab = class extends import_obsidian6.PluginSettingTab {
  constructor(app, api) {
    super(app, api);
    this.api = api;
  }
  refresh() {
    this.api.refreshViews();
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("dwh-settings");
    const s = this.api.getSettings();
    containerEl.createEl("h2", { text: "\u65E5\u8BB0", cls: "dwh-settings__group" });
    new import_obsidian6.Setting(containerEl).setName("\u542F\u52A8 Obsidian \u65F6\u6253\u5F00\u5DE5\u4F5C\u7AD9\u9996\u9875").addToggle(
      (t) => t.setValue(s.openOnStartup).onChange(async (v) => {
        s.openOnStartup = v;
        await this.api.saveDataNow();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u65E5\u8BB0\u6587\u4EF6\u5939").setDesc("\u65E5\u8BB0 Markdown \u6587\u4EF6\u6240\u5728\u6587\u4EF6\u5939\uFF08\u76F8\u5BF9\u4ED3\u5E93\u6839\u76EE\u5F55\uFF09\u3002").addText(
      (t) => t.setValue(s.diaryFolder).onChange(async (v) => {
        s.diaryFolder = v.trim() || "\u65E5\u8BB0";
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u65E5\u8BB0\u65E5\u671F\u683C\u5F0F").setDesc("\u7528\u4E8E\u751F\u6210\u548C\u8BC6\u522B\u65E5\u8BB0\u6587\u4EF6\u540D\uFF0C\u4F8B\u5982 YYYY-MM-DD\u3002").addText(
      (t) => t.setValue(s.diaryDateFormat).onChange(async (v) => {
        s.diaryDateFormat = v.trim() || "YYYY-MM-DD";
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u6BCF\u5468\u4ECE\u5468\u51E0\u5F00\u59CB").addDropdown(
      (d2) => d2.addOption("1", "\u5468\u4E00").addOption("0", "\u5468\u65E5").setValue(String(s.weekStartsOn)).onChange(async (v) => {
        s.weekStartsOn = v === "0" ? 0 : 1;
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u6253\u5F00\u65E5\u8BB0\u7684\u4F4D\u7F6E").setDesc("\u70B9\u51FB\u65E5\u671F\u201C\u6253\u5F00\u65E5\u8BB0\u201D\u65F6\u7684\u6253\u5F00\u65B9\u5F0F\u3002").addDropdown(
      (d2) => d2.addOption("current", "\u5F53\u524D\u6807\u7B7E").addOption("tab", "\u65B0\u6807\u7B7E").addOption("split", "\u5206\u680F").setValue(s.openDiaryIn).onChange(async (v) => {
        s.openDiaryIn = v;
        await this.api.saveDataNow();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u9996\u9875\u663E\u793A\u6700\u8FD1\u51E0\u7BC7\u65E5\u8BB0").addText(
      (t) => t.setValue(String(s.recentDiaryCount)).onChange(async (v) => {
        const n = parseInt(v, 10);
        s.recentDiaryCount = n > 0 ? n : 7;
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u521B\u5EFA\u65E5\u8BB0\u65F6\u5199\u5165\u5929\u6C14\u6458\u8981").setDesc("\u9ED8\u8BA4\u5173\u95ED\uFF0C\u907F\u514D\u5916\u90E8\u6570\u636E\u6C61\u67D3\u7B14\u8BB0\u6B63\u6587\u3002\u5F00\u542F\u540E\u4F1A\u5728\u6B63\u6587\u63D2\u5165\u5F53\u65E5\u5929\u6C14\u6458\u8981\u3002").addToggle(
      (t) => t.setValue(s.writeWeatherIntoNewDiary).onChange(async (v) => {
        s.writeWeatherIntoNewDiary = v;
        await this.api.saveDataNow();
      })
    );
    containerEl.createEl("h2", { text: "\u5929\u6C14", cls: "dwh-settings__group" });
    new import_obsidian6.Setting(containerEl).setName("\u542F\u7528\u5929\u6C14").setDesc("\u5173\u95ED\u540E\uFF0C\u9996\u9875\u4E0E\u65E5\u5386\u4E0D\u8BF7\u6C42\u4E5F\u4E0D\u663E\u793A\u5929\u6C14\u3002").addToggle(
      (t) => t.setValue(s.showWeather).onChange(async (v) => {
        s.showWeather = v;
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    const locSetting = new import_obsidian6.Setting(containerEl).setName("\u5929\u6C14\u5730\u70B9").setDesc("\u51B3\u5B9A\u5929\u6C14\u9884\u62A5\u4E0E\u5386\u53F2\u5929\u6C14\u7684\u5750\u6807\u3002\u4E0D\u4F1A\u6839\u636E IP \u6216\u7CFB\u7EDF\u8BED\u8A00\u81EA\u52A8\u731C\u6D4B\u3002");
    if (s.location) {
      locSetting.setDesc(`\u5F53\u524D\u5730\u70B9\uFF1A${s.location.name}\uFF08${s.location.latitude.toFixed(3)}, ${s.location.longitude.toFixed(3)} \xB7 ${s.location.timezone}\uFF09`);
    }
    locSetting.addButton(
      (b) => b.setButtonText("\u8BBE\u7F6E\u5929\u6C14\u5730\u70B9").onClick(() => void this.openLocationModal())
    );
    if (s.location) {
      locSetting.addButton(
        (b) => b.setButtonText("\u6E05\u9664\u5730\u70B9").onClick(async () => {
          s.location = void 0;
          await this.api.saveDataNow();
          this.display();
        })
      );
    }
    new import_obsidian6.Setting(containerEl).setName("\u6E29\u5EA6\u5355\u4F4D").addDropdown(
      (d2) => d2.addOption("celsius", "\u6444\u6C0F \xB0C").addOption("fahrenheit", "\u534E\u6C0F \xB0F").setValue(s.temperatureUnit).onChange(async (v) => {
        s.temperatureUnit = v;
        await this.api.saveDataNow();
        this.refresh();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u6E05\u9664\u5929\u6C14\u7F13\u5B58").setDesc("\u6E05\u9664\u672C\u5730\u5929\u6C14\u7F13\u5B58\uFF0C\u4E0B\u6B21\u5C06\u91CD\u65B0\u8BF7\u6C42\u3002").addButton(
      (b) => b.setButtonText("\u6E05\u9664").onClick(async () => {
        this.api.getData().weatherCache = {};
        await this.api.saveDataNow();
        new import_obsidian6.Notice("\u5929\u6C14\u7F13\u5B58\u5DF2\u6E05\u9664");
      })
    );
    containerEl.createEl("div", {
      cls: "dwh-settings__note",
      text: "\u5929\u6C14\u6570\u636E\u6765\u6E90\uFF1AOpen-Meteo\uFF08https://open-meteo.com\uFF09\u3002\u5386\u53F2\u5929\u6C14\u4E3A\u518D\u5206\u6790/\u6A21\u578B\u6570\u636E\uFF0C\u975E\u8857\u9053\u7EA7\u5B9E\u6D4B\u3002\u65E0\u9700 API Key\u3002"
    });
    containerEl.createEl("h2", { text: "\u8282\u5047\u65E5", cls: "dwh-settings__group" });
    new import_obsidian6.Setting(containerEl).setName("\u4E3B\u8981\u5047\u671F\u5730\u533A").setDesc("\u201C\u4E0B\u4E00\u4E2A\u5047\u671F\u201D\u4E0E\u9ED8\u8BA4\u6807\u8BB0\u6309\u6B64\u5730\u533A\u8BA1\u7B97\u3002").addDropdown((d2) => {
      HOLIDAY_REGIONS.forEach((r) => d2.addOption(r.value, r.label));
      d2.setValue(s.holidayRegion).onChange(async (v) => {
        s.holidayRegion = v;
        await this.api.saveDataNow();
        this.refresh();
      });
    });
    new import_obsidian6.Setting(containerEl).setName("\u540C\u65F6\u663E\u793A\u7B2C\u4E8C\u5730\u533A").setDesc("\u53EF\u9009\u540C\u65F6\u663E\u793A\u4E2D\u56FD\u9999\u6E2F/\u5185\u5730\u5047\u671F\uFF0C\u7528\u6765\u6E90\u6807\u7B7E\u533A\u5206\u3002").addDropdown((d2) => {
      d2.addOption("", "\u4E0D\u663E\u793A");
      HOLIDAY_REGIONS.forEach((r) => d2.addOption(r.value, r.label));
      d2.setValue(s.holidaySecondary).onChange(async (v) => {
        s.holidaySecondary = v;
        await this.api.saveDataNow();
        this.refresh();
      });
    });
    new import_obsidian6.Setting(containerEl).setName("\u5237\u65B0\u9999\u6E2F\u516C\u4F17\u5047\u671F").setDesc("\u4ECE 1823 \u5B98\u65B9\u63A5\u53E3\u91CD\u65B0\u6293\u53D6\u9999\u6E2F\u516C\u4F17\u5047\u671F\uFF08\u7B80\u4F53\uFF09\u3002").addButton(
      (b) => b.setButtonText("\u5237\u65B0").onClick(async () => {
        new import_obsidian6.Notice("\u6B63\u5728\u5237\u65B0\u9999\u6E2F\u516C\u4F17\u5047\u671F\u2026");
        await this.api.holidays.refreshHongKong("sc");
        await this.api.saveDataNow();
        new import_obsidian6.Notice("\u9999\u6E2F\u516C\u4F17\u5047\u671F\u5DF2\u66F4\u65B0");
        this.display();
      })
    );
    new import_obsidian6.Setting(containerEl).setName("\u6E05\u9664\u8282\u5047\u65E5\u7F13\u5B58").addButton(
      (b) => b.setButtonText("\u6E05\u9664").onClick(async () => {
        this.api.getData().holidayCache = {};
        await this.api.saveDataNow();
        new import_obsidian6.Notice("\u8282\u5047\u65E5\u7F13\u5B58\u5DF2\u6E05\u9664");
      })
    );
    const d = this.api.getData();
    const hkFetched = d.hkHolidayFetchedAt ? new Date(d.hkHolidayFetchedAt).toLocaleString() : "\u5C1A\u672A\u6293\u53D6\uFF08\u4F7F\u7528\u5185\u7F6E\u5FEB\u7167\uFF09";
    containerEl.createEl("div", {
      cls: "dwh-settings__note",
      text: `\u8282\u5047\u65E5\u6570\u636E\uFF1A\u4E2D\u56FD\u5927\u9646\u4F7F\u7528\u56FD\u52A1\u9662\u516C\u5E03\u5B89\u6392\uFF082025\u30012026 \u5DF2\u786E\u8BA4\uFF1B2027 \u5C1A\u672A\u516C\u5E03\u5C06\u663E\u793A\u201C\u5C1A\u672A\u786E\u8BA4\u201D\uFF09\uFF1B\u4E2D\u56FD\u9999\u6E2F\u4F7F\u7528 1823 \u5B98\u65B9\u516C\u4F17\u5047\u671F\uFF08\u5185\u7F6E\u5FEB\u7167\u8986\u76D6 2025\u20132027\uFF09\uFF1B\u5176\u4ED6\u5730\u533A\u4F7F\u7528 Nager Holidays\u3002\u9999\u6E2F\u6570\u636E\u6700\u8FD1\u6293\u53D6\uFF1A${hkFetched}\u3002\u9999\u6E2F\u4E3A\u72EC\u7ACB\u5730\u533A\uFF0C\u4E0D\u5957\u7528\u5185\u5730\u201C\u73ED/\u4F11\u201D\u89C4\u5219\u3002`
    });
  }
  async openLocationModal() {
    const modal = new import_obsidian6.Modal(this.app);
    modal.contentEl.addClass("dwh-modal");
    modal.contentEl.createEl("h3", { text: "\u8BBE\u7F6E\u5929\u6C14\u5730\u70B9", cls: "dwh-modal__title" });
    const input = new import_obsidian6.TextComponent(modal.contentEl).setPlaceholder("\u57CE\u5E02\u6216\u90AE\u7F16\uFF0C\u4F8B\u5982 \u4E0A\u6D77 / Hong Kong");
    const results = modal.contentEl.createDiv({ cls: "dwh-loc-results" });
    const search = async () => {
      results.empty();
      const q = input.getValue().trim();
      if (!q) return;
      try {
        const locs = await this.api.weather.geocode(q);
        if (!locs.length) {
          results.createDiv({ cls: "dwh-empty", text: "\u672A\u627E\u5230\u5730\u70B9" });
          return;
        }
        for (const l of locs) {
          const label = `${l.name}${l.admin1 ? " \xB7 " + l.admin1 : ""} \xB7 ${l.countryCode ?? l.country ?? ""}`;
          const btn = results.createEl("button", { cls: "dwh-btn dwh-btn--block", text: label });
          btn.addEventListener("click", async () => {
            this.api.getSettings().location = l;
            await this.api.saveDataNow();
            modal.close();
            this.display();
          });
        }
      } catch (e) {
        results.createDiv({ cls: "dwh-empty", text: "\u641C\u7D22\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC" });
      }
    };
    input.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void search();
      }
    });
    const actions = modal.contentEl.createDiv({ cls: "dwh-modal__actions" });
    actions.createEl("button", { text: "\u641C\u7D22", cls: "dwh-btn dwh-btn--primary" }).addEventListener("click", () => void search());
    actions.createEl("button", { text: "\u53D6\u6D88", cls: "dwh-btn" }).addEventListener("click", () => modal.close());
    modal.open();
  }
};

// src/main.ts
var WorkstationHomePlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.data = mergeAndValidateData(DEFAULT_DATA, null);
    this.saveTimer = null;
    this.refreshTimer = null;
  }
  async onload() {
    await this.loadPluginData();
    this.repo = new DiaryRepository(this.app, () => this.data.settings);
    this.weather = new WeatherService(() => this.data.settings, {
      cacheStore: this.makeWeatherCacheStore(),
      geocodeCacheStore: this.makeGeocodeCacheStore()
    });
    this.holidays = new HolidayService(() => this.data.settings, {
      cacheStore: this.makeHolidayCacheStore(),
      onCache: (key, list) => {
        this.data.holidayCache[key] = list;
        this.scheduleSave();
      }
    });
    this.registerView(VIEW_TYPE_WORKSTATION_HOME, (leaf) => {
      const v = new WorkstationHomeView(leaf, this);
      v.onOpenCalendar = () => void this.activateCalendar();
      return v;
    });
    this.registerView(VIEW_TYPE_DIARY_CALENDAR, (leaf) => new DiaryCalendarView(leaf, this));
    this.addCommand({
      id: "open-workstation-home",
      name: "\u6253\u5F00\u5DE5\u4F5C\u7AD9\u9996\u9875",
      callback: () => void this.activateHome()
    });
    this.addCommand({
      id: "open-diary-calendar",
      name: "\u6253\u5F00\u65E5\u8BB0\u65E5\u5386",
      callback: () => void this.activateCalendar()
    });
    this.addRibbonIcon("home", "\u6253\u5F00\u5DE5\u4F5C\u7AD9\u9996\u9875", () => void this.activateHome());
    this.addRibbonIcon("calendar-days", "\u6253\u5F00\u65E5\u8BB0\u65E5\u5386", () => void this.activateCalendar());
    this.addSettingTab(new WorkstationSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("create", (f) => {
        this.repo.handleVaultEvent(f.path);
        this.scheduleRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (f) => {
        this.repo.handleVaultEvent(f.path);
        this.scheduleRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (f, oldPath) => {
        this.repo.handleVaultEvent(f.path);
        this.repo.handleVaultEvent(oldPath);
        this.handleDocLineRename(f, oldPath);
        this.scheduleRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (f) => {
        this.repo.handleVaultEvent(f.path);
        this.scheduleRefresh();
      })
    );
    this.app.workspace.onLayoutReady(() => {
      if (this.data.settings.openOnStartup) void this.activateHome();
      void this.maybeRefreshHongKong();
    });
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORKSTATION_HOME);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DIARY_CALENDAR);
  }
  /* ----------------------- PluginApi ----------------------- */
  getSettings() {
    return this.data.settings;
  }
  getData() {
    return this.data;
  }
  async saveDataNow() {
    await this.savePluginData();
  }
  refreshViews() {
    this.refreshHomeViews();
    this.refreshCalendarViews();
  }
  /* ----------------------- 数据存取 ----------------------- */
  async loadPluginData() {
    try {
      const saved = await this.loadData();
      this.data = mergeAndValidateData(DEFAULT_DATA, saved);
    } catch (e) {
      console.error("[dandan-workstation-home] \u6570\u636E\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u56DE\u9000\u5B89\u5168\u9ED8\u8BA4\u503C", e);
      this.data = mergeAndValidateData(DEFAULT_DATA, null);
      new import_obsidian7.Notice("\u5DE5\u4F5C\u7AD9\u9996\u9875\uFF1A\u672C\u5730\u6570\u636E\u5F02\u5E38\uFF0C\u5DF2\u56DE\u9000\u5230\u5B89\u5168\u9ED8\u8BA4\u503C");
    }
  }
  async savePluginData() {
    try {
      await this.saveData(this.data);
    } catch (e) {
      console.error("[dandan-workstation-home] \u6570\u636E\u4FDD\u5B58\u5931\u8D25", e);
      new import_obsidian7.Notice("\u5DE5\u4F5C\u7AD9\u9996\u9875\uFF1A\u6570\u636E\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4ED3\u5E93\u6743\u9650");
    }
  }
  scheduleSave() {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      void this.savePluginData();
    }, 800);
  }
  scheduleRefresh() {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshViews();
    }, 400);
  }
  refreshHomeViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME)) {
      const view = leaf.view;
      if (view instanceof WorkstationHomeView) view.render();
    }
  }
  refreshCalendarViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_CALENDAR)) {
      const view = leaf.view;
      if (view instanceof DiaryCalendarView) view.refresh();
    }
  }
  handleDocLineRename(file, oldPath) {
    if (!(file instanceof import_obsidian7.TFile) || file.extension !== "md") return;
    let changed = false;
    for (const line of this.data.documentLines) {
      line.documentPaths = line.documentPaths.map((p) => p === oldPath ? file.path : p);
      if (line.documentPaths.some((p) => p === file.path)) changed = true;
    }
    if (changed) void this.savePluginData();
  }
  /* ----------------------- 视图激活（复用 leaf） ----------------------- */
  async activateHome() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_WORKSTATION_HOME, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
  async activateCalendar() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DIARY_CALENDAR)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_DIARY_CALENDAR, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
  /* ----------------------- 香港公众假期刷新 ----------------------- */
  async maybeRefreshHongKong() {
    const s = this.data.settings;
    if (s.holidayRegion !== "HK" && s.holidaySecondary !== "HK") return;
    const now = Date.now();
    const last = this.data.hkHolidayFetchedAt ?? 0;
    if (now - last < 7 * 24 * 60 * 60 * 1e3) return;
    try {
      await this.holidays.refreshHongKong("sc");
      this.data.hkHolidayFetchedAt = now;
      await this.savePluginData();
    } catch (e) {
      console.error("[dandan-workstation-home] \u9999\u6E2F\u5047\u671F\u5237\u65B0\u5931\u8D25\uFF08\u5C06\u4F7F\u7528\u5185\u7F6E\u5FEB\u7167\uFF09", e);
    }
  }
  /* ----------------------- 缓存后端（基于 data） ----------------------- */
  makeWeatherCacheStore() {
    return {
      get: (key) => this.data.weatherCache[key],
      set: (entry) => {
        this.data.weatherCache[entry.key] = entry;
        this.scheduleSave();
      }
    };
  }
  makeGeocodeCacheStore() {
    return {
      get: (query) => this.data.geocodeCache[query],
      set: (query, locs) => {
        this.data.geocodeCache[query] = locs;
        this.scheduleSave();
      }
    };
  }
  makeHolidayCacheStore() {
    return {
      get: (key) => this.data.holidayCache[key],
      set: (key, list) => {
        this.data.holidayCache[key] = list;
        this.scheduleSave();
      }
    };
  }
};

