const storage = require("../../utils/storage");
const taxonomy = require("../../utils/taxonomy");
const limits = require("../../config/limits");

const categoryVisuals = {
  "全部": {
    title: "全部衣物",
    image: "/assets/closet-hero/all.jpg",
    desc: "按真实衣橱的方式浏览你的日常单品"
  },
  "上装": {
    title: "上装",
    image: "/assets/closet-hero/tops.jpg",
    desc: "T恤、衬衫、外套与针织"
  },
  "下装": {
    title: "下装",
    image: "/assets/closet-hero/bottoms.jpg",
    desc: "裤装与裙装，让搭配轮廓更清晰"
  },
  "鞋子": {
    title: "鞋子",
    image: "/assets/closet-hero/shoes.jpg",
    desc: "从通勤到休闲的每日落点"
  },
  "包饰": {
    title: "包饰",
    image: "/assets/closet-hero/bags.jpg",
    desc: "包袋是搭配的风格收口"
  },
  "配饰": {
    title: "配饰",
    image: "/assets/closet-hero/accessories.jpg",
    desc: "小面积单品决定精致度"
  }
};

Page({
  data: {
    items: [],
    filteredItems: [],
    keyword: "",
    categories: [],
    categoryFilter: "全部",
    currentCategoryTitle: "全部衣物",
    currentCategoryCount: 0,
    currentHero: categoryVisuals["全部"],
    filterOpen: false,
    searchOpen: false,
    defaultSeasonText: "",
    subcategoryOptions: [],
    visibleSubcategoryOptions: [],
    hiddenSubcategoryOptions: [],
    hasHiddenSubcategories: false,
    subcategoryMenuOpen: false,
    hiddenSubcategoryActive: false,
    subcategoryMenuHeight: 0,
    seasonOptions: [],
    colorOptions: [],
    styleOptions: [],
    selectedSubcategories: [],
    selectedSeasons: [],
    selectedColors: [],
    selectedStyles: [],
    itemLimitText: ""
  },

  onShow() {
    const selectedSeasons = taxonomy.getDefaultVisibleSeasons();
    const items = storage.getItems();
    this.setData({
      items,
      selectedSeasons,
      defaultSeasonText: selectedSeasons.join(" / "),
      itemLimitText: this.buildLimitText(items.length)
    }, () => {
      this.syncCategories();
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  addItem() {
    wx.showActionSheet({
      itemList: ["添加单件", "批量导入"],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.goAddSingle();
          return;
        }
        wx.navigateTo({ url: "/pages/batch-import/batch-import" });
      }
    });
  },

  goAddSingle() {
    const planLimits = limits.getPlanLimits();
    if (storage.getItems().length >= planLimits.maxItems) {
      wx.showModal({
        title: "衣橱已达免费上限",
        content: `当前免费版最多可录入 ${planLimits.maxItems} 件衣物。可以先删除不常穿的衣物，后续会员版将支持更多衣物。`,
        showCancel: false
      });
      return;
    }
    wx.navigateTo({ url: "/pages/item-edit/item-edit" });
  },

  buildLimitText(count) {
    const planLimits = limits.getPlanLimits();
    return `免费版 ${count}/${planLimits.maxItems} 件`;
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
        const items = storage.getItems();
        this.setData({
          items,
          itemLimitText: this.buildLimitText(items.length)
        }, () => {
          this.syncCategories();
          this.applyFilters();
        });
      }
    });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value }, this.applyFilters);
  },

  toggleSearch() {
    this.setData({ searchOpen: !this.data.searchOpen });
  },

  clearKeyword() {
    this.setData({ keyword: "", searchOpen: false }, this.applyFilters);
  },

  setCategory(event) {
    this.setData({
      categoryFilter: event.currentTarget.dataset.value,
      selectedSubcategories: [],
      subcategoryMenuOpen: false
    }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  setSubcategory(event) {
    const value = event.currentTarget.dataset.value;
    const selectedSubcategories = this.data.selectedSubcategories.includes(value) ? [] : [value];
    this.setData({
      selectedSubcategories,
      subcategoryMenuOpen: false
    }, () => {
      this.syncFilterOptions();
      this.applyFilters();
    });
  },

  toggleSubcategoryMenu() {
    this.setData({ subcategoryMenuOpen: !this.data.subcategoryMenuOpen });
  },

  closeSubcategoryMenu() {
    if (!this.data.subcategoryMenuOpen) return;
    this.setData({ subcategoryMenuOpen: false });
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

  syncCategories() {
    const items = this.data.items;
    const categoryNames = ["全部"].concat(taxonomy.getCategoryNames());
    const categories = categoryNames.map((name) => {
      const count = name === "全部" ? items.length : items.filter((item) => item.category === name).length;
      const visual = categoryVisuals[name] || categoryVisuals["全部"];
      return {
        name,
        count,
        image: visual.image,
        active: name === this.data.categoryFilter
      };
    });
    this.setData({ categories });
  },

  syncFilterOptions() {
    const category = this.data.categoryFilter;
    const baseSubcategories = category === "全部"
      ? taxonomy.categories.flatMap((item) => item.subcategories)
      : taxonomy.getSubcategories(category);
    const subcategoryOptions = baseSubcategories.map((name) => ({
      name,
      active: this.data.selectedSubcategories.includes(name)
    }));
    const visibleCount = subcategoryOptions.length > 4 ? 3 : 4;
    const visibleSubcategoryOptions = subcategoryOptions.slice(0, visibleCount);
    const hiddenSubcategoryOptions = subcategoryOptions.slice(visibleCount);
    const subcategoryMenuHeight = Math.min(hiddenSubcategoryOptions.length * 62 + 18, 382);

    this.setData({
      subcategoryOptions,
      visibleSubcategoryOptions,
      hiddenSubcategoryOptions,
      hasHiddenSubcategories: hiddenSubcategoryOptions.length > 0,
      hiddenSubcategoryActive: hiddenSubcategoryOptions.some((item) => item.active),
      subcategoryMenuHeight,
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
    const currentCategoryCount = items.filter((item) => (
      categoryFilter === "全部" || item.category === categoryFilter
    )).length;
    this.setData({
      filteredItems,
      currentCategoryTitle: categoryFilter === "全部" ? "全部衣物" : categoryFilter,
      currentCategoryCount,
      currentHero: categoryVisuals[categoryFilter] || categoryVisuals["全部"]
    }, () => this.syncCategories());
  }
});
