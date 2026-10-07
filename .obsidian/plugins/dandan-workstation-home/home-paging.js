/* 首页自适应翻纸；沿用现有条目的编辑、排序与保存。 */
function packHomeSheets(heights, capacity) {
  const pages = []; let page = [], used = 0;
  heights.forEach((height, index) => {
    if (page.length && used + height > capacity) { pages.push(page); page = []; used = 0; }
    page.push(index); used += height;
  });
  if (page.length) pages.push(page);
  return pages.length ? pages : [[]];
}
function openHomePaper(view, title, text, save) {
  const dialog = document.body.createEl('dialog', { cls: 'dwh-home-detail' });
  dialog.createEl('h2', { text: title });
  const editor = dialog.createEl('textarea', { cls: 'dwh-home-detail__text', attr: { 'aria-label': title } });
  editor.value = text;
  const actions = dialog.createDiv({cls:'dwh-home-detail__actions'});
  journalButton(actions, '关闭', () => dialog.close());
  journalButton(actions, '保存', async () => { await save(editor.value); dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove(), {once:true});
  view.register(() => dialog.remove()); dialog.showModal(); editor.focus();
}
WorkstationHomeView.prototype.setupPaperPaging = function () {
  const root = this.contentEl || this.containerEl.children[1];
  this.paperState ||= {};
  const height = root.clientHeight || window.innerHeight;
  const compact = root.clientWidth >= 900 && height >= 680;
  root.classList.toggle('dwh-home--paged', compact);
  const hero = root.querySelector('.dwh-home__hero');
  const budget = Math.max(230, Math.floor((height - (hero?.offsetHeight || 60) - 74) / 2));
  root.style.setProperty('--dwh-paper-budget', budget + 'px');
  for (const [key, panelSelector, listSelector, rowSelector] of [
    ['inspirations','.dwh-inspiration','.dwh-inspiration__list','.dwh-inspiration-card'],
    ['todos','.dwh-todos','.dwh-todo__list','.dwh-todo'],
    ['work','.dwh-document-lines',null,'.dwh-document-line']
  ]) {
    const panel = root.querySelector(panelSelector); if (!panel) continue;
    let list = listSelector ? panel.querySelector(listSelector) : panel.querySelector('.dwh-paper-work-list');
    if (!list && key === 'work') {
      list = panel.createDiv({cls:'dwh-paper-work-list'});
      [...panel.querySelectorAll(rowSelector)].forEach(row=>list.appendChild(row));
    }
    if (!list) continue;
    panel.querySelector('.dwh-paper-pager')?.remove();
    const rows = [...list.querySelectorAll(':scope > ' + rowSelector)];
    for (const row of rows) {
      row.hidden = false; row.classList.add('dwh-paper-row'); row.tabIndex = 0;
      const id = row.dataset.dwhId || row.dataset.dwhLineId;
      if (!row.querySelector('.dwh-paper-expand')) {
        const button = journalButton(row, '展开', () => {
          if (key === 'work') {
            const model = this.data().documentLines.find(x=>x.id===id); if (!model) return;
            const dialog = document.body.createEl('dialog',{cls:'dwh-home-detail dwh-home-detail--work'});
            journalButton(dialog,'关闭',()=>dialog.close());
            this.renderDocumentLine(dialog,model);
            dialog.addEventListener('close',()=>dialog.remove(),{once:true});
            this.register(()=>dialog.remove()); dialog.showModal();
          } else {
            const model = this.data()[key].find(x=>x.id===id); if (!model) return;
            openHomePaper(this,key==='todos'?'待办':'灵感',model.text,async value=>{
              if (!value.trim()) return;
              model.text=value.trim(); model.updatedAt=Date.now(); await this.api.saveDataNow(); this.render();
            });
          }
        }, 'dwh-paper-expand');
        button.setAttribute('aria-label', key === 'work' ? '展开工作项目' : '展开完整内容');
      }
    }
    const add = panel.querySelector('.dwh-inspiration__add,.dwh-todo__add');
    const top = list.getBoundingClientRect().top - panel.getBoundingClientRect().top;
    const capacity = Math.max(70, budget - top - (add ? add.offsetHeight + 20 : 0) - 58);
    const sizes = rows.map(row=>row.offsetHeight + 8);
    const pages = compact ? packHomeSheets(sizes,capacity) : packHomeSheets(sizes,Math.max(160,Math.min(360,height*.35)));
    const state = this.paperState[key] || {index:0,anchor:null};
    const anchorIndex = rows.findIndex(row=>(row.dataset.dwhId || row.dataset.dwhLineId)===state.anchor);
    let index = anchorIndex >= 0 ? pages.findIndex(page=>page.includes(anchorIndex)) : Math.min(state.index,pages.length-1);
    const focused = rows.findIndex(row=>row.contains(document.activeElement));
    if (focused >= 0) index = pages.findIndex(page=>page.includes(focused));
    const footer = panel.createDiv({cls:'dwh-paper-pager'});
    const prev = journalButton(footer,'‹',()=>show(index-1)); prev.setAttribute('aria-label','上一张'+({inspirations:'灵感',todos:'待办',work:'工作进展'}[key]));
    const label = footer.createSpan({cls:'dwh-paper-page-count',attr:{'aria-live':'polite'}});
    const next = journalButton(footer,'›',()=>show(index+1)); next.setAttribute('aria-label','下一张'+({inspirations:'灵感',todos:'待办',work:'工作进展'}[key]));
    const show = value => {
      if (value < 0 || value >= pages.length) return;
      if (rows.some(row=>row.contains(document.activeElement)&&document.activeElement.matches('input,textarea'))) return;
      index = value;
      rows.forEach((row,i)=>{row.hidden=!pages[index].includes(i);});
      state.index=index; const first=rows[pages[index][0]]; state.anchor=first?.dataset.dwhId || first?.dataset.dwhLineId || null;
      this.paperState[key]=state; label.textContent=`${index+1} / ${pages.length}`;
      prev.disabled=index===0; next.disabled=index===pages.length-1; footer.hidden=pages.length===1;
      panel.classList.toggle('dwh-paper-has-more',pages.length>1);
      list.classList.remove('dwh-paper-turn'); void list.offsetWidth; list.classList.add('dwh-paper-turn');
    };
    // 初次布局不隐藏正在编辑的条目。
    const active=document.activeElement;
    if (focused>=0) { rows.forEach((row,i)=>row.hidden=!pages[index].includes(i)); state.index=index; state.anchor=rows[pages[index][0]]?.dataset.dwhId||rows[pages[index][0]]?.dataset.dwhLineId; this.paperState[key]=state; label.textContent=`${index+1} / ${pages.length}`;prev.disabled=index===0;next.disabled=index===pages.length-1;footer.hidden=pages.length===1; }
    else show(Math.max(0,index));
    let start = null;
    if (!list.dataset.paperSwipe) {
      list.dataset.paperSwipe='1';
      let suppressClick=false;
      list.addEventListener('pointerdown',e=>{if(e.target.closest('input,textarea,button,.dwh-drag-handle'))return;start={x:e.clientX,y:e.clientY};});
      list.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){suppressClick=true;const buttons=panel.querySelectorAll('.dwh-paper-pager button');buttons[dx<0?1:0]?.click();setTimeout(()=>suppressClick=false,0);}});
      list.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
      list.addEventListener('pointercancel',()=>start=null);
    }
  }
  const diary=root.querySelector('.dwh-diary');
  if(diary){
    const body=diary.querySelector('.dwh-home-diary-body');
    const calendar=diary.querySelector('.dwh-diary__mini-cal');
    const preview=diary.querySelector('.dwh-home-journal-preview');
    diary.querySelector('.dwh-paper-diary-pager')?.remove();
    const split=compact&&(budget<330||diary.clientWidth<470);
    diary.classList.toggle('dwh-paper-diary-split',split);
    if(calendar&&preview){
      calendar.hidden=false;preview.hidden=false;
      if(split){
        const footer=diary.createDiv({cls:'dwh-paper-pager dwh-paper-diary-pager'});
        let index=this.paperState.diary?.index||0;
        const show=value=>{index=value;calendar.hidden=index===1;preview.hidden=index===0;this.paperState.diary={index};label.textContent=index===0?'日历 · 1 / 2':'日记 · 2 / 2';prev.disabled=index===0;next.disabled=index===1;};
        const prev=journalButton(footer,'‹',()=>show(0));prev.setAttribute('aria-label','上一张日历日记');
        const label=footer.createSpan({cls:'dwh-paper-page-count'});
        const next=journalButton(footer,'›',()=>show(1));next.setAttribute('aria-label','下一张日历日记');show(index);
      }
    }
  }
};
const prePagingRender = WorkstationHomeView.prototype.render;
WorkstationHomeView.prototype.render = function () {
  const root=this.contentEl||this.containerEl.children[1];
  const active=document.activeElement;
  const drafts=[...root.querySelectorAll('.dwh-inspiration__input,.dwh-todo__input')].filter(el=>!el.matches(this.paperClearDraft||'.never-match')).map(el=>({selector:el.classList.contains('dwh-inspiration__input')?'.dwh-inspiration__input':'.dwh-todo__input',value:el.value,focused:el===active,start:el.selectionStart,end:el.selectionEnd}));
  prePagingRender.call(this);
  for(const draft of drafts){const el=root.querySelector(draft.selector);if(!el)continue;el.value=draft.value;if(draft.focused){el.focus();el.setSelectionRange(draft.start,draft.end);}}
  if (!this.paperObserver) {
    let last='';this.paperObserver=new ResizeObserver(()=>{const size=root.clientWidth+':'+root.clientHeight;if(size===last)return;last=size;requestAnimationFrame(()=>this.setupPaperPaging());});
    this.paperObserver.observe(root);this.register(()=>this.paperObserver.disconnect());
  }
  requestAnimationFrame(()=>this.setupPaperPaging());
};
for(const [method,selector] of [['addTodo','.dwh-todo__input'],['addInspiration','.dwh-inspiration__input']]) {
  const original=WorkstationHomeView.prototype[method];
  WorkstationHomeView.prototype[method]=function(...args){this.paperClearDraft=selector;try{return original.apply(this,args);}finally{this.paperClearDraft=null;}};
}
const beforePaperRefresh=WorkstationHomePlugin.prototype.refreshHomeViews;
WorkstationHomePlugin.prototype.refreshHomeViews=function(){
  const views=this.app.workspace.getLeavesOfType(VIEW_TYPE_WORKSTATION_HOME);
  for(const leaf of views){
    const view=leaf.view,root=view.contentEl||view.containerEl.children[1];
    const active=document.activeElement;
    if(root.contains(active)&&active?.matches('input,textarea')){
      if(!view.paperPendingRefresh){view.paperPendingRefresh=true;active.addEventListener('blur',()=>setTimeout(()=>{view.paperPendingRefresh=false;view.render();},0),{once:true});}
    } else view.render();
  }
};
