const KEYS = {
  items: "yilai_items",
  outfits: "yilai_outfits",
  profile: "yilai_profile",
  privacy: "yilai_privacy"
};

function normalizeCategory(item) {
  const categoryMap = {
    "裤子": "下装",
    "鞋子": "鞋履"
  };
  const category = categoryMap[item.category] || item.category || "上衣";
  const fallbackSubcategory = {
    "上衣": "衬衫",
    "下装": "牛仔裤",
    "鞋履": "乐福鞋",
    "配饰": "手表"
  };
  return Object.assign({}, item, {
    category,
    subcategory: item.subcategory || fallbackSubcategory[category] || "自定义"
  });
}

const sampleItems = [
  {
    id: "sample_top_1",
    name: "白色棉质衬衫",
    category: "上衣",
    subcategory: "衬衫",
    seasons: ["春", "夏", "秋"],
    color: "白色",
    material: "棉",
    brand: "基础款",
    purchasedAt: "2026-03",
    price: "199",
    tags: ["通勤", "基础款"],
    styleTags: ["极简", "韩系"],
    image: "",
    usageCount: 0,
    createdAt: Date.now() - 40000
  },
  {
    id: "sample_pants_1",
    name: "深蓝直筒牛仔裤",
    category: "下装",
    subcategory: "牛仔裤",
    seasons: ["春", "秋", "冬"],
    color: "深蓝",
    material: "牛仔",
    brand: "Daily",
    purchasedAt: "2026-01",
    price: "299",
    tags: ["约会", "通勤"],
    styleTags: ["美式", "Clean Fit"],
    image: "",
    usageCount: 0,
    createdAt: Date.now() - 30000
  },
  {
    id: "sample_shoes_1",
    name: "黑色乐福鞋",
    category: "鞋履",
    subcategory: "乐福鞋",
    seasons: ["春", "秋", "冬"],
    color: "黑色",
    material: "皮革",
    brand: "Walk",
    purchasedAt: "2025-10",
    price: "369",
    tags: ["通勤"],
    styleTags: ["通勤", "日系"],
    image: "",
    usageCount: 0,
    createdAt: Date.now() - 20000
  }
];

const defaultProfile = {
  nickname: "微信用户",
  loggedIn: false,
  city: "上海",
  stylePrefs: ["极简", "通勤"],
  customStyle: ""
};

const defaultPrivacy = {
  hideBodyData: true,
  hideOutfitRecords: false,
  locationEnabled: true
};

function get(key, fallback) {
  const value = wx.getStorageSync(key);
  return value || fallback;
}

function set(key, value) {
  wx.setStorageSync(key, value);
}

function bootstrap() {
  if (!wx.getStorageSync(KEYS.items)) set(KEYS.items, sampleItems);
  if (!wx.getStorageSync(KEYS.outfits)) set(KEYS.outfits, []);
  if (!wx.getStorageSync(KEYS.profile)) set(KEYS.profile, defaultProfile);
  if (!wx.getStorageSync(KEYS.privacy)) set(KEYS.privacy, defaultPrivacy);
}

function getItems() {
  return get(KEYS.items, []).map(normalizeCategory);
}

function saveItems(items) {
  set(KEYS.items, items);
}

function saveItem(item) {
  const items = getItems();
  const index = items.findIndex((current) => current.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }
  saveItems(items);
}

function removeItem(id) {
  saveItems(getItems().filter((item) => item.id !== id));
}

function getOutfits() {
  return get(KEYS.outfits, []);
}

function saveOutfits(outfits) {
  set(KEYS.outfits, outfits);
}

function addOutfit(outfit) {
  const outfits = getOutfits();
  outfits.unshift(outfit);
  saveOutfits(outfits);

  const usedIds = outfit.itemIds || [];
  const items = getItems().map((item) => {
    if (!usedIds.includes(item.id)) return item;
    return Object.assign({}, item, { usageCount: (item.usageCount || 0) + 1 });
  });
  saveItems(items);
}

function getProfile() {
  return get(KEYS.profile, defaultProfile);
}

function saveProfile(profile) {
  set(KEYS.profile, profile);
}

function getPrivacy() {
  return get(KEYS.privacy, defaultPrivacy);
}

function savePrivacy(privacy) {
  set(KEYS.privacy, privacy);
}

module.exports = {
  bootstrap,
  getItems,
  saveItem,
  removeItem,
  getOutfits,
  addOutfit,
  getProfile,
  saveProfile,
  getPrivacy,
  savePrivacy
};
