const taxonomy = require("./taxonomy");

const categories = taxonomy.getCategoryNames();
const seasonByCategory = {
  "上衣": ["春", "夏", "秋"],
  "下装": ["春", "秋", "冬"],
  "鞋履": ["春", "秋", "冬"],
  "包袋": ["春", "夏", "秋", "冬"],
  "配饰": ["春", "夏", "秋", "冬"]
};

function pickBySeed(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function recognizeImage(tempFilePath) {
  const seed = String(tempFilePath || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const category = pickBySeed(categories, seed);
  const subcategory = pickBySeed(taxonomy.getSubcategories(category), seed + 5);
  const color = pickBySeed(["白色", "黑色", "灰色", "蓝色", "卡其", "绿色"], seed + 3);
  const material = pickBySeed(["棉", "牛仔", "针织", "皮革", "聚酯纤维"], seed + 7);
  const style = pickBySeed(taxonomy.stylePresets, seed + 11);

  return {
    name: `${color}${subcategory || category}`,
    category,
    subcategory,
    seasons: seasonByCategory[category],
    color,
    material,
    brand: "",
    purchasedAt: "",
    price: "",
    tags: [style],
    styleTags: [style],
    image: tempFilePath
  };
}

module.exports = {
  recognizeImage
};
