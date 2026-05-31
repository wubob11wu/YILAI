function scoreItem(item, weather, profile) {
  let score = 0;
  const prefs = profile.stylePrefs || [];
  const itemStyles = item.styleTags || item.tags || [];

  if ((item.seasons || []).includes(weather.season)) score += 4;
  if (prefs.some((style) => itemStyles.includes(style))) score += 3;
  if (weather.rainChance > 50 && item.category === "鞋履" && /皮|防水|黑/.test(`${item.material}${item.color}`)) score += 2;
  if (weather.temp >= 26 && /棉|麻|聚酯/.test(item.material || "")) score += 1;
  if (weather.temp < 12 && /针织|羊毛|皮/.test(item.material || "")) score += 1;
  score -= item.usageCount || 0;

  return score;
}

function bestOf(items, category, weather, profile) {
  return items
    .filter((item) => item.category === category)
    .sort((a, b) => scoreItem(b, weather, profile) - scoreItem(a, weather, profile))[0];
}

function colorLabel(top, pants, shoes) {
  const colors = [top && top.color, pants && pants.color, shoes && shoes.color].filter(Boolean);
  const dark = colors.some((color) => /黑|深|蓝/.test(color));
  const light = colors.some((color) => /白|浅|米|卡其/.test(color));
  if (dark && light) return "深浅平衡";
  if (colors.length && colors.every((color) => color === colors[0])) return "同色系";
  return "低饱和混搭";
}

function buildRecommendation(items, weather, profile) {
  const top = bestOf(items, "上衣", weather, profile);
  const pants = bestOf(items, "下装", weather, profile);
  const shoes = bestOf(items, "鞋履", weather, profile);
  const missing = [];
  if (!top) missing.push("上衣");
  if (!pants) missing.push("下装");
  if (!shoes) missing.push("鞋履");

  const selected = [top, pants, shoes].filter(Boolean);
  const prefs = profile.stylePrefs || [];
  const matchedStyles = selected
    .flatMap((item) => item.styleTags || item.tags || [])
    .filter((style, index, list) => prefs.includes(style) && list.indexOf(style) === index);

  return {
    top,
    pants,
    shoes,
    missing,
    palette: colorLabel(top, pants, shoes),
    reason: selected.length
      ? `今日${weather.city}${weather.temp}度，${weather.summary}，优先选择${weather.season}季可穿单品。${matchedStyles.length ? `已匹配你的${matchedStyles.join("、")}偏好。` : "当前组合以基础适配为主。"}`
      : "衣橱中还没有足够单品，请先录入衣物。",
    itemIds: selected.map((item) => item.id)
  };
}

module.exports = {
  buildRecommendation
};
