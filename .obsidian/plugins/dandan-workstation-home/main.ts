import {
  App,
  FuzzySuggestModal,
  ItemView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
  TextComponent,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

export const VIEW_TYPE_WORKSTATION_HOME = "dandan-workstation-home-view";

/* ------------------------------------------------------------------ */
/* Data model                                                          */
/* ------------------------------------------------------------------ */

interface InspirationItem {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  order: number;
}

interface DocumentLine {
  id: string;
  title: string;
  documentPaths: string[];
  createdAt: number;
  updatedAt: number;
  order: number;
}

interface WorkstationSettings {
  openOnStartup: boolean;
  diaryFolder: string;
  defaultDocumentFolder: string;
  diaryDateFormat: string;
  recentDiaryCount: number;
}

interface WorkstationData {
  version: 1;
  inspirations: InspirationItem[];
  todos: TodoItem[];
  documentLines: DocumentLine[];
  settings: WorkstationSettings;
}

const DEFAULT_DATA: WorkstationData = {
  version: 1,
  inspirations: [],
  todos: [],
  documentLines: [],
  settings: {
    openOnStartup: true,
    diaryFolder: "日记",
    defaultDocumentFolder: "研究",
    diaryDateFormat: "YYYY-MM-DD",
    recentDiaryCount: 7,
  },
};

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date, fmt: string): string {
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    YY: String(d.getFullYear()).slice(-2),
    MM: pad2(d.getMonth() + 1),
    M: String(d.getMonth() + 1),
    DD: pad2(d.getDate()),
    D: String(d.getDate()),
  };
  return fmt.replace(/YYYY|YY|MM|M|DD|D/g, (token) => map[token] ?? token);
}

