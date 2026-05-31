const categories = [
  {
    name: "上衣",
    subcategories: ["T恤", "衬衫", "针织衫", "卫衣", "西装", "夹克", "大衣", "羽绒服"]
  },
  {
    name: "下装",
    subcategories: ["牛仔裤", "西裤", "休闲裤", "半裙", "短裤", "运动裤"]
  },
  {
    name: "鞋履",
    subcategories: ["运动鞋", "乐福鞋", "皮鞋", "靴子", "凉鞋", "高跟鞋"]
  },
  {
    name: "包袋",
    subcategories: ["托特包", "斜挎包", "双肩包", "手拿包"]
  },
  {
    name: "配饰",
    subcategories: ["手表", "项链", "戒指", "耳饰", "帽子", "围巾", "腰带", "墨镜"]
  }
];

const seasons = ["春", "夏", "秋", "冬"];

const stylePresets = [
  "通勤",
  "极简",
  "老钱风",
  "Clean Fit",
  "Quiet Luxury",
  "法式",
  "学院风",
  "街头",
  "户外机能",
  "运动休闲",
  "复古",
  "甜酷",
  "新中式",
  "日系",
  "韩系",
  "美式",
  "基础款"
];

function getCategoryNames() {
  return categories.map((category) => category.name);
}

function getSubcategories(categoryName) {
  const category = categories.find((item) => item.name === categoryName);
  return category ? category.subcategories : [];
}

function getStyles(profile) {
  const custom = (profile && profile.stylePrefs) || [];
  return stylePresets.concat(custom.filter((style) => !stylePresets.includes(style)));
}

module.exports = {
  categories,
  seasons,
  stylePresets,
  getCategoryNames,
  getSubcategories,
  getStyles
};
