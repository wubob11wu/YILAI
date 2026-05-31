const storage = require("../../utils/storage");

Page({
  data: {
    outfitCount: 0,
    usedItemCount: 0,
    topItem: null,
    rankedItems: [],
    visibleOutfits: [],
    privacy: {}
  },

  onShow() {
    const items = storage.getItems();
    const outfits = storage.getOutfits();
    const privacy = storage.getPrivacy();
    const itemMap = items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    const rankedItems = items
      .filter((item) => item.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
    const visibleOutfits = privacy.hideOutfitRecords
      ? []
      : outfits.map((outfit) => Object.assign({}, outfit, {
          names: (outfit.itemIds || []).map((id) => itemMap[id] && itemMap[id].name).filter(Boolean).join(" + ")
        }));

    this.setData({
      outfitCount: outfits.length,
      usedItemCount: rankedItems.length,
      topItem: rankedItems[0] || null,
      rankedItems,
      visibleOutfits,
      privacy
    });
  }
});
