function getSeasonByTemp(temp) {
  if (temp >= 26) return "夏";
  if (temp >= 16) return "春";
  if (temp >= 8) return "秋";
  return "冬";
}

function getMockWeather(city) {
  const seed = String(city || "上海").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const temp = 12 + (seed % 20);
  const rainChance = seed % 3 === 0 ? 68 : seed % 3 === 1 ? 28 : 10;
  const wind = 1 + (seed % 5);
  return {
    city: city || "上海",
    temp,
    rainChance,
    wind,
    season: getSeasonByTemp(temp),
    summary: rainChance > 50 ? "有降水可能" : temp > 28 ? "偏热" : temp < 12 ? "偏冷" : "舒适"
  };
}

module.exports = {
  getMockWeather
};
