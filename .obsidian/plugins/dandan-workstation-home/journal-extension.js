/* 可维护的日记与外观扩展；构建时接在现有稳定运行版本后。 */
const JOURNAL_VIEW = 'dandan-paper-journal';
const journalOb = require('obsidian');
const JOURNAL_HEADINGS = ['今天有什么要写的', '今天学到的东西', '今天有什么要反思的'];
function journalSection(line) {
  const h = line.replace(/^##\s+/, '').replace(/[？?：:]\s*$/, '').trim();
  if (['今天有什么要写的', '今天发生了什么'].includes(h)) return 0;
  if (['今天学到的东西', '今天最大的收获是什么', '今天最大的收获'].includes(h)) return 1;
  if (['今天有什么要反思的', '有什么需要反思的', '今天有什么需要反思的'].includes(h)) return 2;
  return -1;
}
function parseJournal(source) {
  const fm = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const meta = fm ? journalOb.parseYaml(fm[1]) || {} : {};
  if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('日记属性格式无法识别，请用原文编辑');
  const body = fm ? source.slice(fm[0].length) : source;
  const parts = ['', '', ''];
  let active = 0, fence = null;
  for (const line of body.split(/\r?\n/)) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      parts[active] += line + '\n'; continue;
    }
    const section = !fence && /^##\s+/.test(line) ? journalSection(line) : -1;
    if (section >= 0) { active = section; continue; }
    parts[active] += line + '\n';
  }
  return { meta, title: String(meta['标题'] ?? ''), mood: String(meta['心情'] ?? ''), weather: String(meta['天气'] ?? ''), parts: parts.map(p => p.replace(/^\n+|\n+$/g, '')) };
}
function serializeJournal(model, date) {
  const meta = { ...model.meta, '日期': model.meta['日期'] ?? date, '标题': model.title, '心情': model.mood, '天气': model.weather };
  return '---\n' + journalOb.stringifyYaml(meta).trimEnd() + '\n---\n\n' + JOURNAL_HEADINGS.map((h, i) => '## ' + h + '\n\n' + model.parts[i].replace(/^\n+|\n+$/g, '') + '\n').join('\n') + '\n';
}
function journalNewContent(date) {
  const ds = formatLocalDate(date);
  return serializeJournal({ meta: { '星期': WEEKDAYS_ZH[weekdayOf(date)].replace('周', '星期') }, title: '', mood: '', weather: '', parts: ['', '', ''] }, ds);
}
function journalEl(parent, tag, cls, text) {
  const el = parent.createEl(tag, { cls, text }); return el;
}
function journalButton(parent, text, callback, cls = '') {
  const el = journalEl(parent, 'button', 'dwh-btn ' + cls, text);
  el.type = 'button';
  el.addEventListener('click', () => Promise.resolve(callback()).catch(e => { console.error(e); new journalOb.Notice(e.message || '操作失败'); }));
  return el;
}
class PaperJournalView extends journalOb.ItemView {
  constructor(leaf, plugin) {
    super(leaf); this.plugin = plugin; this.path = ''; this.source = ''; this.dirty = false; this.revision = 0; this.savePromise = null; this.timer = null; this.navigating = false; this.loadToken = 0;
  }
  getViewType() { return JOURNAL_VIEW; }
  getDisplayText() { return '我的日记'; }
  getIcon() { return 'notebook-pen'; }
  getState() { return { path: this.path }; }
  async setState(state, result) {
    if (state && typeof state.path === 'string' && state.path) await this.openPath(state.path);
    if (super.setState) await super.setState(state, result);
  }
  async onOpen() {
    const root = this.contentEl || this.containerEl.children[1];
    let width = 0;
    const observer = new ResizeObserver(() => {
      if (root.clientWidth === width) return;
      width = root.clientWidth;
      for (const [i, area] of (this.areas || []).entries()) {
        area.style.height = 'auto'; area.style.height = Math.max(i === 0 ? 160 : 112, area.scrollHeight + 2) + 'px';
      }
    });
    observer.observe(root); this.register(() => observer.disconnect());
    this.registerEvent(this.app.vault.on('modify', file => {
      if (file.path === this.path && !this.savePromise) {
        if (!this.dirty) void this.loadPath(this.path);
        else if (this.status) this.status.textContent = '原文已变化，请先保存或处理冲突';
      }
    }));
    for (const event of ['create', 'delete', 'rename']) this.registerEvent(this.app.vault.on(event, () => { void this.renderStack(); }));
    this.register(() => { clearTimeout(this.timer); });
    if (this.path) await this.loadPath(this.path);
    else {
      const ref = this.plugin.repo.listAll().sort((a,b) => b.date.localeCompare(a.date))[0];
      if (ref) await this.loadPath(ref.path);
      else { const f = await this.plugin.repo.createOrOpen(todayLocalDate()); await this.loadPath(f.path); }
    }
  }
  async onClose() { clearTimeout(this.timer); await this.flush(); }
  async openPath(path) {
    if (this.navigating) return;
    this.navigating = true;
    try { if (await this.flush()) await this.loadPath(path); }
    finally { this.navigating = false; }
  }
  async loadPath(path) {
    const token = ++this.loadToken;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof journalOb.TFile)) throw new Error('找不到这篇日记');
    const source = await this.app.vault.read(file);
    const model = parseJournal(source);
    if (token !== this.loadToken) return;
    this.path = path; this.source = source; this.model = model; this.dirty = false;
    const draft = this.plugin.journalDrafts[path];
    if (draft) {
      this.model = draft.model; this.dirty = true; this.revision++;
      this.source = draft.source;
      new journalOb.Notice(draft.source === source ? '已恢复未保存的日记草稿' : '已恢复草稿；原文有变化，可另存草稿后处理');
    }
    this.render(); await this.renderStack();
  }
  render() {
    const root = this.contentEl || this.containerEl.children[1]; root.empty(); root.addClass('dwh-journal');
    const top = root.createDiv({ cls: 'dwh-journal__toolbar' });
    journalButton(top, '‹ 工作台', async () => { if (await this.flush()) await this.plugin.activateHome(); });
    journalEl(top, 'span', 'dwh-journal__name', '我的日记');
    const actions = top.createDiv({ cls: 'dwh-journal__actions' }); this.plugin.renderAppearance(actions);
    const layout = root.createDiv({ cls: 'dwh-journal__layout' });
    const aside = layout.createEl('aside', { cls: 'dwh-journal__aside' });
    const asideHead = aside.createDiv({ cls: 'dwh-journal__aside-head' }); journalEl(asideHead, 'h2', '', '最近的日记');
    journalButton(asideHead, '写今天', async () => { if (!await this.flush()) return; const f = await this.plugin.repo.createOrOpen(todayLocalDate()); await this.openPath(f.path); });
    const search = aside.createEl('input', { cls: 'dwh-journal__search', attr: { placeholder: '按日期或标题查找', 'aria-label': '查找日记' } });
    search.addEventListener('input', () => { this.search = search.value; void this.renderStack(); }); this.search = '';
    this.stack = aside.createDiv({ cls: 'dwh-journal__stack' });
    journalButton(aside, '查看日历', async () => { if (await this.flush()) await this.plugin.activateCalendar(); });
    const paper = layout.createDiv({ cls: 'dwh-journal__paper' });
    const date = this.path.split('/').pop().replace(/\.md$/, '');
    const parsed = parseDateFromName(date, this.plugin.getSettings().diaryDateFormat);
    journalEl(paper, 'div', 'dwh-journal__date', parsed ? `${parsed.year}年${parsed.month}月${parsed.day}日  ${WEEKDAYS_ZH[weekdayOf(parsed)].replace('周', '星期')}` : date);
    const titleLabel = paper.createEl('label', { cls: 'dwh-journal__title-label', text: '标题' });
    const title = titleLabel.createEl('input', { cls: 'dwh-journal__title', attr: { placeholder: '给今天起个标题', 'aria-label': '标题' } }); title.value = this.model.title;
    title.addEventListener('input', () => this.edit(() => { this.model.title = title.value; }));
    const meta = paper.createDiv({ cls: 'dwh-journal__meta' });
    for (const [key, name, hint] of [['mood', '心情', '自己写下此刻的心情'], ['weather', '天气', '自己写，例如晴，有微风']]) {
      const label = meta.createEl('label');
      label.createSpan({ cls: 'dwh-journal__meta-name', text: name + '：' });
      const input = label.createEl('input', { attr: { placeholder: hint, 'aria-label': name } }); input.value = this.model[key];
      input.addEventListener('input', () => this.edit(() => { this.model[key] = input.value; }));
    }
    this.areas = [];
    JOURNAL_HEADINGS.forEach((heading, i) => {
      const block = paper.createEl('section', { cls: 'dwh-journal__section' });
      const label = block.createEl('label', { text: heading });
      const area = label.createEl('textarea', { cls: 'dwh-journal__writing', attr: { 'aria-label': heading, placeholder: '在这里写下……', spellcheck: 'false' } });
      area.value = this.model.parts[i]; this.areas.push(area);
      const size = () => { area.style.height = 'auto'; area.style.height = Math.max(i === 0 ? 160 : 112, area.scrollHeight + 2) + 'px'; };
      area.addEventListener('input', () => { size(); this.edit(() => { this.model.parts[i] = area.value; }); });
      requestAnimationFrame(size);
    });
    const foot = paper.createDiv({ cls: 'dwh-journal__footer' });
    this.prev = journalButton(foot, '‹ 上一篇', () => this.adjacent(1));
    this.status = journalEl(foot, 'span', 'dwh-journal__status', this.dirty ? '已恢复草稿，等待保存' : '已保存');
    this.next = journalButton(foot, '下一篇 ›', () => this.adjacent(-1));
    const tools = root.createDiv({ cls: 'dwh-journal__tools' });
    journalButton(tools, '保存', () => this.flush());
    journalButton(tools, '在原文中打开', async () => { if (!await this.flush()) return; const file = this.app.vault.getAbstractFileByPath(this.path); const leaf = this.app.workspace.getLeaf('tab'); await leaf.openFile(file, { active: true }); });
    journalButton(tools, '另存草稿', () => this.saveDraftAsFile());
  }
  async renderStack() {
    if (!this.stack || !this.path) return;
    const token = this.stackToken = (this.stackToken || 0) + 1;
    const entries = this.plugin.repo.listAll().sort((a,b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));
    this.entries = entries;
    const models = await Promise.all(entries.map(async ref => {
      const file = this.app.vault.getAbstractFileByPath(ref.path);
      if (!file) return null;
      try { const content = await this.app.vault.cachedRead(file); const model = parseJournal(content); return {ref, model, excerpt: extractExcerpt(content)}; } catch { return {ref, model: {title: ''}, excerpt: '点击在日记中查看'}; }
    }));
    if (token !== this.stackToken) return;
    this.stack.empty();
    const term = (this.search || '').trim().toLowerCase();
    const shown = models.filter(Boolean).filter(x => !term || (x.ref.date + x.model.title).toLowerCase().includes(term));
    const count = term ? shown.length : Math.max(7, this.plugin.getSettings().recentDiaryCount || 7);
    for (const { ref, model, excerpt } of shown.slice(0, count)) {
      const card = journalButton(this.stack, '', () => this.openPath(ref.path), 'dwh-journal__sheet' + (ref.path === this.path ? ' is-selected' : ''));
      card.setAttribute('aria-current', ref.path === this.path ? 'page' : 'false');
      journalEl(card, 'strong', 'dwh-journal__sheet-date', ref.date);
      if (model.title) journalEl(card, 'span', 'dwh-journal__sheet-title', model.title);
      journalEl(card, 'span', 'dwh-journal__sheet-excerpt', excerpt || '还没有写下内容');
    }
    if (!shown.length) journalEl(this.stack, 'p', '', '没有找到日记');
    const index = entries.findIndex(x => x.path === this.path);
    if (this.prev) this.prev.disabled = index < 0 || index >= entries.length - 1;
    if (this.next) this.next.disabled = index <= 0;
  }
  async adjacent(delta) { const i = this.entries.findIndex(x => x.path === this.path); const ref = this.entries[i + delta]; if (ref) await this.openPath(ref.path); }
  edit(change) {
    change(); this.dirty = true; this.revision++;
    this.status.textContent = '未保存'; clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, 800);
  }
  async flush() {
    clearTimeout(this.timer);
    if (this.savePromise) { const result = await this.savePromise; if (!result) return false; }
    if (!this.dirty || !this.path) return true;
    const path = this.path, source = this.source, revision = this.revision;
    const model = JSON.parse(JSON.stringify(this.model));
    this.status.textContent = '保存中…';
    this.savePromise = (async () => {
      try {
        this.plugin.journalDrafts[path] = { source, model };
        await this.plugin.saveJournalDrafts();
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof journalOb.TFile)) throw new Error('原文件已移除，草稿已保留');
        const date = model.meta['日期'] || path.split('/').pop().replace(/\.md$/, '');
        const output = serializeJournal(model, date);
        await this.app.vault.process(file, current => {
          if (current !== source) throw new Error('原文已被其他窗口修改，草稿已保留；请另存草稿后处理');
          return output;
        });
        this.source = output;
        if (revision === this.revision) this.dirty = false;
        delete this.plugin.journalDrafts[path]; await this.plugin.saveJournalDrafts();
        this.status.textContent = this.dirty ? '未保存' : '已保存 ' + new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
        return true;
      } catch (e) { this.status.textContent = e.message; new journalOb.Notice(e.message); return false; }
    })();
    const ok = await this.savePromise; this.savePromise = null;
    if (ok && this.dirty) return this.flush();
    if (ok) void this.renderStack();
    return ok;
  }
  async saveDraftAsFile() {
    const base = this.path.replace(/\.md$/, '') + '-草稿-' + Date.now() + '.md';
    await this.app.vault.create(base, serializeJournal(this.model, this.model.meta['日期'] || this.path.split('/').pop().replace(/\.md$/, '')));
    new journalOb.Notice('草稿已另存为 ' + base);
  }
}
async function installPaperJournal(plugin) {
  const base = plugin.manifest.dir || plugin.app.vault.configDir + '/plugins/' + plugin.manifest.id;
  const readJson = async (name, fallback) => { try { return JSON.parse(await plugin.app.vault.adapter.read(base + '/' + name)); } catch { return fallback; } };
  plugin.journalPreferences = await readJson('appearance-preferences.json', { mode: 'light', palette: 'beige' });
  plugin.journalDrafts = await readJson('journal-drafts.json', {});
  plugin.saveJournalDrafts = () => plugin.app.vault.adapter.write(base + '/journal-drafts.json', JSON.stringify(plugin.journalDrafts, null, 2));
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  plugin.journalPreferences = { mode: plugin.journalPreferences.mode === 'dark' || plugin.journalPreferences.mode === 'system' && media.matches ? 'dark' : 'light' };
  plugin.applyAppearance = () => {
    const prefs = plugin.journalPreferences;
    const mode = prefs.mode;
    document.body.dataset.dwhMode = mode === 'dark' ? 'dark' : 'light';
    delete document.body.dataset.dwhPalette;
  };
  plugin.setAppearance = async (key, value) => {
    if (key !== 'mode' || !['light','dark'].includes(value)) return;
    plugin.journalPreferences = { mode: value }; plugin.applyAppearance();
    const content = JSON.stringify(plugin.journalPreferences, null, 2);
    plugin.appearanceSave = (plugin.appearanceSave || Promise.resolve()).catch(() => {}).then(() => plugin.app.vault.adapter.write(base + '/appearance-preferences.json', content));
    await plugin.appearanceSave;
  };
  plugin.renderAppearance = parent => {
    const control = parent.createDiv({ cls: 'dwh-appearance dwh-appearance--slider' });
    const groups = [['mode', '外观', [['light','白色'],['dark','黑色']]]];
    for (const [key, name, choices] of groups) {
      const label = control.createDiv({ cls: 'dwh-appearance__slider-row' });
      label.createSpan({ cls: 'dwh-appearance__label', text: name });
      const range = label.createDiv({ cls: 'dwh-appearance__segment', attr: { role: 'slider', tabindex: '0', 'aria-valuemin': '0', 'aria-valuemax': '1', 'aria-label': key === 'mode' ? '外观模式' : '纸面配色', title: '拖动滑块或点击选项，也可用方向键调整' } });
      range.setAttribute('role', 'slider'); range.setAttribute('tabindex', '0');
      range.setAttribute('aria-valuemin', '0'); range.setAttribute('aria-valuemax', '1');
      range.setAttribute('aria-label', key === 'mode' ? '外观模式' : '纸面配色');
      range.dataset.pref = key;
      const thumb = range.createDiv({ cls: 'dwh-appearance__thumb' });
      const options = choices.map(choice => range.createSpan({ cls: 'dwh-appearance__option', text: choice[1] }));
      let pointer = null, origin = 0, startIndex = 0, position = 0, dragging = false;
      const names = () => choices.map(c => c[1]);
      const setPosition = value => { position = Math.max(0, Math.min(choices.length - 1, value)); thumb.style.transform = `translateX(${position * 100}%)`; };
      const update = () => {
        const index = Math.max(0, choices.findIndex(c => c[0] === plugin.journalPreferences[key]));
        if (!dragging) setPosition(index);
        range.setAttribute('aria-valuenow', String(index)); range.setAttribute('aria-valuetext', names()[index]);
        options.forEach((option, i) => { option.textContent = names()[i]; option.classList.toggle('is-selected', index === i); });
      };
      const preview = index => { plugin.journalPreferences[key] = choices[index][0]; plugin.applyAppearance(); };
      const commit = index => {
        dragging = false; range.classList.remove('is-dragging'); setPosition(index);
        void plugin.setAppearance(key, choices[index][0]).catch(() => new journalOb.Notice('外观设置未能保存，请重试'));
      };
      const positionAt = x => {
        const box = range.getBoundingClientRect(); const cell = (box.width - 6) / choices.length;
        return Math.max(0, Math.min(choices.length - 1, (x - box.left - 3 - cell / 2) / cell));
      };
      range.addEventListener('pointerdown', e => {
        if (e.button !== 0 || pointer !== null) return;
        pointer = e.pointerId; origin = e.clientX;
        startIndex = choices.findIndex(c => c[0] === plugin.journalPreferences[key]);
        range.setPointerCapture(e.pointerId); range.focus();
      });
      range.addEventListener('pointermove', e => {
        if (pointer !== e.pointerId || Math.abs(e.clientX - origin) < 4 && !dragging) return;
        dragging = true; range.classList.add('is-dragging');
        setPosition(positionAt(e.clientX)); preview(Math.round(position));
      });
      range.addEventListener('pointerup', e => {
        if (pointer !== e.pointerId) return;
        const index = Math.round(dragging ? position : positionAt(e.clientX));
        pointer = null; range.releasePointerCapture(e.pointerId); commit(index);
      });
      const cancel = e => {
        if (pointer !== e.pointerId) return;
        pointer = null; dragging = false; range.classList.remove('is-dragging'); preview(Math.max(0,startIndex));
      };
      range.addEventListener('pointercancel', cancel); range.addEventListener('lostpointercapture', cancel);
      range.addEventListener('keydown', e => {
        if (pointer !== null) return;
        let index = Number(range.getAttribute('aria-valuenow'));
        if (['ArrowRight','ArrowUp'].includes(e.key)) index = Math.min(choices.length - 1,index+1);
        else if (['ArrowLeft','ArrowDown'].includes(e.key)) index = Math.max(0,index-1);
        else if (e.key === 'Home') index = 0;
        else if (e.key === 'End') index = choices.length - 1;
        else return;
        e.preventDefault(); commit(index);
      });
      control.addEventListener('dwh-appearance-change', update); update();
    }
  };
  const apply = plugin.applyAppearance;
  plugin.applyAppearance = () => {
    apply();
    document.querySelectorAll('.dwh-appearance--slider').forEach(el => el.dispatchEvent(new Event('dwh-appearance-change')));
  };
  plugin.applyAppearance();
  plugin.register(() => { delete document.body.dataset.dwhMode; delete document.body.dataset.dwhPalette; });
  plugin.registerView(JOURNAL_VIEW, leaf => new PaperJournalView(leaf, plugin));
  plugin.activateJournal = async path => {
    let leaf = plugin.app.workspace.getLeavesOfType(JOURNAL_VIEW)[0];
    if (!leaf) { leaf = plugin.app.workspace.getLeaf('tab'); await leaf.setViewState({ type: JOURNAL_VIEW, active: true }); }
    await leaf.view.openPath(path); await plugin.app.workspace.revealLeaf(leaf);
  };
  plugin.repo.openDiary = async ref => plugin.activateJournal(ref.path);
  plugin.addCommand({ id: 'open-paper-journal', name: '打开纸张日记', callback: async () => { const f = await plugin.repo.createOrOpen(todayLocalDate()); await plugin.activateJournal(f.path); } });
  plugin.addRibbonIcon('notebook-pen', '打开纸张日记', async () => { const f = await plugin.repo.createOrOpen(todayLocalDate()); await plugin.activateJournal(f.path); });
  plugin.register(() => plugin.app.workspace.detachLeavesOfType(JOURNAL_VIEW));
  plugin.refreshHomeViews();
}
const originalJournalOnload = WorkstationHomePlugin.prototype.onload;
WorkstationHomePlugin.prototype.onload = async function () { await originalJournalOnload.call(this); await installPaperJournal(this); };
const originalJournalHomeRender = WorkstationHomeView.prototype.render;
WorkstationHomeView.prototype.render = function () {
  originalJournalHomeRender.call(this);
  if (this.api.renderAppearance) {
    const content = this.contentEl || this.containerEl.children[1];
    const hero = content.querySelector('.dwh-home__hero');
    const title = content.querySelector('.dwh-home__title');
    if (title) title.textContent = '纸间';
    if (hero) this.api.renderAppearance(hero);
    const workTitle = content.querySelector('.dwh-document-lines .dwh-panel__title');
    if (workTitle) workTitle.textContent = '工作进展';
    const inspirationTitle = content.querySelector('.dwh-inspiration .dwh-panel__title');
    if (inspirationTitle) inspirationTitle.textContent = '灵感';
  }
};
const originalPaperHomeDiary = renderHomeDiaryCard;
renderHomeDiaryCard = async function (container, api, onOpenCalendar) {
  await originalPaperHomeDiary(container, api, onOpenCalendar);
  const title = container.querySelector('.dwh-panel__title');
  if (title) title.textContent = '日历与日记';
  const today = container.querySelector('.dwh-diary__today');
  const preview = container.querySelector('.dwh-diary__preview');
  const calendar = container.querySelector('.dwh-diary__mini-cal');
  const foot = container.querySelector('.dwh-diary__foot');
  if (!today || !preview || !calendar) return;
  const body = container.createDiv({ cls: 'dwh-home-diary-body' });
  body.appendChild(calendar);
  const sheet = body.createDiv({ cls: 'dwh-home-journal-preview' });
  sheet.appendChild(today); sheet.appendChild(preview);
  if (foot) container.appendChild(foot);
};
buildDefaultDiaryContent = date => journalNewContent(date);

WorkstationHomeView.prototype.getDisplayText = function () { return "纸间"; };