function datePattern(fmt: string): RegExp {
  const escaped = fmt
    .replace(/YYYY/g, "\\d{4}")
    .replace(/YY/g, "\\d{2}")
    .replace(/MM/g, "\\d{2}")
    .replace(/M/g, "\\d{1,2}")
    .replace(/DD/g, "\\d{2}")
    .replace(/D/g, "\\d{1,2}");
  return new RegExp("^" + escaped + "$");
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function mergeAndValidateData(def: WorkstationData, saved: unknown): WorkstationData {
  const out: WorkstationData = {
    version: 1,
    inspirations: [],
    todos: [],
    documentLines: [],
    settings: { ...def.settings },
  };

  if (!saved || typeof saved !== "object") return out;
  const s = saved as Partial<WorkstationData>;

  if (Array.isArray(s.inspirations)) {
    out.inspirations = (s.inspirations as unknown[])
      .filter((i): boolean => !!i && typeof (i as Record<string, unknown>).id === "string")
      .map((i) => {
        const it = i as Record<string, unknown>;
        return {
          id: it.id as string,
          text: typeof it.text === "string" ? it.text : "",
          createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
          updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
          order: typeof it.order === "number" ? it.order : 0,
        };
      });
  }

  if (Array.isArray(s.todos)) {
    out.todos = (s.todos as unknown[])
      .filter((i): boolean => !!i && typeof (i as Record<string, unknown>).id === "string")
      .map((i) => {
        const it = i as Record<string, unknown>;
        return {
          id: it.id as string,
          text: typeof it.text === "string" ? it.text : "",
          completed: typeof it.completed === "boolean" ? it.completed : false,
          createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
          updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
          order: typeof it.order === "number" ? it.order : 0,
        };
      });
  }

  if (Array.isArray(s.documentLines)) {
    out.documentLines = (s.documentLines as unknown[])
      .filter((l): boolean => !!l && typeof (l as Record<string, unknown>).id === "string")
      .map((l) => {
        const it = l as Record<string, unknown>;
        return {
          id: it.id as string,
          title: typeof it.title === "string" && it.title.trim() ? it.title : "未命名文档线",
          documentPaths: Array.isArray(it.documentPaths)
            ? (it.documentPaths as unknown[]).filter((p): p is string => typeof p === "string")
            : [],
          createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now(),
          updatedAt: typeof it.updatedAt === "number" ? it.updatedAt : Date.now(),
          order: typeof it.order === "number" ? it.order : 0,
        };
      });
  }

  if (s.settings && typeof s.settings === "object") {
    const st = s.settings as Partial<WorkstationSettings>;
    out.settings = {
      openOnStartup:
        typeof st.openOnStartup === "boolean" ? st.openOnStartup : def.settings.openOnStartup,
      diaryFolder:
        typeof st.diaryFolder === "string" && st.diaryFolder.trim()
          ? st.diaryFolder.trim()
          : def.settings.diaryFolder,
      defaultDocumentFolder:
        typeof st.defaultDocumentFolder === "string" ? st.defaultDocumentFolder : def.settings.defaultDocumentFolder,
      diaryDateFormat:
        typeof st.diaryDateFormat === "string" && st.diaryDateFormat.trim()
          ? st.diaryDateFormat.trim()
          : def.settings.diaryDateFormat,
      recentDiaryCount:
        typeof st.recentDiaryCount === "number" && st.recentDiaryCount > 0
          ? Math.floor(st.recentDiaryCount)
          : def.settings.recentDiaryCount,
    };
  }

  out.inspirations.sort((a, b) => a.order - b.order);
  out.todos.sort((a, b) => a.order - b.order);
  out.documentLines.sort((a, b) => a.order - b.order);
  return out;
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (!normalized || normalized === "/") return;

  const parts = normalized.split("/");
  let current = "";

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = app.vault.getAbstractFileByPath(current);
    if (!existing) {
      await app.vault.createFolder(current);
    } else if (!(existing instanceof TFolder)) {
      throw new Error(`${current} 已存在且不是文件夹`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Modals                                                             */
/* ------------------------------------------------------------------ */

class TextInputModal extends Modal {
  private value = "";

  constructor(
    app: App,
    private readonly titleText: string,
    private readonly placeholder: string,
    private readonly initial: string,
    private readonly onSubmit: (value: string) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("dwh-modal");

    contentEl.createEl("h3", { text: this.titleText, cls: "dwh-modal__title" });

    const input = new TextComponent(contentEl)
      .setPlaceholder(this.placeholder)
      .setValue(this.initial);
    input.inputEl.addClass("dwh-modal__input");

    const submit = () => {
      const value = input.getValue().trim();
      if (!value) {
        new Notice("内容不能为空");
        return;
      }
      this.close();
      this.onSubmit(value);
    };

    input.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    });

    const actions = contentEl.createDiv({ cls: "dwh-modal__actions" });
    actions.createEl("button", { text: "取消", cls: "dwh-btn" }).addEventListener("click", () => this.close());
    const ok = actions.createEl("button", { text: "确定", cls: "dwh-btn dwh-btn--primary" });
    ok.addEventListener("click", submit);

    window.setTimeout(() => input.inputEl.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class MarkdownFileSuggestModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly onChoose: (file: TFile) => void
  ) {
    super(app);
    this.setPlaceholder("搜索 Markdown 文件…");
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file);
  }
}

/* ------------------------------------------------------------------ */
/* Plugin                                                             */
/* ------------------------------------------------------------------ */

export default class WorkstationHomePlugin extends Plugin {
  data: WorkstationData = mergeAndValidateData(DEFAULT_DATA, null);

  async onload(): Promise<void> {
    await this.loadPluginData();

    this.registerView(VIEW_TYPE_WORKSTATION_HOME, (leaf) => new WorkstationHomeView(leaf, this));

    this.addCommand({
      id: "open-workstation-home",
      name: "打开工作站首页",
      callback: () => void this.activateHome(),
    });

    this.addRibbonIcon("home", "打开工作站首页", () => {
      void this.activateHome();
    });

    this.addSettingTab(new WorkstationSettingTab(this.app, this));

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        void this.handleFileRename(file, oldPath);
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        void this.handleFileDelete(file);
      })
    );

    this.app.workspace.onLayoutReady(() => {
      if (this.data.settings.openOnStartup) {
        void this.activateHome();
      }
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORKSTATION_HOME);
  }

  async loadPluginData(): Promise<void> {
    try {
      const saved = await this.loadData();
      this.data = mergeAndValidateData(DEFAULT_DATA, saved);
    } catch (e) {
      console.error("[dandan-workstation-home] 数据读取失败，已回退安全默认值", e);
      this.data = mergeAndValidateData(DEFAULT_DATA, null);
      new Notice("工作站首页：本地数据异常，已回退到安全默认值");
    }
  }

  async savePluginData(): Promise<void> {
    try {
      await this.saveData(this.data);
    } catch (e) {
      console.error("[dandan-workstation-home] 数据保存失败", e);
      new Notice("工作站首页：数据保存失败，请检查仓库权限");
    }
  }

  async activateHome(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME)[0];

    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_WORKSTATION_HOME,
        active: true,
      });
    }

    await this.app.workspace.revealLeaf(leaf);
  }

  async handleFileRename(file: TAbstractFile, oldPath: string): Promise<void> {
    if (!(file instanceof TFile) || file.extension !== "md") return;

    let changed = false;
    for (const line of this.data.documentLines) {
      line.documentPaths = line.documentPaths.map((path) => {
        if (path !== oldPath) return path;
        changed = true;
        return file.path;
      });
    }

    if (changed) {
      this.refreshHomeViews();
      await this.savePluginData();
    }
  }

  async handleFileDelete(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile)) return;

    let changed = false;
    for (const line of this.data.documentLines) {
      const before = line.documentPaths.length;
      line.documentPaths = line.documentPaths.filter((p) => p !== file.path);
      if (line.documentPaths.length !== before) changed = true;
    }

    if (changed) {
      this.refreshHomeViews();
      await this.savePluginData();
    }
  }

  refreshHomeViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME)) {
      const view = leaf.view;
      if (view instanceof WorkstationHomeView) view.render();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Home view                                                          */
/* ------------------------------------------------------------------ */

class WorkstationHomeView extends ItemView {
  private confirmingDeleteInspiration = new Set<string>();
  private confirmingDeleteLine = new Set<string>();

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: WorkstationHomePlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_WORKSTATION_HOME;
  }

  getDisplayText(): string {
    return "工作站";
  }

  getIcon(): string {
    return "home";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  onunload(): void {
    this.confirmingDeleteInspiration.clear();
    this.confirmingDeleteLine.clear();
  }

  render(): void {
    const content = this.containerEl.children[1] as HTMLElement;
    content.empty();
    content.addClass("dwh-home");

    const grid = content.createDiv({ cls: "dwh-home__grid" });
    const leftColumn = grid.createDiv({ cls: "dwh-home__left" });
    const inspirationPanel = leftColumn.createDiv({ cls: "dwh-panel dwh-inspiration" });
    const todoPanel = leftColumn.createDiv({ cls: "dwh-panel dwh-todos" });
    const documentLinesPanel = grid.createDiv({ cls: "dwh-panel dwh-document-lines" });
    const diaryPanel = grid.createDiv({ cls: "dwh-panel dwh-diary" });

    this.renderInspirations(inspirationPanel);
    this.renderTodos(todoPanel);
    this.renderDocumentLines(documentLinesPanel);
    this.renderDiary(diaryPanel);
  }

  /* ----------------------------- 灵感 ----------------------------- */

  private renderInspirations(container: HTMLElement): void {
    container.empty();
    container.createEl("h2", { text: "灵感", cls: "dwh-panel__title" });

    const list = container.createDiv({ cls: "dwh-inspiration__list" });

    const items = this.plugin.data.inspirations;
    if (items.length === 0) {
      list.createDiv({ cls: "dwh-empty", text: "还没有灵感" });
    } else {
      for (const item of items) {
        this.renderInspirationCard(list, item);
      }
    }

    const addRow = container.createDiv({ cls: "dwh-inspiration__add" });
    const textarea = addRow.createEl("textarea", {
      cls: "dwh-inspiration__input",
      attr: { placeholder: "记录一个还没成形的想法，Ctrl/Cmd + Enter 添加", rows: "2" },
    });
    const addBtn = addRow.createEl("button", { text: "添加", cls: "dwh-btn dwh-btn--primary" });

    const submit = () => {
      const value = textarea.value.trim();
      if (!value) return;
      this.addInspiration(value);
      textarea.value = "";
    };

    textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submit();
      }
    });
    addBtn.addEventListener("click", submit);
  }

  private renderInspirationCard(list: HTMLElement, item: InspirationItem): void {
    const card = list.createDiv({ cls: "dwh-inspiration-card" });

    const textEl = card.createDiv({ cls: "dwh-inspiration-card__text", text: item.text });
    textEl.addEventListener("click", () => this.beginEditInspiration(card, item));

    const actions = card.createDiv({ cls: "dwh-inspiration-card__actions" });

    if (this.confirmingDeleteInspiration.has(item.id)) {
      actions.createEl("button", { text: "确认删除", cls: "dwh-btn dwh-btn--danger" }).addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          this.deleteInspiration(item.id);
        }
      );
      actions.createEl("button", { text: "取消", cls: "dwh-btn" }).addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          this.confirmingDeleteInspiration.delete(item.id);
          this.render();
        }
      );
    } else {
      const del = actions.createEl("button", { text: "删除", cls: "dwh-btn dwh-btn--ghost" });
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        this.confirmingDeleteInspiration.add(item.id);
        this.render();
      });
    }
  }

  private beginEditInspiration(card: HTMLElement, item: InspirationItem): void {
    const editor = card.createEl("textarea", {
      cls: "dwh-inspiration-card__editor",
      value: item.text,
    });
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);

    const finish = (save: boolean) => {
      if (save) {
        const value = editor.value.trim();
        if (value && value !== item.text) {
          item.text = value;
          item.updatedAt = Date.now();
          void this.plugin.savePluginData();
        }
      }
      this.render();
    };

    editor.addEventListener("blur", () => finish(true));
    editor.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
  }

  private addInspiration(text: string): void {
    const now = Date.now();
    const order =
      this.plugin.data.inspirations.length > 0
        ? Math.max(...this.plugin.data.inspirations.map((i) => i.order)) + 1
        : 0;
    this.plugin.data.inspirations.push({
      id: uid(),
      text,
      createdAt: now,
      updatedAt: now,
      order,
    });
    void this.plugin.savePluginData();
    this.render();
  }

  private deleteInspiration(id: string): void {
    this.plugin.data.inspirations = this.plugin.data.inspirations.filter((i) => i.id !== id);
    this.confirmingDeleteInspiration.delete(id);
    void this.plugin.savePluginData();
    this.render();
  }

  /* ----------------------------- 待办 ----------------------------- */

  private renderTodos(container: HTMLElement): void {
    container.empty();

    const header = container.createDiv({ cls: "dwh-panel__header" });
    header.createEl("h2", { text: "待办", cls: "dwh-panel__title" });
    const remaining = this.plugin.data.todos.filter((item) => !item.completed).length;
    header.createSpan({ cls: "dwh-todo__count", text: remaining ? `${remaining} 项未完成` : "全部完成" });

    const list = container.createDiv({ cls: "dwh-todo__list" });
    const items = [...this.plugin.data.todos].sort(
      (a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order
    );

    if (items.length === 0) {
      list.createDiv({ cls: "dwh-empty", text: "还没有待办" });
    } else {
      for (const item of items) this.renderTodoItem(list, item);
    }

    const addRow = container.createDiv({ cls: "dwh-todo__add" });
    const input = addRow.createEl("input", {
      type: "text",
      cls: "dwh-todo__input",
      attr: { placeholder: "添加一项待办，按 Enter 保存" },
    });
    const addBtn = addRow.createEl("button", { text: "添加", cls: "dwh-btn dwh-btn--primary" });
    const submit = () => {
      const value = input.value.trim();
      if (!value) return;
      this.addTodo(value);
      input.value = "";
    };
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    addBtn.addEventListener("click", submit);
  }

  private renderTodoItem(list: HTMLElement, item: TodoItem): void {
    const row = list.createDiv({ cls: "dwh-todo" + (item.completed ? " dwh-todo--done" : "") });
    const checkbox = row.createEl("input", { type: "checkbox", cls: "dwh-todo__check" });
    checkbox.checked = item.completed;
    checkbox.setAttribute("aria-label", item.completed ? "标记为未完成" : "标记为已完成");
    checkbox.addEventListener("change", () => {
      item.completed = checkbox.checked;
      item.updatedAt = Date.now();
      void this.plugin.savePluginData();
      this.render();
    });

    const text = row.createSpan({ cls: "dwh-todo__text", text: item.text });
    text.setAttribute("title", "单击编辑");
    text.addEventListener("click", () => this.beginEditTodo(row, item));

    const del = row.createEl("button", {
      text: "删除",
      cls: "dwh-btn dwh-btn--ghost dwh-todo__delete",
      attr: { "aria-label": `删除待办：${item.text}` },
    });
    del.addEventListener("click", () => this.deleteTodo(item.id));
  }

  private beginEditTodo(row: HTMLElement, item: TodoItem): void {
    const text = row.querySelector(".dwh-todo__text");
    if (text) text.remove();
    const editor = row.createEl("input", { type: "text", cls: "dwh-todo__edit", value: item.text });
    const deleteButton = row.querySelector(".dwh-todo__delete");
    if (deleteButton) row.insertBefore(editor, deleteButton);
    editor.focus();
    editor.select();

    let finished = false;
    const finish = (save: boolean) => {
      if (finished) return;
      finished = true;
      if (save) {
        const value = editor.value.trim();
        if (value && value !== item.text) {
          item.text = value;
          item.updatedAt = Date.now();
          void this.plugin.savePluginData();
        }
      }
      this.render();
    };
    editor.addEventListener("blur", () => finish(true));
    editor.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
  }

  private addTodo(text: string): void {
    const now = Date.now();
    const order = this.plugin.data.todos.length
      ? Math.max(...this.plugin.data.todos.map((item) => item.order)) + 1
      : 0;
    this.plugin.data.todos.push({ id: uid(), text, completed: false, createdAt: now, updatedAt: now, order });
    void this.plugin.savePluginData();
    this.render();
  }

  private deleteTodo(id: string): void {
    this.plugin.data.todos = this.plugin.data.todos.filter((item) => item.id !== id);
    void this.plugin.savePluginData();
    this.render();
  }

  /* --------------------------- 文档线 --------------------------- */

  private renderDocumentLines(container: HTMLElement): void {
    container.empty();

    const header = container.createDiv({ cls: "dwh-panel__header" });
    header.createEl("h2", { text: "文档线", cls: "dwh-panel__title" });
    const addLineBtn = header.createEl("button", { text: "新建文档线", cls: "dwh-btn dwh-btn--primary" });
    addLineBtn.addEventListener("click", () => {
      new TextInputModal(
        this.app,
        "新建文档线",
        "给这条线起个简短标题",
        "",
        (title) => this.addDocumentLine(title)
      ).open();
    });

    const lines = this.plugin.data.documentLines;
    if (lines.length === 0) {
      container.createDiv({ cls: "dwh-empty", text: "还没有文档线，点上方“新建文档线”开始" });
      return;
    }

    for (const line of lines) {
      this.renderDocumentLine(container, line);
    }
  }

  private renderDocumentLine(container: HTMLElement, line: DocumentLine): void {
    const wrap = container.createDiv({ cls: "dwh-document-line" });

    const head = wrap.createDiv({ cls: "dwh-document-line__head" });
    const titleEl = head.createEl("div", { cls: "dwh-document-line__title", text: line.title });
    titleEl.addEventListener("click", () => {
      new TextInputModal(
        this.app,
        "重命名文档线",
        "新的标题",
        line.title,
        (title) => {
          line.title = title;
          line.updatedAt = Date.now();
          void this.plugin.savePluginData();
          this.render();
        }
      ).open();
    });

    const headActions = head.createDiv({ cls: "dwh-document-line__head-actions" });
    const addExisting = headActions.createEl("button", { text: "添加文档", cls: "dwh-btn" });
    addExisting.addEventListener("click", () => {
      new MarkdownFileSuggestModal(this.app, (file) => this.addExistingDoc(line, file)).open();
    });
    const newDoc = headActions.createEl("button", { text: "新建文档", cls: "dwh-btn" });
    newDoc.addEventListener("click", () => {
      new TextInputModal(
        this.app,
        "新建文档并加入此线",
        "文档名称（自动补全 .md）",
        "",
        (name) => void this.createNewDoc(line, name)
      ).open();
    });
    const delLine = headActions.createEl("button", { text: "删除此线", cls: "dwh-btn dwh-btn--ghost" });
    delLine.addEventListener("click", () => {
      if (this.confirmingDeleteLine.has(line.id)) {
        this.deleteDocumentLine(line.id);
      } else {
        this.confirmingDeleteLine.add(line.id);
        this.render();
      }
    });

    if (this.confirmingDeleteLine.has(line.id)) {
      const warn = wrap.createDiv({ cls: "dwh-document-line__warn" });
      warn.setText("即将删除这条线，但不会删除其中的文档。");
    }

    const track = wrap.createDiv({ cls: "dwh-document-line__track" });

    if (line.documentPaths.length === 0) {
      track.createDiv({ cls: "dwh-empty dwh-empty--inline", text: "这条线还没有文档" });
    }

    line.documentPaths.forEach((path, index) => {
      const file = this.app.vault.getAbstractFileByPath(path);
      const exists = file instanceof TFile;
      const node = track.createDiv({ cls: "dwh-document-node" + (exists ? "" : " dwh-document-node--missing") });

      const body = node.createDiv({ cls: "dwh-document-node__body" });
      if (exists) {
        const name = file instanceof TFile ? file.basename : path.split("/").pop() ?? path;
        const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
        body.createEl("div", { cls: "dwh-document-node__name", text: name });
        if (folder) body.createEl("div", { cls: "dwh-document-node__folder", text: folder });
        node.addEventListener("click", (e) => {
          if ((e.target as HTMLElement).closest(".dwh-document-node__controls")) return;
          void this.openFile(file as TFile);
        });
      } else {
        body.createEl("div", { cls: "dwh-document-node__name", text: "文件不存在" });
        body.createEl("div", { cls: "dwh-document-node__folder", text: path });
      }

      const controls = node.createDiv({ cls: "dwh-document-node__controls" });
      const left = controls.createEl("button", { text: "←", cls: "dwh-btn dwh-btn--icon" });
      left.addEventListener("click", (e) => {
        e.stopPropagation();
        this.moveNode(line, index, -1);
      });
      const right = controls.createEl("button", { text: "→", cls: "dwh-btn dwh-btn--icon" });
      right.addEventListener("click", (e) => {
        e.stopPropagation();
        this.moveNode(line, index, 1);
      });
      const remove = controls.createEl("button", { text: "✕", cls: "dwh-btn dwh-btn--icon dwh-btn--danger" });
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeNode(line, index);
      });
    });
  }

  private addDocumentLine(title: string): void {
    const now = Date.now();
    const order =
      this.plugin.data.documentLines.length > 0
        ? Math.max(...this.plugin.data.documentLines.map((l) => l.order)) + 1
        : 0;
    this.plugin.data.documentLines.push({
      id: uid(),
      title,
      documentPaths: [],
      createdAt: now,
      updatedAt: now,
      order,
    });
    void this.plugin.savePluginData();
    this.render();
  }

  private deleteDocumentLine(id: string): void {
    this.plugin.data.documentLines = this.plugin.data.documentLines.filter((l) => l.id !== id);
    this.confirmingDeleteLine.delete(id);
    void this.plugin.savePluginData();
    this.render();
  }

  private addExistingDoc(line: DocumentLine, file: TFile): void {
    if (line.documentPaths.includes(file.path)) {
      new Notice("该文档已在这条文档线中");
      return;
    }
    line.documentPaths.push(file.path);
    line.updatedAt = Date.now();
    void this.plugin.savePluginData();
    this.render();
  }

  private async createNewDoc(line: DocumentLine, rawName: string): Promise<void> {
    try {
      const folder = this.plugin.data.settings.defaultDocumentFolder || "研究";
      const base = rawName.replace(/\.md$/i, "").trim();
      if (!base) {
        new Notice("文档名不能为空");
        return;
      }
      const path = normalizePath(`${folder}/${base}.md`);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) {
        new Notice("同名文件已存在，已直接加入文档线");
        if (!line.documentPaths.includes(existing.path)) line.documentPaths.push(existing.path);
        line.updatedAt = Date.now();
        void this.plugin.savePluginData();
        this.render();
        await this.openFile(existing);
        return;
      }

      await ensureFolder(this.app, folder);
      const file = await this.app.vault.create(path, `# ${base}\n\n`);
      if (!line.documentPaths.includes(file.path)) line.documentPaths.push(file.path);
      line.updatedAt = Date.now();
      void this.plugin.savePluginData();
      this.render();
      await this.openFile(file);
    } catch (e) {
      console.error("[dandan-workstation-home] 新建文档失败", e);
      new Notice("新建文档失败：" + (e instanceof Error ? e.message : String(e)));
    }
  }

  private moveNode(line: DocumentLine, index: number, dir: number): void {
    const target = index + dir;
    if (target < 0 || target >= line.documentPaths.length) return;
    const arr = line.documentPaths;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    line.updatedAt = Date.now();
    void this.plugin.savePluginData();
    this.render();
  }

  private removeNode(line: DocumentLine, index: number): void {
    line.documentPaths.splice(index, 1);
    line.updatedAt = Date.now();
    void this.plugin.savePluginData();
    this.render();
  }

  private async openFile(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file, { active: true });
  }

  /* ----------------------------- 日记 ----------------------------- */

  private renderDiary(container: HTMLElement): void {
    container.empty();
    container.createEl("h2", { text: "日记", cls: "dwh-panel__title" });

    const now = new Date();
    const todayName = formatDate(now, this.plugin.data.settings.diaryDateFormat);
    const todayLine = container.createDiv({ cls: "dwh-diary__today" });
    todayLine.createEl("div", {
      cls: "dwh-diary__date",
      text: `${todayName} ${WEEKDAYS[now.getDay()]}`,
    });
    const writeBtn = todayLine.createEl("button", { text: "写今天", cls: "dwh-btn dwh-btn--primary dwh-btn--block" });
    writeBtn.addEventListener("click", () => void this.writeToday());

    const recent = container.createDiv({ cls: "dwh-diary__recent" });
    recent.createEl("div", { cls: "dwh-diary__recent-title", text: "最近日记" });

    const folderPath = normalizePath(this.plugin.data.settings.diaryFolder);
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    const files: TFile[] = [];
    if (folder instanceof TFolder) {
      const pat = datePattern(this.plugin.data.settings.diaryDateFormat);
      for (const child of folder.children) {
        if (child instanceof TFile && child.extension === "md" && pat.test(child.basename)) {
          files.push(child);
        }
      }
    }
    files.sort((a, b) => b.basename.localeCompare(a.basename));

    const limit = this.plugin.data.settings.recentDiaryCount > 0 ? this.plugin.data.settings.recentDiaryCount : 7;
    const shown = files.slice(0, limit);

    if (shown.length === 0) {
      recent.createDiv({ cls: "dwh-empty dwh-empty--inline", text: "还没有日记" });
    } else {
      for (const file of shown) {
        const item = recent.createDiv({ cls: "dwh-diary-item" });
        const isToday = file.basename === todayName;
        item.createEl("div", {
          cls: "dwh-diary-item__name" + (isToday ? " dwh-diary-item__name--today" : ""),
          text: isToday ? `${file.basename}（今天）` : file.basename,
        });
        item.addEventListener("click", () => void this.openFile(file));
      }
    }
  }

  private async writeToday(): Promise<void> {
    try {
      const folder = this.plugin.data.settings.diaryFolder || "日记";
      const dateName = formatDate(new Date(), this.plugin.data.settings.diaryDateFormat);
      await ensureFolder(this.app, folder);
      const path = normalizePath(`${folder}/${dateName}.md`);

      const target = this.app.vault.getAbstractFileByPath(path);
      if (target instanceof TFile) {
        await this.openFile(target);
        return;
      }

      const created = await this.app.vault.create(path, `# ${dateName}\n\n`);
      await this.openFile(created);
    } catch (e) {
      console.error("[dandan-workstation-home] 写今天失败", e);
      new Notice("写今天失败：" + (e instanceof Error ? e.message : String(e)));
    }
  }
}

