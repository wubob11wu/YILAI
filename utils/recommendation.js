function colorInfo(color) {
  const text = color || "未填色";
  const colorMap = [
    { pattern: /白|米|奶|象牙/, name: "白色", hex: "#f5f1e8" },
    { pattern: /黑|墨/, name: "黑色", hex: "#1c1b1a" },
    { pattern: /灰|银/, name: "灰色", hex: "#8d8a84" },
    { pattern: /卡其|驼|棕|咖/, name: "卡其色", hex: "#a77947" },
    { pattern: /蓝|牛仔/, name: "蓝色", hex: "#355c8a" },
    { pattern: /绿/, name: "绿色", hex: "#4f6f52" },
    { pattern: /红|粉/, name: "红色", hex: "#b45b5b" }
  ];
  return colorMap.find((item) => item.pattern.test(text)) || { name: text, hex: "#c8bba7" };
}

function scoreItem(item, weather, profile, scene) {
  let score = 0;
  const prefs = profile.stylePrefs || [];
  const itemStyles = item.styleTags || item.tags || [];
  const sceneStyles = (scene && scene.styles) || [];
  const avoid = (scene && scene.avoid) || [];

  if ((item.seasons || []).includes(weather.season)) score += 4;
  if (prefs.some((style) => itemStyles.includes(style))) score += 3;
  if (sceneStyles.some((style) => itemStyles.includes(style))) score += 4;
  if (avoid.some((word) => `${item.name}${item.subcategory}${item.tags}`.includes(word))) score -= 4;
  if (weather.rainChance > 50 && item.category === "鞋履" && /皮|防水|黑/.test(`${item.material}${item.color}`)) score += 2;
  if (weather.temp >= 26 && /棉|麻|聚酯/.test(item.material || "")) score += 1;
  if (weather.temp < 12 && /针织|羊毛|皮/.test(item.material || "")) score += 1;
  score -= item.usageCount || 0;

  return score;
}

function bestOf(items, category, weather, profile, scene, offset) {
  const candidates = items
    .filter((item) => item.category === category)
    .sort((a, b) => scoreItem(b, weather, profile, scene) - scoreItem(a, weather, profile, scene));
  if (!candidates.length) return null;
  return candidates[offset % candidates.length];
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

function buildRecommendation(items, weather, profile, scene, offset) {
  const currentOffset = offset || 0;
  const top = bestOf(items, "上衣", weather, profile, scene, currentOffset);
  const pants = bestOf(items, "下装", weather, profile, scene, currentOffset);
  const shoes = bestOf(items, "鞋履", weather, profile, scene, currentOffset);
  const missing = [];
  if (!top) missing.push("上衣");
  if (!pants) missing.push("下装");
  if (!shoes) missing.push("鞋履");

  const selected = [top, pants, shoes].filter(Boolean);
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
      { role: "鞋履", item: shoes, name: shoes ? shoes.name : "鞋履暂无", image: shoes ? shoes.image : "" }
    ],
    missing,
    palette: colorLabel(top, pants, shoes),
    colorTags,
    reasonLines: selected.length
      ? [weatherReason(weather, top), paletteReason(colorTags), sceneNote]
      : ["衣橱中还没有足够单品，请先录入衣物", "补充上衣、下装、鞋履后可生成完整组合", "录入图片后这里会展示真实单品图"],
    itemIds: selected.map((item) => item.id)
  };
}

module.exports = {
  buildRecommendation,
  colorInfo
};
