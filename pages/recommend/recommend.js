const storage = require("../../utils/storage");
const weatherService = require("../../utils/weather");
const recommender = require("../../utils/recommendation");
const scenes = require("../../utils/scenes");

Page({
  data: {
    weather: weatherService.fallbackWeather(),
    selectedSceneName: scenes.getDefaultSceneName(),
    quickSceneOptions: [],
    sceneGroups: scenes.sceneGroups,
    scenePanelOpen: false,
    recommendation: {
      missing: [],
      pieces: [],
      colorTags: [],
      reasonLines: [],
      itemIds: []
    },
    changeIndex: 0,
    confirmed: false,
    canConfirm: false,
    showCalendarLink: false
  },

  onLoad() {
    this.syncSceneOptions();
  },

  onShow() {
    this.loadWeatherAndRecommend();
  },

  loadWeatherAndRecommend() {
    const profile = storage.getProfile();
    const privacy = storage.getPrivacy();
    this.getWeatherLocation(profile, privacy).then((location) => weatherService.fetchCurrentWeather(location)).then((weather) => {
      this.setData({ weather }, () => this.refreshRecommendation());
    });
  },

  getWeatherLocation(profile, privacy) {
    if (!privacy.locationEnabled) return Promise.resolve(profile.city || "北京");
    return new Promise((resolve) => {
      wx.getLocation({
        type: "gcj02",
        success: (res) => resolve(`${res.longitude},${res.latitude}`),
        fail: () => resolve(profile.city || "北京")
      });
    });
  },

  refreshRecommendation() {
    const profile = storage.getProfile();
    const scene = scenes.getScene(this.data.selectedSceneName);
    const recommendation = recommender.buildRecommendation(
      storage.getItems(),
      this.data.weather,
      profile,
      scene,
      this.data.changeIndex
    );
    recommendation.missingText = (recommendation.missing || []).join("、");
    this.setData({
      recommendation,
      confirmed: false,
      canConfirm: !!recommendation.itemIds.length,
      showCalendarLink: false
    });
    this.syncSceneOptions();
  },

  syncSceneOptions() {
    const quickSceneOptions = scenes.quickScenes.map((name) => ({
      name,
      active: name === this.data.selectedSceneName
    }));
    this.setData({ quickSceneOptions });
  },

  selectScene(event) {
    const selectedSceneName = event.currentTarget.dataset.name;
    this.setData({
      selectedSceneName,
      scenePanelOpen: false,
      changeIndex: 0
    }, () => this.refreshRecommendation());
  },

  openScenePanel() {
    this.setData({ scenePanelOpen: true });
  },

  closeScenePanel() {
    this.setData({ scenePanelOpen: false });
  },

  confirmOutfit() {
    const recommendation = this.data.recommendation;
    if (!recommendation.itemIds.length || this.data.confirmed) return;
    storage.addOutfit({
      id: `outfit_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      itemIds: recommendation.itemIds,
      weather: this.data.weather,
      scene: this.data.selectedSceneName,
      palette: recommendation.palette,
      reason: recommendation.reasonLines.join("；"),
      createdAt: Date.now()
    });
    this.setData({ confirmed: true, canConfirm: false });
    wx.showToast({ title: "已记录到今日穿搭日历 📅", icon: "none", duration: 1500 });
    setTimeout(() => {
      this.setData({ showCalendarLink: true });
    }, 1500);
  },

  changeOutfit() {
    this.setData({
      changeIndex: this.data.changeIndex + 1,
      confirmed: false,
      canConfirm: false,
      showCalendarLink: false
    }, () => this.refreshRecommendation());
  },

  dislikeOutfit() {
    this.changeOutfit();
  },

  goCalendar() {
    wx.switchTab({ url: "/pages/calendar/calendar" });
  }
});