/* ------------------------------------------------------------------ */
/* Settings tab                                                       */
/* ------------------------------------------------------------------ */

class WorkstationSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: WorkstationHomePlugin
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("dwh-settings");

    new Setting(containerEl)
      .setName("启动 Obsidian 时打开工作站首页")
      .setDesc("开启后，打开仓库会自动显示“工作站”首页。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.data.settings.openOnStartup).onChange(async (value) => {
          this.plugin.data.settings.openOnStartup = value;
          await this.plugin.savePluginData();
          this.plugin.refreshHomeViews();
        })
      );

    new Setting(containerEl)
      .setName("日记文件夹")
      .setDesc("日记 Markdown 文件所在的文件夹（相对仓库根目录）。")
      .addText((text) =>
        text.setValue(this.plugin.data.settings.diaryFolder).onChange(async (value) => {
          this.plugin.data.settings.diaryFolder = value.trim() || "日记";
          await this.plugin.savePluginData();
          this.plugin.refreshHomeViews();
        })
      );

    new Setting(containerEl)
      .setName("日记日期格式")
      .setDesc("用于生成和识别日记文件名，例如 YYYY-MM-DD。")
      .addText((text) =>
        text.setValue(this.plugin.data.settings.diaryDateFormat).onChange(async (value) => {
          this.plugin.data.settings.diaryDateFormat = value.trim() || "YYYY-MM-DD";
          await this.plugin.savePluginData();
          this.plugin.refreshHomeViews();
        })
      );

    new Setting(containerEl)
      .setName("首页显示最近几篇日记")
      .setDesc("“日记”区域展示的最近日记数量。")
      .addText((text) =>
        text
          .setValue(String(this.plugin.data.settings.recentDiaryCount))
          .onChange(async (value) => {
            const n = parseInt(value, 10);
            this.plugin.data.settings.recentDiaryCount = n > 0 ? n : 7;
            await this.plugin.savePluginData();
            this.plugin.refreshHomeViews();
          })
      );

    new Setting(containerEl)
      .setName("文档线新建文档的默认文件夹")
      .setDesc("在文档线中点“新建文档”时，文件默认保存到此文件夹。")
      .addText((text) =>
        text.setValue(this.plugin.data.settings.defaultDocumentFolder).onChange(async (value) => {
          this.plugin.data.settings.defaultDocumentFolder = value.trim() || "研究";
          await this.plugin.savePluginData();
        })
      );
  }
}
