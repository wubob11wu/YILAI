const storage = require("../../utils/storage");
const taxonomy = require("../../utils/taxonomy");

Page({
  data: {
    items: [],
    filteredItems: [],
    keyword: "",
    categories: ["全部"].concat(taxonomy.getCategoryNames()),
    categoryFilter: "全部",
    filterOpen: false,
    defaultSeasonText: "",
    subcategoryOptions: [],
    seasonOptions: [],
    colorOptions: [],
    styleOptions: [],
    selectedSubcategories: [],
    selectedSeasons: [],
    selectedColors: [],
    selectedStyles: []
  },

  onShow() {
    const selectedSeasons = taxonomy.getDefaultVisibleSeasons();
    this.setData({
      items: storage.getItems(),
      selectedSeasons,
      defaultSeasonText: selectedSeasons.join(" / ")
    }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  addItem() {
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  editItem(event) {
    wx.navigateTo({ url: `/pages/item-edit/item-edit?id=${event.currentTarget.dataset.id}` });
  },

  confirmDelete(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除这件衣物？",
      content: "删除后将不再参与衣橱筛选和穿搭推荐。",
      success: (res) => {
        if (!res.confirm) return;
        storage.removeItem(id);
        this.setData({ items: storage.getItems() }, this.applyFilters);
      }
    });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value }, this.applyFilters);
  },

  setCategory(event) {
    this.setData({
      categoryFilter: event.currentTarget.dataset.value,
      selectedSubcategories: []
    }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  toggleFilter() {
    this.setData({ filterOpen: !this.data.filterOpen });
  },

  toggleMulti(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.currentTarget.dataset.value;
    const selected = this.data[field].includes(value)
      ? this.data[field].filter((item) => item !== value)
      : this.data[field].concat(value);
    this.setData({ [field]: selected }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  clearAdvancedFilters() {
    const selectedSeasons = taxonomy.getDefaultVisibleSeasons();
    this.setData({
      selectedSubcategories: [],
      selectedSeasons,
      selectedColors: [],
      selectedStyles: []
    }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  showAllSeasons() {
    this.setData({ selectedSeasons: taxonomy.seasons.slice() }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  syncFilterOptions() {
    const category = this.data.categoryFilter;
    const subcategories = category === "全部"
      ? taxonomy.categories.flatMap((item) => item.subcategories)
      : taxonomy.getSubcategories(category);

    this.setData({
      subcategoryOptions: subcategories.map((name) => ({ name, active: this.data.selectedSubcategories.includes(name) })),
      seasonOptions: taxonomy.seasons.map((name) => ({ name, active: this.data.selectedSeasons.includes(name) })),
      colorOptions: taxonomy.colors.map((name) => ({ name, active: this.data.selectedColors.includes(name) })),
      styleOptions: taxonomy.mainStyles.slice(0, 6).map((name) => ({ name, active: this.data.selectedStyles.includes(name) }))
    });
  },

  applyFilters() {
    const {
      items,
      keyword,
      categoryFilter,
      selectedSubcategories,
      selectedSeasons,
      selectedColors,
      selectedStyles
    } = this.data;
    const text = String(keyword || "").trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const matchKeyword = !text || String(item.name || "").toLowerCase().includes(text);
      const matchCategory = categoryFilter === "全部" || item.category === categoryFilter;
      const matchSubcategory = !selectedSubcategories.length || selectedSubcategories.includes(item.subcategory);
      const matchSeason = !selectedSeasons.length || (item.seasons || []).some((season) => selectedSeasons.includes(season));
      const matchColor = !selectedColors.length || selectedColors.includes(taxonomy.normalizeColorName(item.color));
      const matchStyle = !selectedStyles.length || selectedStyles.includes(item.mainStyle);
      return matchKeyword && matchCategory && matchSubcategory && matchSeason && matchColor && matchStyle;
    });
    this.setData({ filteredItems });
  }
});
