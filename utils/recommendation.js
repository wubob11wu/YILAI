function colorInfo(color) {
  const text = color || "其他";
  const colorMap = [
    { pattern: /白/, name: "白色", hex: "#f5f1e8" },
    { pattern: /黑/, name: "黑色", hex: "#1c1b1a" },
    { pattern: /灰/, name: "灰色", hex: "#8d8a84" },
    { pattern: /卡其/, name: "卡其色", hex: "#a77947" },
    { pattern: /棕/, name: "棕色", hex: "#7d5436" },
    { pattern: /蓝/, name: "蓝色", hex: "#355c8a" },
    { pattern: /绿/, name: "绿色", hex: "#4f6f52" },
    { pattern: /红/, name: "红色", hex: "#b45b5b" },
    { pattern: /粉/, name: "粉色", hex: "#d8a2a9" },
    { pattern: /黄/, name: "黄色", hex: "#d7b756" },
    { pattern: /紫/, name: "紫色", hex: "#7a5f91" }
  ];
  return colorMap.find((item) => item.pattern.test(text)) || { name: text, hex: "#c8bba7" };
}

const sceneStyleScore = {
  "简约基础": { "上班": 20, "约会": 10, "休闲": 30, "运动": 10 },
  "通勤正式": { "上班": 50, "约会": -20, "休闲": -30, "运动": -40 },
  "韩系温柔": { "上班": -10, "约会": 50, "休闲": 20, "运动": -20 },
  "甜辣优雅": { "上班": -20, "约会": 50, "休闲": 0, "运动": -30 },
  "日系复古": { "上班": -20, "约会": 20, "休闲": 50, "运动": 10 },
  "日系清新": { "上班": 0, "约会": 35, "休闲": 35, "运动": 0 },
  "美式街头": { "上班": -30, "约会": 10, "休闲": 30, "运动": 50 },
  "商务休闲": { "上班": 40, "约会": 0, "休闲": 10, "运动": -20 },
  "休闲日常": { "上班": 0, "约会": 10, "休闲": 40, "运动": 20 }
};

function requiredSeasons(temp) {
  if (temp >= 28) return ["夏"];
  if (temp >= 10) return ["春", "秋"];
  return ["冬"];
}

function weatherScore(item, weather) {
  const seasons = requiredSeasons(Number(weather.temp) || 20);
  return (item.seasons || []).some((season) => seasons.includes(season)) ? 40 : 0;
}

function sceneScore(item, scene) {
  const sceneName = scene && scene.name ? scene.name : "休闲";
  const map = sceneStyleScore[item.mainStyle] || {};
  return map[sceneName] || 0;
}

function attrScore(item, scene) {
  const attrs = item.styleAttributes || item.styleTags || [];
  const sceneName = scene && scene.name ? scene.name : "休闲";
  let score = 0;
  if (attrs.includes("基础款")) score += 15;
  if (attrs.includes("纯色系")) score += 10;
  if (attrs.includes("极简风") && (sceneName === "上班" || item.mainStyle === "简约基础")) score += 10;
  if (attrs.includes("老钱风") && sceneName === "上班") score += 15;
  if (attrs.includes("运动风") && sceneName === "运动") score += 20;
  if (attrs.includes("工装风") && /日系|美式/.test(item.mainStyle || "")) score += 10;
  if (attrs.includes("小香风") && sceneName === "约会") score += 15;
  return score;
}

function scoreItem(item, weather, scene) {
  let score = 0;
  score += weatherScore(item, weather);
  score += sceneScore(item, scene) * 0.6;
  score += attrScore(item, scene);
  if (weather.rainChance > 50 && item.category === "鞋子" && /皮|防水|黑/.test(`${item.material}${item.color}`)) score += 8;
  score -= item.usageCount || 0;

  return score;
}

function getSeasonalCandidates(items, category, weather, scene) {
  const seasons = requiredSeasons(Number(weather.temp) || 20);
  return items
    .filter((item) => item.category === category)
    .filter((item) => (item.seasons || []).some((season) => seasons.includes(season)))
    .sort((a, b) => scoreItem(b, weather, scene) - scoreItem(a, weather, scene));
}

