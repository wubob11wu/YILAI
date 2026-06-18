const categories = [
  {
    name: "上装",
    icon: "🧥",
    legacy: ["上衣"],
    subcategories: ["T恤", "衬衫", "卫衣", "毛衣", "外套", "西装", "吊带", "夹克", "POLO衫", "针织衫", "小香风"]
  },
  {
    name: "下装",
    icon: "👖",
    legacy: ["裤子"],
    subcategories: ["牛仔裤", "休闲裤", "西裤", "运动裤", "短裤", "半身裙", "阔腿裤", "leggings"]
  },
  {
    name: "鞋子",
    icon: "👟",
    legacy: ["鞋履"],
    subcategories: ["运动鞋", "休闲鞋", "皮鞋", "靴子", "凉鞋", "工装鞋", "高跟鞋", "单鞋"]
  },
  {
    name: "包饰",
    icon: "👜",
    legacy: ["包袋"],
    subcategories: ["双肩包", "单肩包", "手提包", "斜挎包", "帆布包"]
  },
  {
    name: "配饰",
    icon: "💍",
    legacy: [],
    subcategories: ["帽子", "围巾", "腰带", "手表", "首饰"]
  }
];

const seasons = ["春", "夏", "秋", "冬"];
const colors = ["白", "黑", "灰", "蓝", "卡其", "棕", "绿", "红", "粉", "黄", "紫", "其他"];
const mainStyles = ["简约基础", "通勤正式", "休闲日常", "韩系温柔", "甜辣优雅", "日系清新", "日系复古", "美式街头", "商务休闲"];
const styleAttributes = ["基础款", "极简风", "老钱风", "运动风", "复古风", "工装风", "小香风", "纯色系", "印花款", "温柔风", "甜酷风", "硬汉风", "商务风"];

const stylePresets = mainStyles.concat(styleAttributes);

function normalizeCategoryName(name) {
  const category = categories.find((item) => item.name === name || item.legacy.includes(name));
  return category ? category.name : name || "上装";
}

function normalizeColorName(color) {
  const value = color || "";
  if (/白|米|奶|象牙/.test(value)) return "白";
  if (/黑|墨/.test(value)) return "黑";
  if (/灰|银/.test(value)) return "灰";
  if (/蓝|牛仔/.test(value)) return "蓝";
  if (/卡其|驼/.test(value)) return "卡其";
  if (/棕|咖|褐/.test(value)) return "棕";
  if (/绿/.test(value)) return "绿";
  if (/红/.test(value)) return "红";
  if (/粉/.test(value)) return "粉";
  if (/黄/.test(value)) return "黄";
  if (/紫/.test(value)) return "紫";
  return value || "其他";
}

function getColorDisplayName(color) {
  const normalized = normalizeColorName(color);
  return normalized === "其他" ? "其他" : `${normalized}色`;
}

function getCategoryNames() {
  return categories.map((category) => category.name);
}

function getSubcategories(categoryName) {
  const normalized = normalizeCategoryName(categoryName);
  const category = categories.find((item) => item.name === normalized);
  return category ? category.subcategories : [];
}

function inferSeasons(subcategory) {
  if (/短袖|T恤|短裤|凉鞋|吊带/.test(subcategory)) return ["夏"];
  if (/羽绒|毛衣|厚|大衣|围巾|靴/.test(subcategory)) return ["冬"];
  if (/长袖|卫衣|牛仔裤|休闲裤|西裤|针织|外套|夹克|POLO/.test(subcategory)) return ["春", "秋"];
  if (/白T|基础|手表|首饰|包/.test(subcategory)) return ["春", "夏", "秋", "冬"];
  return ["春", "夏", "秋", "冬"];
}

function inferMainStyle(category, subcategory, color) {
  const normalizedColor = normalizeColorName(color);
  if (/西装|衬衫|西裤|皮鞋/.test(subcategory)) return "通勤正式";
  if (/高跟鞋|小香风|吊带|半身裙/.test(subcategory)) return "甜辣优雅";
  if (/运动|卫衣|短裤|休闲鞋/.test(subcategory)) return "休闲日常";
  if (/夹克|工装|牛仔/.test(subcategory)) return "美式街头";
  if (/针织|毛衣/.test(subcategory)) return "韩系温柔";
  if (/卡其|棕/.test(normalizedColor)) return "日系复古";
  if (category === "包饰" || category === "配饰") return "简约基础";
  return "简约基础";
}

function inferStyleAttributes(subcategory, color) {
  const attrs = [];
  const normalizedColor = normalizeColorName(color);
  if (/白|黑|灰|卡其|棕/.test(normalizedColor)) attrs.push("纯色系");
  if (/T恤|衬衫|牛仔裤|休闲裤|运动鞋/.test(subcategory)) attrs.push("基础款");
  if (/西装|西裤|皮鞋/.test(subcategory)) attrs.push("商务风");
  if (/运动|卫衣|运动鞋|运动裤/.test(subcategory)) attrs.push("运动风");
  if (/夹克|工装/.test(subcategory)) attrs.push("工装风");
  if (/小香风/.test(subcategory)) attrs.push("小香风");
  return attrs.slice(0, 3);
}

function getDefaultVisibleSeasons(date) {
  const month = (date || new Date()).getMonth() + 1;
  if (month >= 6 && month <= 8) return ["夏", "春", "秋"];
  if (month === 12 || month <= 2) return ["冬", "春", "秋"];
  return seasons.slice();
}

function getStyles(profile) {
  const custom = (profile && profile.stylePrefs) || [];
  return stylePresets.concat(custom.filter((style) => !stylePresets.includes(style)));
}

module.exports = {
  categories,
  seasons,
  colors,
  mainStyles,
  styleAttributes,
  stylePresets,
  getCategoryNames,
  getSubcategories,
  getStyles,
  normalizeCategoryName,
  normalizeColorName,
  getColorDisplayName,
  inferSeasons,
  inferMainStyle,
  inferStyleAttributes,
  getDefaultVisibleSeasons
};
