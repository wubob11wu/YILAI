const storage = require("../../utils/storage");
const taxonomy = require("../../utils/taxonomy");

Page({
  data: {
    items: [],
    filteredItems: [],
    keyword: "",
    categories: taxonomy.getCategoryNames(),
    seasons: taxonomy.seasons,
    categoryFilter: "全部",
    seasonFilter: "全部"
  },

  onShow() {
    const items = storage.getItems();
    this.setData({ items }, this.applyFilters);
  },

  addItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  editItem(event) {
    wx.navigateTo({ url: `/pages/item-edit/item-edit?id=${event.currentTarget.dataset.id}` });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value }, this.applyFilters);
  },

  setCategory(event) {
    this.setData({ categoryFilter: event.currentTarget.dataset.value }, this.applyFilters);
  },

  setSeason(event) {
    this.setData({ seasonFilter: event.currentTarget.dataset.value }, this.applyFilters);
  },

  applyFilters() {
    const { items, keyword, categoryFilter, seasonFilter } = this.data;
    const text = String(keyword || "").trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const haystack = [item.name, item.category, item.subcategory, item.color, item.material, item.brand, ...(item.tags || [])].join(" ").toLowerCase();
      const matchKeyword = !text || haystack.includes(text);
      const matchCategory = categoryFilter === "全部" || item.category === categoryFilter;
      const matchSeason = seasonFilter === "全部" || (item.seasons || []).includes(seasonFilter);
      return matchKeyword && matchCategory && matchSeason;
    });
    this.setData({ filteredItems });
  }
});
