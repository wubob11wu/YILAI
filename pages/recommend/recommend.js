const storage = require("../../utils/storage");
const weatherService = require("../../utils/weather");
const recommender = require("../../utils/recommendation");
const taxonomy = require("../../utils/taxonomy");

Page({
  data: {
    styles: taxonomy.stylePresets,
    styleOptions: [],
    customStyleText: "",
    profile: {},
    weather: {},
    recommendation: {
      missing: [],
      itemIds: []
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const profile = storage.getProfile();
    const privacy = storage.getPrivacy();
    const weather = weatherService.getMockWeather(privacy.locationEnabled ? profile.city : profile.city || "上海");
    const recommendation = recommender.buildRecommendation(storage.getItems(), weather, profile);
    recommendation.missingText = (recommendation.missing || []).join("、");
    const styles = taxonomy.getStyles(profile);
    const styleOptions = styles.map((name) => ({
      name,
      active: (profile.stylePrefs || []).includes(name)
    }));
    this.setData({ profile, weather, recommendation, styles, styleOptions });
  },

  togglePreference(event) {
    const value = event.currentTarget.dataset.value;
    const current = this.data.profile.stylePrefs || [];
    const stylePrefs = current.includes(value)
      ? current.filter((style) => style !== value)
      : current.concat(value);
    const profile = Object.assign({}, this.data.profile, { stylePrefs });
    storage.saveProfile(profile);
    this.setData({ profile }, this.refresh);
  },

  onCustomStyle(event) {
    this.setData({ customStyleText: event.detail.value });
  },

  addCustomStyle() {
    const style = String(this.data.customStyleText || "").trim();
    if (!style) return;
    const profile = Object.assign({}, this.data.profile);
    const stylePrefs = profile.stylePrefs || [];
    if (!stylePrefs.includes(style)) {
      profile.stylePrefs = stylePrefs.concat(style);
    }
    profile.customStyle = "";
    storage.saveProfile(profile);
    this.setData({ customStyleText: "" });
    this.refresh();
  },

  markToday() {
    const recommendation = this.data.recommendation;
    if (!recommendation.itemIds.length) return;
    storage.addOutfit({
      id: `outfit_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      itemIds: recommendation.itemIds,
      weather: this.data.weather,
      palette: recommendation.palette,
      reason: recommendation.reason,
      createdAt: Date.now()
    });
    wx.showToast({ title: "已记录今日穿搭", icon: "success" });
  }
});