function colorLabel(top, pants, shoes) {
  const colors = [top && top.color, pants && pants.color, shoes && shoes.color].filter(Boolean);
  const dark = colors.some((color) => /黑|深|蓝/.test(color));
  const light = colors.some((color) => /白|浅|米|卡其/.test(color));
  if (dark && light) return "深浅平衡";
  if (colors.length && colors.every((color) => color === colors[0])) return "同色系";
  return "低饱和混搭";
}

function weatherReason(weather, top) {
  const temp = Number(weather.temp) || 20;
  const name = top && top.subcategory ? top.subcategory : "薄款单品";
  if (temp >= 28) return `今日 ${temp}℃，${name}透气舒适`;
  if (temp >= 20) return `今日 ${temp}℃，薄款厚度适中`;
  if (temp >= 12) return `今日 ${temp}℃，适合叠穿保持温度`;
  return `今日 ${temp}℃，保暖单品更稳妥`;
}

function paletteReason(colorTags) {
  const names = colorTags.map((item) => item.name);
  if (names.length && names.every((name) => name === names[0])) return "同色系搭配，高级感强";
  if (names.includes("白色") && names.includes("黑色")) return "黑白经典配色，简约不出错";
  if (names.includes("卡其色")) return "中性色加入卡其，温和有质感";
  return "低饱和配色，日常耐看";
}

function outfitSignature(itemIds) {
  return itemIds.filter(Boolean).join("-");
}

function daysSince(timestamp) {
  if (!timestamp) return 999;
  return Math.floor((Date.now() - timestamp) / 86400000);
}

function diversityLevel(comboCount) {
  if (comboCount <= 3) return 0.2;
  if (comboCount <= 9) return 0.45;
  if (comboCount <= 24) return 0.75;
  return 1;
}

