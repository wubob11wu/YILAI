const storage = require("../../utils/storage");
const taxonomy = require("../../utils/taxonomy");
const limits = require("../../config/limits");

function emptyForm() {
  return {
    id: `item_${Date.now()}`,
    name: "",
    category: "上装",
    subcategory: "T恤",
    seasons: ["夏"],
    color: "白",
    material: "",
    brand: "",
    purchasedAt: "",
    price: "",
    tags: [],
    mainStyle: "简约基础",
    styleAttributes: ["基础款"],
    styleTags: ["基础款"],
    note: "",
    image: "",
    usageCount: 0,
    createdAt: Date.now()
  };
}

Page({
  data: {
    isEdit: false,
    moreOpen: false,
    autoColorText: "白色",
    autoSeasonText: "夏",
    form: emptyForm(),
    categories: taxonomy.getCategoryNames(),
    categoryOptions: [],
    subcategoryOptions: [],
    colorOptions: [],
    seasonOptions: [],
    mainStyleOptions: [],
    attributeOptions: []
  },

  onLoad(query) {
    if (query.id) {
      const item = storage.getItems().find((current) => current.id === query.id);
      if (item) {
        this.setData({
          isEdit: true,
          form: item,
          autoColorText: taxonomy.getColorDisplayName(item.color),
          autoSeasonText: (item.seasons || []).join("、")
        });
      }
    }
    this.syncOptions();
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const form = Object.assign({}, this.data.form, { image: tempFilePath });
        this.setData({
          form,
          autoColorText: taxonomy.getColorDisplayName(form.color),
          autoSeasonText: form.seasons.join("、")
        }, this.syncOptions);
        wx.showToast({ title: "已添加图片，请完善信息", icon: "none" });
      }
    });
  },

  setCategory(event) {
    const category = event.currentTarget.dataset.value;
    const subcategory = taxonomy.getSubcategories(category)[0] || "";
    const color = this.data.form.color;
    const seasons = taxonomy.inferSeasons(subcategory);
    const mainStyle = taxonomy.inferMainStyle(category, subcategory, color);
    const styleAttributes = taxonomy.inferStyleAttributes(subcategory, color);
    this.setData({
      "form.category": category,
      "form.subcategory": subcategory,
      "form.seasons": seasons,
      "form.mainStyle": mainStyle,
      "form.styleAttributes": styleAttributes,
      "form.styleTags": styleAttributes,
      "form.name": this.buildName(color, mainStyle, subcategory),
      autoSeasonText: seasons.join("、")
    }, this.syncOptions);
  },

  setSubcategory(event) {
    const subcategory = event.currentTarget.dataset.value;
    this.applyInference({ subcategory });
  },

  setColor(event) {
    const color = event.currentTarget.dataset.value;
    this.applyInference({ color });
  },

  applyInference(patch) {
    const form = Object.assign({}, this.data.form, patch);
    const seasons = taxonomy.inferSeasons(form.subcategory);
    const mainStyle = taxonomy.inferMainStyle(form.category, form.subcategory, form.color);
    const styleAttributes = taxonomy.inferStyleAttributes(form.subcategory, form.color);
    form.seasons = seasons;
    form.mainStyle = mainStyle;
    form.styleAttributes = styleAttributes;
    form.styleTags = styleAttributes;
    form.name = this.buildName(form.color, mainStyle, form.subcategory);
    this.setData({
      form,
      autoColorText: taxonomy.getColorDisplayName(form.color),
      autoSeasonText: seasons.join("、")
    }, this.syncOptions);
  },

  buildName(color, mainStyle, subcategory) {
    return `${taxonomy.getColorDisplayName(color)}${mainStyle}${subcategory}`;
  },

  onNameInput(event) {
    this.setData({ "form.name": event.detail.value });
  },

  toggleSeason(event) {
    const value = event.currentTarget.dataset.value;
    const seasons = this.data.form.seasons.includes(value)
      ? this.data.form.seasons.filter((season) => season !== value)
      : this.data.form.seasons.concat(value);
    this.setData({
      "form.seasons": seasons,
      autoSeasonText: seasons.join("、") || "未选择"
    }, this.syncOptions);
  },

  toggleMore() {
    this.setData({ moreOpen: !this.data.moreOpen });
  },

  setMainStyle(event) {
    this.setData({ "form.mainStyle": event.currentTarget.dataset.value }, this.syncOptions);
  },

  toggleAttribute(event) {
    const value = event.currentTarget.dataset.value;
    let styleAttributes = this.data.form.styleAttributes || [];
    if (styleAttributes.includes(value)) {
      styleAttributes = styleAttributes.filter((item) => item !== value);
    } else {
      if (styleAttributes.length >= 3) {
        wx.showToast({ title: "最多选择 3 个", icon: "none" });
        return;
      }
      styleAttributes = styleAttributes.concat(value);
    }
    this.setData({
      "form.styleAttributes": styleAttributes,
      "form.styleTags": styleAttributes
    }, this.syncOptions);
  },

  onNoteInput(event) {
    this.setData({ "form.note": event.detail.value.slice(0, 50) });
  },

  syncOptions() {
    const form = this.data.form;
    this.setData({
      categoryOptions: this.data.categories.map((name) => ({ name, active: form.category === name })),
      subcategoryOptions: taxonomy.getSubcategories(form.category).map((name) => ({ name, active: form.subcategory === name })),
      colorOptions: taxonomy.colors.map((name) => ({ name, active: taxonomy.normalizeColorName(form.color) === name, display: taxonomy.getColorDisplayName(name) })),
      seasonOptions: taxonomy.seasons.map((name) => ({ name, active: (form.seasons || []).includes(name) })),
      mainStyleOptions: taxonomy.mainStyles.map((name) => ({ name, active: form.mainStyle === name })),
      attributeOptions: taxonomy.styleAttributes.map((name) => ({ name, active: (form.styleAttributes || []).includes(name) }))
    });
  },

  validate() {
    const form = this.data.form;
    if (!form.image) return "请先上传单品图片";
    if (!form.category || !form.subcategory) return "请选择完整的衣物品类";
    if (!form.color) return "请选择衣物颜色";
    if (!String(form.name || "").trim()) return "请填写衣物名称";
    if (!form.seasons || !form.seasons.length) return "请选择适用季节";
    return "";
  },

  save() {
    const error = this.validate();
    if (error) {
      wx.showToast({ title: error, icon: "none" });
      return;
    }
    const items = storage.getItems();
    const isNew = !items.some((item) => item.id === this.data.form.id);
    const planLimits = limits.getPlanLimits();
    if (isNew && items.length >= planLimits.maxItems) {
      wx.showModal({
        title: "衣橱已达免费上限",
        content: `当前免费版最多可录入 ${planLimits.maxItems} 件衣物。后续会员版将支持更多衣物。`,
        showCancel: false
      });
      return;
    }
    storage.saveItem(this.data.form);
    wx.navigateBack();
  },

  remove() {
    wx.showModal({
      title: "删除衣物",
      content: "确认删除这件衣物？",
      success: (res) => {
        if (!res.confirm) return;
        storage.removeItem(this.data.form.id);
        wx.navigateBack();
      }
    });
  }
});
