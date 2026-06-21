const storage = require("../../utils/storage");
const taxonomy = require("../../utils/taxonomy");
const limits = require("../../config/limits");

function createDraft(image, index) {
  const category = "上装";
  const subcategory = "T恤";
  const color = "白";
  const seasons = taxonomy.inferSeasons(subcategory);
  const mainStyle = taxonomy.inferMainStyle(category, subcategory, color);
  const styleAttributes = taxonomy.inferStyleAttributes(subcategory, color);
  return {
    id: `batch_${Date.now()}_${index}`,
    image,
    name: "",
    category,
    subcategory,
    seasons,
    color,
    material: "",
    brand: "",
    purchasedAt: "",
    price: "",
    tags: [],
    mainStyle,
    styleAttributes,
    styleTags: styleAttributes,
    note: "",
    usageCount: 0,
    createdAt: Date.now() + index,
    completed: false
  };
}

function buildName(color, mainStyle, subcategory) {
  return `${taxonomy.getColorDisplayName(color)}${mainStyle}${subcategory}`;
}

Page({
  data: {
    drafts: [],
    currentIndex: 0,
    currentDraft: null,
    progressText: "还没有选择图片",
    limitText: "",
    categoryOptions: [],
    subcategoryOptions: [],
    colorOptions: [],
    seasonOptions: []
  },

  onLoad() {
    this.syncLimitText();
  },

  syncLimitText() {
    const itemCount = storage.getItems().length;
    const planLimits = limits.getPlanLimits();
    const remaining = limits.getRemainingItemSlots(itemCount);
    this.setData({
      limitText: `免费版还可保存 ${remaining}/${planLimits.maxItems} 件，每次最多导入 ${planLimits.maxBatchImport} 张`
    });
  },

  chooseImages() {
    const itemCount = storage.getItems().length;
    const remaining = limits.getRemainingItemSlots(itemCount);
    if (!remaining) {
      wx.showModal({
        title: "衣橱已达免费上限",
        content: `当前免费版最多可录入 ${limits.getPlanLimits().maxItems} 件衣物。`,
        showCancel: false
      });
      return;
    }
    const count = Math.min(limits.getPlanLimits().maxBatchImport, remaining);
    wx.chooseMedia({
      count,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const drafts = res.tempFiles.map((file, index) => createDraft(file.tempFilePath, index));
        this.setData({
          drafts,
          currentIndex: 0,
          currentDraft: drafts[0] || null
        }, () => {
          this.syncOptions();
          this.syncProgress();
        });
      }
    });
  },

  syncProgress() {
    const completed = this.data.drafts.filter((draft) => draft.completed).length;
    const total = this.data.drafts.length;
    this.setData({
      progressText: total ? `已完成 ${completed} / 共 ${total} 件` : "还没有选择图片"
    });
  },

  selectDraft(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      currentIndex: index,
      currentDraft: this.data.drafts[index]
    }, this.syncOptions);
  },

  patchCurrent(patch, shouldBuildName) {
    const currentDraft = Object.assign({}, this.data.currentDraft, patch);
    if (shouldBuildName) {
      const seasons = taxonomy.inferSeasons(currentDraft.subcategory);
      const mainStyle = taxonomy.inferMainStyle(currentDraft.category, currentDraft.subcategory, currentDraft.color);
      const styleAttributes = taxonomy.inferStyleAttributes(currentDraft.subcategory, currentDraft.color);
      currentDraft.seasons = seasons;
      currentDraft.mainStyle = mainStyle;
      currentDraft.styleAttributes = styleAttributes;
      currentDraft.styleTags = styleAttributes;
      currentDraft.name = buildName(currentDraft.color, currentDraft.mainStyle, currentDraft.subcategory);
    }

    const drafts = this.data.drafts.slice();
    drafts[this.data.currentIndex] = currentDraft;
    this.setData({ drafts, currentDraft }, () => {
      this.syncOptions();
      this.syncProgress();
    });
  },

  setCategory(event) {
    const category = event.currentTarget.dataset.value;
    const subcategory = taxonomy.getSubcategories(category)[0] || "";
    this.patchCurrent({ category, subcategory }, true);
  },

  setSubcategory(event) {
    this.patchCurrent({ subcategory: event.currentTarget.dataset.value }, true);
  },

  setColor(event) {
    this.patchCurrent({ color: event.currentTarget.dataset.value }, true);
  },

  toggleSeason(event) {
    const value = event.currentTarget.dataset.value;
    const seasons = this.data.currentDraft.seasons.includes(value)
      ? this.data.currentDraft.seasons.filter((season) => season !== value)
      : this.data.currentDraft.seasons.concat(value);
    this.patchCurrent({ seasons }, false);
  },

  onNameInput(event) {
    this.patchCurrent({ name: event.detail.value }, false);
  },

  validateDraft(draft) {
    if (!draft || !draft.image) return "缺少图片";
    if (!draft.category || !draft.subcategory) return "请选择品类";
    if (!draft.color) return "请选择颜色";
    if (!String(draft.name || "").trim()) return "请填写名称";
    if (!draft.seasons || !draft.seasons.length) return "请选择季节";
    return "";
  },

  markCurrentComplete() {
    const error = this.validateDraft(this.data.currentDraft);
    if (error) {
      wx.showToast({ title: error, icon: "none" });
      return;
    }
    this.patchCurrent({ completed: true }, false);
    const nextIndex = this.data.drafts.findIndex((draft, index) => index > this.data.currentIndex && !draft.completed);
    if (nextIndex >= 0) {
      this.setData({
        currentIndex: nextIndex,
        currentDraft: this.data.drafts[nextIndex]
      }, this.syncOptions);
    }
  },

  applySeasonToAll(event) {
    const value = event.currentTarget.dataset.value;
    const seasons = value === "warm" ? ["春", "夏"] : ["秋", "冬"];
    const drafts = this.data.drafts.map((draft) => Object.assign({}, draft, { seasons }));
    this.setData({
      drafts,
      currentDraft: drafts[this.data.currentIndex]
    }, () => {
      this.syncOptions();
      this.syncProgress();
    });
  },

  saveAll() {
    const validDrafts = this.data.drafts.filter((draft) => !this.validateDraft(draft));
    if (!validDrafts.length) {
      wx.showToast({ title: "请先完善至少一件衣物", icon: "none" });
      return;
    }

    const remaining = limits.getRemainingItemSlots(storage.getItems().length);
    const toSave = validDrafts.slice(0, remaining);
    if (!toSave.length) {
      wx.showModal({
        title: "衣橱已达免费上限",
        content: `当前免费版最多可录入 ${limits.getPlanLimits().maxItems} 件衣物。`,
        showCancel: false
      });
      return;
    }

    toSave.forEach((draft) => {
      const item = Object.assign({}, draft, {
        id: `item_${Date.now()}_${Math.floor(Math.random() * 100000)}`
      });
      delete item.completed;
      storage.saveItem(item);
    });

    const skipped = validDrafts.length - toSave.length;
    wx.showToast({
      title: skipped ? `已保存 ${toSave.length} 件，超出上限未保存` : `已保存 ${toSave.length} 件`,
      icon: "none",
      duration: 1800
    });
    setTimeout(() => wx.navigateBack(), 900);
  },

  syncOptions() {
    const draft = this.data.currentDraft;
    if (!draft) return;
    this.setData({
      categoryOptions: taxonomy.getCategoryNames().map((name) => ({ name, active: draft.category === name })),
      subcategoryOptions: taxonomy.getSubcategories(draft.category).map((name) => ({ name, active: draft.subcategory === name })),
      colorOptions: taxonomy.colors.map((name) => ({ name, active: taxonomy.normalizeColorName(draft.color) === name, display: taxonomy.getColorDisplayName(name) })),
      seasonOptions: taxonomy.seasons.map((name) => ({ name, active: (draft.seasons || []).includes(name) }))
    });
  }
});
