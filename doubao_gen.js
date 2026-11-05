#!/usr/bin/env node
/**
 * 豆包 / 火山方舟 图像生成调用脚本
 *
 * 用法：
 *   node doubao_gen.js --check
 *   node doubao_gen.js --prompt-file prompts/character-sheet.txt --out art/generated/character-sheet.png
 *   node doubao_gen.js --prompt "..." --out art/generated/test.png --size 1024x1024
 *   node doubao_gen.js --prompt-file ... --ref art/generated/character-sheet.png --out ...
 *
 * 配置：项目根目录 .env.local
 *   ARK_API_KEY=...
 *   ARK_MODEL=...            # 模型 ID 或接入点 ID（ep-...）
 *   ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
 *   ARK_SIZE=1024x1024
 *   ARK_SUPPORTS_REF=1       # 如果你的模型支持参考图，再打开
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'art', 'generated');

function loadEnvFile() {
  const out = {};
  for (const name of ['.env.local', '.env']) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  }
  return out;
}

const fileEnv = loadEnvFile();
const cfg = {
  key: (process.env.ARK_API_KEY || fileEnv.ARK_API_KEY || '').trim(),
  model: (process.env.ARK_MODEL || fileEnv.ARK_MODEL || '').trim(),
  base: (process.env.ARK_BASE_URL || fileEnv.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/, ''),
  size: process.env.ARK_SIZE || fileEnv.ARK_SIZE || '1024x1024',
  supportsRef: (process.env.ARK_SUPPORTS_REF || fileEnv.ARK_SUPPORTS_REF || '') === '1'
};
const PRICE_PER_IMAGE = Number(process.env.ARK_PRICE || fileEnv.ARK_PRICE || 0.12);

function usageStats() {
  const file = path.join(OUT_DIR, 'usage.jsonl');
  let count = 0, total = 0, last = null;
  const groups = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const j = JSON.parse(line);
        const cost = Number(j.estimatedCost) || PRICE_PER_IMAGE;
        const model = j.model || 'unknown';
        count++;
        total += cost;
        last = j;
        if (!groups[model]) groups[model] = { count: 0, total: 0 };
        groups[model].count++;
        groups[model].total += cost;
      } catch {}
    }
  }
  return { count, total, last, file, groups };
}

function printSpend() {
  const s = usageStats();
  console.log('豆包图像用量（本地估算，不是账户余额）');
  console.log('--------------------------------');
  console.log('成功图片 :', s.count, '张');
  console.log('预计累计 :', s.total.toFixed(2), '元');
  console.log('按模型   :');
  for (const [model, g] of Object.entries(s.groups)) {
    console.log(`  ${model}: ${g.count} 张，${g.total.toFixed(2)} 元`);
  }
  if (s.last) console.log('最近一次 :', s.last.time, '·', s.last.out);
  console.log('用量记录 :', s.file);
  console.log('--------------------------------');
  console.log('实际扣费 / 余额：火山引擎控制台 → 费用中心 → 账户总览。');
  console.log('被 429/4xx 拒绝的失败请求通常不计费，以账单为准。');
}

function printBalanceInfo() {
  console.log('实际余额：用当前的 ARK_API_KEY 查不到。');
  console.log('--------------------------------');
  console.log('Ark 图像 API Key 只能调用模型，不能读火山引擎账户余额。');
  console.log('余额查询接口 QueryBalanceAcct 属于费用中心 OpenAPI，需要火山引擎 AK/SK 签名，不是这个 Key。');
  console.log('');
  console.log('查看实际余额：https://console.volcengine.com/finance/');
  console.log('本地能提供的是“成功张数 × 单价”的估算：node doubao_gen.js --spend');
}


function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[k] = next; i++; }
      else args[k] = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function usage() {
  console.log(`豆包图像生成

  node doubao_gen.js --check
  node doubao_gen.js --spend      # 看本地累计估算
  node doubao_gen.js --balance    # 说明为什么查不到实际余额
  node doubao_gen.js --prompt-file prompts/character-sheet.txt --out art/generated/character-sheet.png
  node doubao_gen.js --prompt "描述" --out art/generated/test.png --size 1024x1024
  node doubao_gen.js --prompt-file ... --ref art/generated/character-sheet.png --out ...

配置写在 ${path.join(ROOT, '.env.local')}：
  ARK_API_KEY=你的 Key
  ARK_MODEL=模型 ID 或 ep- 接入点
  ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
  ARK_SIZE=1024x1024
  ARK_SUPPORTS_REF=1   # 只有模型支持参考图时才填

不要把 Key 发到聊天里。`);
}

function check() {
  const mask = s => s ? `${s.slice(0, 3)}…${s.slice(-2)}（长度 ${s.length}）` : '未配置';
  console.log('豆包图像生成 · 配置检查');
  console.log('--------------------------------');
  console.log('配置文件 :', fs.existsSync(path.join(ROOT, '.env.local')) ? '.env.local 已存在' : '.env.local 不存在');
  console.log('API Key  :', cfg.key ? mask(cfg.key) : '未配置');
  console.log('模型     :', cfg.model || '未配置');
  console.log('Base URL :', cfg.base);
  console.log('尺寸     :', cfg.size);
  console.log('参考图   :', cfg.supportsRef ? '已允许（ARK_SUPPORTS_REF=1）' : '未开启');
  console.log('--------------------------------');
  const missing = [];
  if (!cfg.key) missing.push('ARK_API_KEY');
  if (!cfg.model) missing.push('ARK_MODEL');
  if (missing.length) {
    console.log('还不能生成：缺 ' + missing.join('、'));
    console.log('');
    console.log('请编辑：' + path.join(ROOT, '.env.local'));
    console.log('填入：');
    if (!cfg.key) console.log('  ARK_API_KEY=你的火山方舟 API Key');
    if (!cfg.model) console.log('  ARK_MODEL=你的图像模型 ID 或 ep- 接入点');
    console.log('');
    console.log('Key 不要发在聊天里，填文件即可。');
    return false;
  }
  console.log('配置齐全，可以生成。');
  return true;
}

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function dataUrl(file) {
  const b = fs.readFileSync(file);
  return `data:${mimeOf(file)};base64,${b.toString('base64')}`;
}

async function postJson(url, body, headers, timeoutMs = 180000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctl.signal
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = { raw: text.slice(0, 1200) }; }
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载图片失败 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

async function generate(args) {
  if (!check()) process.exit(2);

  let prompt = args.prompt;
  if (args['prompt-file']) {
    const p = path.resolve(ROOT, args['prompt-file']);
    if (!fs.existsSync(p)) { console.error('找不到提示词文件：' + p); process.exit(2); }
    prompt = fs.readFileSync(p, 'utf8').trim();
  }
  if (!prompt) { console.error('缺 --prompt 或 --prompt-file'); process.exit(2); }

  const dryRun = !!args['dry-run'];
  const confirmed = !!args.yes;
  const out = path.resolve(ROOT, args.out || path.join('art', 'generated', `doubao-${Date.now()}.png`));
  const stats = usageStats();
  console.log(`历史成功：${stats.count} 张，预计累计 ${stats.total.toFixed(2)} 元（本地估算，不是账户余额）。`);

  if (dryRun) {
    console.log('DRY RUN：不会发送请求，不会产生费用。');
    console.log(JSON.stringify({
      model: cfg.model,
      base: cfg.base,
      size: args.size || cfg.size,
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 120) + (prompt.length > 120 ? '…' : ''),
      ref: args.ref || null,
      estimatedCost: PRICE_PER_IMAGE,
      out: path.relative(ROOT, out)
    }, null, 2));
    return;
  }

  if (!confirmed) {
    console.log('这次会调用豆包 API，预计费用：' + PRICE_PER_IMAGE.toFixed(2) + ' 元/张。');
    console.log('本次成功后预计累计：约 ' + (stats.total + PRICE_PER_IMAGE).toFixed(2) + ' 元（估算）。');
    console.log('确认调用请加 --yes；只想看参数请加 --dry-run。');
    console.log('已取消，没有发送任何请求，也没有产生费用。');
    process.exit(2);
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });

  const body = {
    model: cfg.model,
    prompt,
    response_format: 'url',
    size: args.size || cfg.size,
    output_format: 'png',
    watermark: false
  };

  if (args.ref) {
    if (!cfg.supportsRef) {
      console.error('你用了 --ref，但配置里没有 ARK_SUPPORTS_REF=1。');
      console.error('如果这个模型不支持参考图，请去掉 --ref；如果支持，请在 .env.local 里加 ARK_SUPPORTS_REF=1。');
      process.exit(2);
    }
    body.image = dataUrl(path.resolve(ROOT, args.ref));
  }

  const url = `${cfg.base}/images/generations`;
  console.log('正在请求豆包…');
  console.log('  模型：' + cfg.model);
  console.log('  尺寸：' + body.size);
  console.log('  提示词长度：' + prompt.length);

  let json;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      json = await postJson(url, body, {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.key}`
      });
      break;
    } catch (e) {
      const retryable = e.status === 429 || (e.status >= 500 && e.status < 600) || e.name === 'AbortError';
      console.error(`第 ${attempt} 次失败：${e.message}`);
      if (e.payload) console.error(JSON.stringify(e.payload).slice(0, 1200));
      const code = e.payload && e.payload.error && e.payload.error.code;
      if (code === 'SetLimitExceeded') {
        console.error('');
        console.error('这不是 Key 或模型的问题，是「安心体验」的免费额度限额到了。');
        console.error('去模型开通页，把「安心体验」关掉（改为按量付费），再重新运行。');
        process.exit(1);
      }
      if (!retryable || attempt === 3) {
        console.error('生成失败。请检查 Key、模型 ID、账户额度、模型是否支持该尺寸/参考图。');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 1200 * attempt));
    }
  }

  const item = json && json.data && json.data[0];
  if (!item) {
    console.error('接口返回里没有 data[0]：');
    console.error(JSON.stringify(json).slice(0, 2000));
    process.exit(1);
  }

  let bytes = 0;
  if (item.b64_json) {
    const buf = Buffer.from(item.b64_json, 'base64');
    fs.writeFileSync(out, buf);
    bytes = buf.length;
  } else if (item.url) {
    bytes = await download(item.url, out);
  } else {
    console.error('接口返回既没有 url 也没有 b64_json：');
    console.error(JSON.stringify(item).slice(0, 2000));
    process.exit(1);
  }

  const meta = {
    model: cfg.model,
    size: body.size,
    prompt,
    ref: args.ref || null,
    createdAt: new Date().toISOString(),
    file: path.relative(ROOT, out),
    estimatedCost: PRICE_PER_IMAGE
  };
  fs.writeFileSync(out.replace(/\.png$/i, '.json'), JSON.stringify(meta, null, 2));

  fs.appendFileSync(
    path.join(OUT_DIR, 'usage.jsonl'),
    JSON.stringify({
      time: new Date().toISOString(),
      model: cfg.model,
      size: body.size,
      out: path.relative(ROOT, out),
      estimatedCost: PRICE_PER_IMAGE
    }) + '\n'
  );

  console.log('');
  console.log('生成成功：' + out);
  console.log('文件大小：' + (bytes / 1024).toFixed(1) + ' KB');
  console.log('预计费用：' + PRICE_PER_IMAGE.toFixed(2) + ' 元（以火山引擎账单为准）');
  const after = usageStats();
  console.log('累计成功：' + after.count + ' 张，预计累计 ' + after.total.toFixed(2) + ' 元（本地估算）。');
  console.log('提示词副本：' + out.replace(/\.png$/i, '.json'));
  console.log('用量记录：' + path.join(OUT_DIR, 'usage.jsonl'));
}

const args = parseArgs(process.argv.slice(2));
if (args.help) { usage(); process.exit(0); }
if (args.check) { process.exit(check() ? 0 : 2); }
if (args.spend) { printSpend(); process.exit(0); }
if (args.balance) { printBalanceInfo(); process.exit(0); }
generate(args).catch(e => {
  console.error('未捕获错误：' + e.message);
  process.exit(1);
});