function colorScore(items) {
  const colors = items.map((item) => item && item.color).filter(Boolean);
  const names = colors.map((color) => colorInfo(color).name);
  if (names.length < 2) return 8;
  if (names.every((name) => name === names[0])) return 15;
  if (names.includes("黑色") && names.includes("白色")) return 15;
  if (names.some((name) => /卡其|棕|灰/.test(name))) return 11;
  return 8;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sceneComboScore(items, scene) {
  const rawAverage = items.reduce((sum, item) => sum + sceneScore(item, scene), 0) / Math.max(items.length, 1);
  return clamp(((rawAverage + 40) / 90) * 30, 0, 30);
}

function attrComboScore(items, scene) {
  const rawAverage = items.reduce((sum, item) => sum + attrScore(item, scene), 0) / Math.max(items.length, 1);
  return clamp(rawAverage, 0, 15);
}

function weatherComboScore(items, weather) {
  const matched = items.filter((item) => weatherScore(item, weather) > 0).length;
  return (matched / Math.max(items.length, 1)) * 40;
}

function historyPenalty(combo, history, comboCount) {
  const level = diversityLevel(comboCount);
  const recommendations = (history && history.recommendations) || [];
  const outfits = (history && history.outfits) || [];
  const itemIds = combo.items.map((item) => item && item.id).filter(Boolean);
  const signature = outfitSignature(itemIds);
  let penalty = 0;

  recommendations.slice(0, 8).forEach((record, index) => {
    if (record.signature === signature) penalty += (42 - index * 4) * level;
    const overlap = itemIds.filter((id) => (record.itemIds || []).includes(id)).length;
    penalty += overlap * Math.max(0, 7 - index) * level;
  });

  outfits.slice(0, 14).forEach((record) => {
    const age = daysSince(record.createdAt);
    const sameOutfit = outfitSignature(record.itemIds || []) === signature;
    const overlap = itemIds.filter((id) => (record.itemIds || []).includes(id)).length;
    if (sameOutfit && age <= 14) penalty += (46 - age * 2) * level;
    if (overlap && age <= 7) penalty += overlap * (16 - age * 2) * level;
  });

  combo.items.forEach((item) => {
    penalty += (item.usageCount || 0) * 2.5 * level;
  });

  return penalty;
}

function explorationBonus(combo, history, comboCount) {
  const level = diversityLevel(comboCount);
  const recommendations = (history && history.recommendations) || [];
  const seenIds = recommendations.slice(0, 12).flatMap((record) => record.itemIds || []);
  return combo.items.reduce((sum, item) => {
    if (!item || seenIds.includes(item.id)) return sum;
    return sum + 5 * level;
  }, 0);
}

function buildCombos(items, weather, scene) {
  const tops = getSeasonalCandidates(items, "上装", weather, scene).slice(0, 8);
  const pants = getSeasonalCandidates(items, "下装", weather, scene).slice(0, 8);
  const shoes = getSeasonalCandidates(items, "鞋子", weather, scene).slice(0, 8);
  const combos = [];

  tops.forEach((top) => {
    pants.forEach((bottom) => {
      if (shoes.length) {
        shoes.forEach((shoe) => combos.push({ top, pants: bottom, shoes: shoe, items: [top, bottom, shoe] }));
      } else {
        combos.push({ top, pants: bottom, shoes: null, items: [top, bottom].filter(Boolean) });
      }
    });
  });

  return combos;
}

function scoreCombo(combo, weather, scene, history, comboCount) {
  const baseScore =
    weatherComboScore(combo.items, weather) +
    sceneComboScore(combo.items, scene) +
    colorScore(combo.items) +
    attrComboScore(combo.items, scene);
  const score =
    baseScore +
    explorationBonus(combo, history, comboCount) -
    historyPenalty(combo, history, comboCount);
  return score;
}

function buildRecommendation(items, weather, profile, scene, offset, history) {
  const currentOffset = offset || 0;
  const combos = buildCombos(items, weather, scene);
  const comboCount = combos.length;
  const rankedCombos = combos
    .map((combo) => Object.assign({}, combo, { score: scoreCombo(combo, weather, scene, history, comboCount) }))
    .sort((a, b) => b.score - a.score);
  const selectedCombo = rankedCombos.length ? rankedCombos[currentOffset % rankedCombos.length] : {};
  const top = selectedCombo.top || null;
  const pants = selectedCombo.pants || null;
  const shoes = selectedCombo.shoes || null;
  const missing = [];
  if (!top) missing.push("上装");
  if (!pants) missing.push("下装");
  if (!shoes) missing.push("鞋子");

  const selected = [top, pants, shoes].filter(Boolean);
  const itemIds = selected.map((item) => item.id);
  const colorTags = selected.slice(0, 3).map((item) => {
    const color = colorInfo(item.color);
    return Object.assign({}, color, { id: item.id });
  });
  const sceneNote = scene && scene.note ? scene.note : "当前场景自然得体，不容易出错";

  return {
    top,
    pants,
    shoes,
    pieces: [
      { role: "上衣", item: top, name: top ? top.name : "上衣暂无", image: top ? top.image : "" },
      { role: "下装", item: pants, name: pants ? pants.name : "下装暂无", image: pants ? pants.image : "" },
      { role: "鞋子", item: shoes, name: shoes ? shoes.name : "鞋子暂无", image: shoes ? shoes.image : "" }
    ],
    missing,
    palette: colorLabel(top, pants, shoes),
    colorTags,
    reasonLines: selected.length
      ? [weatherReason(weather, top), paletteReason(colorTags), sceneNote]
      : ["衣橱中还没有足够单品，请先录入衣物", "补充上装、下装、鞋子后可生成完整组合", "录入图片后这里会展示真实单品图"],
    itemIds,
    signature: outfitSignature(itemIds),
    score: selectedCombo.score || 0,
    candidateCount: comboCount
  };
}

module.exports = {
  buildRecommendation,
  colorInfo,
  requiredSeasons
};
