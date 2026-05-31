const storage = require("./utils/storage");

App({
  globalData: {
    user: null
  },

  onLaunch() {
    storage.bootstrap();
    this.globalData.user = storage.getProfile();
  }
});
