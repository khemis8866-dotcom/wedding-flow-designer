(()=>{const sources={"model":function(require,module,exports){"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.emptyBrand = exports.defaultOptions = void 0;
exports.uid = uid;
exports.clone = clone;
exports.ensure = ensure;
exports.logoScale = logoScale;
exports.logoDimensions = logoDimensions;
exports.defaultOptions = { time: true, description: true, steps: true, couple: true, planner: true, host: true, other: true, music: true, brand: true };
exports.emptyBrand = { name: '', contact: '', signoff: '', logo: '' };
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
class AppError extends Error {
    constructor(code, message, detail) {
        super(message);
        this.code = code;
        this.detail = detail;
    }
}
exports.AppError = AppError;
function ensure(test, code, message) { if (!test)
    throw new AppError(code, message); }
function logoScale(value) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(25, Math.min(300, Math.round(value))) : 100; }
function logoDimensions(width, height, scale = 100) {
    const ratio = Math.min(180 / width, 70 / height, 1) * logoScale(scale) / 100;
    return { width: width * ratio, height: height * ratio, upscaled: ratio > 1 };
}
},"wedding":function(require,module,exports){"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets = void 0;
exports.section = section;
exports.createWedding = createWedding;
exports.validateWedding = validateWedding;
exports.clockAt = clockAt;
exports.timeline = timeline;
exports.total = total;
exports.move = move;
exports.copySection = copySection;
exports.copyWedding = copyWedding;
exports.removeStep = removeStep;
exports.completedExports = completedExports;
exports.nextExportVersion = nextExportVersion;
const model_1 = require("./model");
exports.presets = ['婚礼暖场', '主持人开场白', '新人入场', '新人移步主舞台', '婚礼问誓', '送戒指', '交换戒指', '拥抱或亲吻', '嘉宾及新人致辞', '父母入场', '父母致辞', '全家福合影', '共同举杯', '手捧花仪式', '全场大合影', '新人退场', '主持人致谢'];
const durations = [5, 3, 5, 1, 4, 1, 2, 1, 4, 1, 3, 2, 2, 2, 3, 2, 1];
function section(name = '自定义环节', duration = 2) { return { id: (0, model_1.uid)(), name, description: '', duration, people: '', notes: { couple: '', planner: '', host: '', other: '' }, steps: [], music: [] }; }
function createWedding(info, owner) {
    const now = Date.now();
    const w = { id: (0, model_1.uid)(), owner, groom: '', bride: '', date: '', start: '18:18', venue: '', theme: '', sections: exports.presets.map((n, i) => section(n, durations[i])), revision: 0, createdAt: now, updatedAt: now, deletedAt: null, ...info };
    w.owner = owner;
    validateWedding(w);
    return w;
}
function validateWedding(w) {
    (0, model_1.ensure)(w && typeof w === 'object', 'INVALID', '婚礼数据格式错误');
    for (const key of ['groom', 'bride'])
        (0, model_1.ensure)(typeof w[key] === 'string' && w[key].trim().length > 0 && w[key].length <= 40, 'INVALID', '请填写新人姓名（40字以内）');
    (0, model_1.ensure)(/^\d{4}-\d{2}-\d{2}$/.test(w.date) && new Date(w.date + 'T00:00:00Z').toISOString().slice(0, 10) === w.date, 'INVALID', '请选择有效日期');
    (0, model_1.ensure)(/^([01]\d|2[0-3]):[0-5]\d$/.test(w.start), 'INVALID', '请选择有效开始时间');
    (0, model_1.ensure)(typeof w.venue === 'string' && w.venue.length <= 200 && typeof w.theme === 'string' && w.theme.length <= 100, 'INVALID', '地点或主题过长');
    (0, model_1.ensure)(w.exportCount === undefined || Number.isSafeInteger(w.exportCount) && w.exportCount >= 0 && w.exportCount < Number.MAX_SAFE_INTEGER, 'INVALID', '导出次数无效');
    (0, model_1.ensure)(Array.isArray(w.sections) && w.sections.length <= 80, 'LIMIT', '最多支持80个主环节');
    const ids = new Set();
    let steps = 0;
    for (const s of w.sections) {
        (0, model_1.ensure)(typeof s.id === 'string' && !ids.has(s.id), 'INVALID', '环节编号重复');
        ids.add(s.id);
        (0, model_1.ensure)(typeof s.name === 'string' && !!s.name.trim() && s.name.length <= 80, 'INVALID', '环节名称不能为空，最多80字');
        (0, model_1.ensure)(Number.isInteger(s.duration) && s.duration >= 0 && s.duration <= 1440, 'INVALID', '环节时长需为0至1440的整数分钟');
        (0, model_1.ensure)(typeof s.description === 'string' && s.description.length <= 6000 && typeof s.people === 'string' && s.people.length <= 500, 'LIMIT', '环节说明或参与人员过长');
        for (const k of ['couple', 'planner', 'host', 'other'])
            (0, model_1.ensure)(typeof s.notes?.[k] === 'string' && s.notes[k].length <= 6000, 'LIMIT', '备注最多6000字');
        (0, model_1.ensure)(Array.isArray(s.steps) && Array.isArray(s.music) && s.music.length <= 20, 'LIMIT', '每个环节最多关联20首音乐');
        const stepIds = new Set();
        for (const t of s.steps) {
            (0, model_1.ensure)(typeof t.id === 'string' && !stepIds.has(t.id) && typeof t.name === 'string' && t.name.length <= 1000 && !!t.name.trim() && Number.isInteger(t.duration) && t.duration >= 0 && t.duration <= 1440, 'INVALID', '子步骤名称、时长或编号无效');
            stepIds.add(t.id);
            steps++;
        }
        const linkIds = new Set();
        for (const m of s.music) {
            (0, model_1.ensure)(typeof m.id === 'string' && !linkIds.has(m.id) && typeof m.assetId === 'string' && (!m.stepId || stepIds.has(m.stepId)) && typeof m.usage === 'string' && m.usage.length <= 300 && typeof m.cue === 'string' && m.cue.length <= 1000 && (m.previewUrl === undefined || typeof m.previewUrl === 'string' && m.previewUrl.length <= 2048), 'INVALID', '音乐关联或子步骤不存在');
            linkIds.add(m.id);
        }
    }
    (0, model_1.ensure)(steps <= 240, 'LIMIT', '最多支持240个子步骤');
    (0, model_1.ensure)(encodeURIComponent(JSON.stringify(w)).replace(/%[A-F0-9]{2}/g, 'x').length <= 700000, 'LIMIT', '项目内容过大，请拆分为多个婚礼项目');
}
function clockAt(minutes) { const day = Math.floor(minutes / 1440); const m = ((minutes % 1440) + 1440) % 1440; return (day ? `+${day}天 ` : '') + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function timeline(w) { let elapsed = Number(w.start.slice(0, 2)) * 60 + Number(w.start.slice(3)); return w.sections.map((s, i) => { const start = clockAt(elapsed); elapsed += s.duration; return { ...s, index: i + 1, start, end: clockAt(elapsed) }; }); }
function total(w) { return w.sections.reduce((n, s) => n + s.duration, 0); }
function move(items, from, to) { (0, model_1.ensure)(from >= 0 && from < items.length && to >= 0 && to < items.length, 'INVALID', '排序位置无效'); const arr = items.slice(); const [v] = arr.splice(from, 1); arr.splice(to, 0, v); return arr; }
function copySection(s) { const out = (0, model_1.clone)(s); out.id = (0, model_1.uid)(); const map = new Map(); out.steps.forEach(t => { const id = (0, model_1.uid)(); map.set(t.id, id); t.id = id; }); out.music.forEach(m => { m.id = (0, model_1.uid)(); m.stepId = map.get(m.stepId) || ''; }); return out; }
function copyWedding(w, preserveExportCount = false, history = []) { const out = (0, model_1.clone)(w); out.id = (0, model_1.uid)(); out.sections = w.sections.map(copySection); out.revision = 0; out.exportCount = preserveExportCount ? completedExports(w, history) : 0; out.createdAt = out.updatedAt = Date.now(); out.deletedAt = null; return out; }
function removeStep(s, id) { s.steps = s.steps.filter(t => t.id !== id); s.music = s.music.filter(m => m.stepId !== id); }
function completedExports(w, history = []) {
    if (Number.isSafeInteger(w.exportCount) && w.exportCount >= 0)
        return w.exportCount;
    const entries = history.filter(e => e && e.weddingId === w.id);
    return entries.reduce((count, e) => Number.isSafeInteger(e.exportVersion) && e.exportVersion > count ? e.exportVersion : count, entries.length);
}
function nextExportVersion(w, history = []) {
    const count = completedExports(w, history);
    (0, model_1.ensure)(count < Number.MAX_SAFE_INTEGER - 1, 'LIMIT', '导出版本数量已达上限');
    return count + 1;
}
},"projection":function(require,module,exports){"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project = project;
const model_1 = require("./model");
const wedding_1 = require("./wedding");
function project(w, assets, brand, opts = {}, exportVersion = (0, wedding_1.nextExportVersion)(w)) {
    const o = { ...model_1.defaultOptions, ...opts };
    const map = new Map(assets.map(a => [a.id, a.name]));
    return { id: w.id, revision: w.revision, exportVersion, title: `${w.bride} & ${w.groom}`, date: w.date, venue: w.venue, theme: w.theme, total: (0, wedding_1.total)(w), brand: o.brand ? brand : { name: '', contact: '', signoff: '', logo: '' }, rows: (0, wedding_1.timeline)(w).map(s => {
            const lines = [];
            if (o.description && s.description)
                lines.push('环节说明：' + s.description);
            if (s.people)
                lines.push('参与人员：' + s.people);
            if (o.steps)
                s.steps.forEach((t, i) => lines.push(`${i + 1}. ${t.name}${t.duration ? `（${t.duration}分钟）` : ''}`));
            if (o.music)
                s.music.forEach(m => { const step = s.steps.find(t => t.id === m.stepId); lines.push(`音乐：${map.get(m.assetId) || '未找到音乐'}${step ? ` · ${step.name}` : ''}${m.cue ? ` · 提示：${m.cue}` : ''}`); });
            for (const [key, label] of [['couple', '新人须知'], ['planner', '管家及督导备注'], ['host', '主持人备注'], ['other', '其他备注']])
                if (o[key] && s.notes[key])
                    lines.push(`${label}：${s.notes[key]}`);
            return { id: s.id, index: s.index, name: s.name, start: o.time ? s.start : '', duration: s.duration, lines };
        }) };
}
}},cache={};function load(name){name=name.replace('./','');if(cache[name])return cache[name].exports;const m={exports:{}};cache[name]=m;sources[name](load,m,m.exports);return m.exports;}window.WeddingCore={...load('model'),...load('wedding'),...load('projection')};})();