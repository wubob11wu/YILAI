const taxonomy = require("./taxonomy");

const categories = taxonomy.getCategoryNames();
const seasonByCategory = {
  "上装": ["春", "夏", "秋"],
  "下装": ["春", "秋", "冬"],
  "鞋子": ["春", "秋", "冬"],
  "包饰": ["春", "夏", "秋", "冬"],
  "配饰": ["春", "夏", "秋", "冬"]
};

function pickBySeed(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function recognizeImage(tempFilePath) {
  const seed = String(tempFilePath || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const category = pickBySeed(categories, seed);
  const subcategory = pickBySeed(taxonomy.getSubcategories(category), seed + 5);
  const color = pickBySeed(["白", "黑", "灰", "蓝", "卡其", "棕"], seed + 3);
  const material = pickBySeed(["棉", "牛仔", "针织", "皮革", "聚酯纤维"], seed + 7);
  const mainStyle = taxonomy.inferMainStyle(category, subcategory, color);
  const styleAttributes = taxonomy.inferStyleAttributes(subcategory, color);
  const seasons = taxonomy.inferSeasons(subcategory);

  return {
    name: `${taxonomy.getColorDisplayName(color)}${mainStyle}${subcategory || category}`,
    category,
    subcategory,
    seasons: seasons.length ? seasons : seasonByCategory[category],
    color,
    material,
    brand: "",
    purchasedAt: "",
    price: "",
    tags: [],
    mainStyle,
    styleAttributes,
    styleTags: styleAttributes,
    note: "",
    image: tempFilePath
  };
}

module.exports = {
  recognizeImage
};
