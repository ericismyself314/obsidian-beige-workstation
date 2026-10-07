// 隔离的浏览器测试宿主，使用示例日记，不连接真实仓库。
window.notices=[];
const events={};
HTMLElement.prototype.createEl=function(tag,opts={}){const el=document.createElement(tag);if(opts.cls)el.className=opts.cls;if(opts.text!==undefined)el.textContent=opts.text;for(const [k,v] of Object.entries(opts.attr||{}))el.setAttribute(k,v);this.appendChild(el);return el;};
HTMLElement.prototype.createDiv=function(opts){return this.createEl('div',typeof opts==='string'?{cls:opts}:opts)};
HTMLElement.prototype.createSpan=function(opts){return this.createEl('span',opts)};
HTMLElement.prototype.empty=function(){this.replaceChildren()};
HTMLElement.prototype.addClass=function(...cs){this.classList.add(...cs)};
HTMLElement.prototype.removeClass=function(...cs){this.classList.remove(...cs)};
HTMLElement.prototype.setText=function(t){this.textContent=t};
HTMLElement.prototype.appendText=function(t){this.append(document.createTextNode(t))};
HTMLElement.prototype.setAttr=function(k,v){this.setAttribute(k,v)};
class TFile {constructor(path,text){this.path=path;this.basename=path.split('/').pop().replace(/\.md$/,'');this.extension='md';this.stat={mtime:Date.now()};this.text=text}}
class TFolder {constructor(path){this.path=path;this.children=[]}}
class Empty {constructor(app){this.app=app}}
class ItemView {constructor(leaf){this.leaf=leaf;this.app=leaf.app;this.containerEl=document.createElement('div');this.containerEl.className='workspace-leaf';this.containerEl.createDiv({cls:'view-header'});this.contentEl=this.containerEl.createDiv({cls:'view-content'});this.disposers=[];}register(fn){this.disposers.push(fn)}registerEvent(e){}registerInterval(id){}async setState(){} }
class Plugin {constructor(){this.manifest={id:'dandan-workstation-home',dir:'.obsidian/plugins/dandan-workstation-home'};this.app=app;this.disposers=[]}async loadData(){return sampleData}async saveData(data){window.savedData=JSON.parse(JSON.stringify(data))}register(fn){this.disposers.push(fn)}registerEvent(){}registerView(type,make){factories[type]=make}addCommand(){}addRibbonIcon(){}addSettingTab(){}}
const fmParse=s=>{const obj={};for(const line of s.split('\n')){const i=line.indexOf(':');if(i<0)continue;let val=line.slice(i+1).trim();try{val=JSON.parse(val)}catch{}obj[line.slice(0,i)]=val;}return obj};
const ob=new Proxy({TFile,TFolder,ItemView,Plugin,Modal:Empty,PluginSettingTab:Empty,FuzzySuggestModal:Empty,Notice:class {constructor(t){notices.push(t)}},parseYaml:fmParse,stringifyYaml:o=>Object.entries(o).map(([k,v])=>k+': '+JSON.stringify(v)).join('\n')+'\n',normalizePath:p=>p.replace(/\\/g,'/').replace(/\/+$/,'')},{get:(t,k)=>t[k]||(()=>{})});
window.require=n=>{if(n==='obsidian')return ob;throw Error(n)};window.module={exports:{}};
const sampleData={version:1,inspirations:[{id:'i1',text:'关于专注与分心的几个观察',order:0},{id:'i2',text:'把复杂的问题写清楚',order:1}],todos:[{id:'t1',text:'整理读书笔记',completed:false,order:0},{id:'t2',text:'准备活动复盘',completed:false,order:1}],documentLines:[],settings:{openOnStartup:false,diaryFolder:'日记',defaultDocumentFolder:'研究',diaryDateFormat:'YYYY-MM-DD',recentDiaryCount:7,weekStartsOn:1,openDiaryIn:'current',showWeather:false,holidayRegion:'CN',holidaySecondary:''},weatherCache:{},holidayCache:{},geocodeCache:{}};
sampleData.documentLines=[{id:'w1',title:'活动复盘',documentPaths:[],order:0,steps:[{id:'s1',text:'内容整理'},{id:'s2',text:'页面设计'},{id:'s3',text:'最后检查'}]},{id:'w2',title:'小程序',documentPaths:[],order:1,steps:[{id:'s4',text:'修改题目'},{id:'s5',text:'等待审核'}]}];
const folder=new TFolder('日记');
for(const date of ['2026-10-06','2026-10-05','2026-09-21','2026-09-20','2026-09-18'])folder.children.push(new TFile('日记/'+date+'.md','---\n日期: '+date+'\n星期: 星期二\n标题: "'+(date==='2026-10-06'?'秋日里的小事':'日常记录')+'"\n心情: "平静"\n天气: "晴，有微风"\n---\n\n## 今天有什么要写的\n\n今天把一直拖着的事情做完了。窗边的光落在桌上，觉得这一天也有值得记下的地方。\n\n下午留了一点时间读书，没有赶进度，只记下几句喜欢的话。\n\n## 今天学到的东西\n\n遇到复杂的问题，可以先把它拆成更小的部分，一步一步来。\n\n## 今天有什么要反思的\n\n开始之前花了太多时间犹豫，明天可以先做一个小步骤。\n'));
const store={};const files=new Map(folder.children.map(f=>[f.path,f]));files.set('日记',folder);
const emit=(ev,...args)=>(events[ev]||[]).forEach(f=>f(...args));
const vault={configDir:'.obsidian',adapter:{read:async p=>{if(!(p in store))throw Error('missing');return store[p]},write:async(p,s)=>{store[p]=s}},on:(ev,fn)=>{(events[ev]||=[]).push(fn);return{}},getAbstractFileByPath:p=>files.get(p),read:async f=>f.text,cachedRead:async f=>f.text,process:async(f,cb)=>{f.text=cb(f.text);emit('modify',f)},create:async(p,s)=>{const f=new TFile(p,s);files.set(p,f);folder.children.push(f);emit('create',f);return f},createFolder:async()=>{},getMarkdownFiles:()=>folder.children};
const factories={},leaves=[];
const workspace={getLeavesOfType:type=>leaves.filter(l=>l.type===type),getLeaf:()=>{const leaf={app,type:'',view:null,setViewState:async state=>{leaf.type=state.type;leaf.view=factories[state.type](leaf);document.getElementById('app').replaceChildren(leaf.view.containerEl);await leaf.view.onOpen()},openFile:async f=>{window.openedFile=f.path}};leaves.push(leaf);return leaf},revealLeaf:async leaf=>{document.getElementById('app').replaceChildren(leaf.view.containerEl)},on:()=>({}),onLayoutReady:()=>{},detachLeavesOfType:()=>{}};
const app={vault,workspace,metadataCache:{getFileCache:()=>null},fileManager:{},internalPlugins:{plugins:{}}};
window.fixture={app,files,store,sampleData};
