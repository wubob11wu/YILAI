const storage = require("../../utils/storage");
const recognizer = require("../../utils/recognizer");
const taxonomy = require("../../utils/taxonomy");

function emptyForm() {
  return {
    id: `item_${Date.now()}`,
    name: "",
    category: "上衣",
    subcategory: "衬衫",
    seasons: ["春", "秋"],
    color: "",
    material: "",
    brand: "",
    purchasedAt: "",
    price: "",
    tags: [],
    styleTags: [],
    image: "",
    usageCount: 0,
    createdAt: Date.now()
  };
}

Page({
  data: {
    isEdit: false,
    form: emptyForm(),
    tagText: "",
    customSubcategory: "",
    customStyleText: "",
    categories: taxonomy.getCategoryNames(),
    seasons: taxonomy.seasons,
    styles: taxonomy.stylePresets,
    categoryOptions: [],
    subcategoryOptions: [],
    seasonOptions: [],
    styleOptions: []
  },

  onLoad(query) {
    this.syncOptions();
    if (!query.id) return;
    const item = storage.getItems().find((current) => current.id === query.id);
    if (item) {
      this.setData({ isEdit: true, form: item, tagText: (item.tags || []).join(",") });
      this.syncOptions();
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const recognized = recognizer.recognizeImage(tempFilePath);
        const form = Object.assign({}, this.data.form, recognized);
        this.setData({ form, tagText: form.tags.join(",") });
        this.syncOptions();
        wx.showToast({ title: "已识别基础信息", icon: "success" });
      }
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onTags(event) {
    const tagText = event.detail.value;
    const tags = tagText.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
    this.setData({ tagText, "form.tags": tags });
  },

  setCategory(event) {
    const category = event.currentTarget.dataset.value;
    const subcategories = taxonomy.getSubcategories(category);
    this.setData({
      "form.category": category,
      "form.subcategory": subcategories[0] || ""
    });
    this.syncOptions();
  },

  setSubcategory(event) {
    this.setData({
      "form.subcategory": event.currentTarget.dataset.value,
      customSubcategory: ""
    });
    this.syncOptions();
  },

  onCustomSubcategory(event) {
    const customSubcategory = event.detail.value;
    this.setData({
      customSubcategory,
      "form.subcategory": customSubcategory.trim()
    });
    this.syncOptions();
  },

  toggleSeason(event) {
    const value = event.currentTarget.dataset.value;
    const seasons = this.data.form.seasons.includes(value)
      ? this.data.form.seasons.filter((season) => season !== value)
      : this.data.form.seasons.concat(value);
    this.setData({ "form.seasons": seasons });
    this.syncOptions();
  },

  toggleStyle(event) {
    const value = event.currentTarget.dataset.value;
    const styleTags = this.data.form.styleTags.includes(value)
      ? this.data.form.styleTags.filter((style) => style !== value)
      : this.data.form.styleTags.concat(value);
    this.setData({ "form.styleTags": styleTags });
    this.syncOptions();
  },

  onCustomStyle(event) {
    this.setData({ customStyleText: event.detail.value });
  },

  addCustomStyle() {
    const style = String(this.data.customStyleText || "").trim();
    if (!style) return;
    const styleTags = (this.data.form.styleTags || []).includes(style)
      ? this.data.form.styleTags
      : this.data.form.styleTags.concat(style);
    const styles = this.data.styles.includes(style) ? this.data.styles : this.data.styles.concat(style);
    this.setData({ styles, "form.styleTags": styleTags, customStyleText: "" });
    this.syncOptions();
  },

  syncOptions() {
    const form = this.data.form;
    const subcategories = taxonomy.getSubcategories(form.category);
    const mergedSubcategories = subcategories.includes(form.subcategory) || !form.subcategory
      ? subcategories
      : subcategories.concat(form.subcategory);
    const mergedStyles = this.data.styles.concat((form.styleTags || []).filter((style) => !this.data.styles.includes(style)));
    this.setData({
      categoryOptions: this.data.categories.map((name) => ({ name, active: form.category === name })),
      subcategoryOptions: mergedSubcategories.map((name) => ({ name, active: form.subcategory === name })),
      seasonOptions: this.data.seasons.map((name) => ({ name, active: (form.seasons || []).includes(name) })),
      styles: mergedStyles,
      styleOptions: mergedStyles.map((name) => ({ name, active: (form.styleTags || []).includes(name) }))
    });
  },

  save() {
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: "请填写名称", icon: "none" });
      return;
    }
    if (!form.seasons.length) {
      wx.showToast({ title: "至少选择一个季节", icon: "none" });
      return;
    }
    if (!form.subcategory.trim()) {
      wx.showToast({ title: "请填写细分品类", icon: "none" });
      return;
    }
    storage.saveItem(form);
    wx.navigateBack();
  },

  remove() {
    wx.showModal({
      title: "删除衣物",
      content: "删除后将不再参与推荐和统计。",
      success: (res) => {
        if (!res.confirm) return;
        storage.removeItem(this.data.form.id);
        wx.navigateBack();
      }
    });
  }
});
