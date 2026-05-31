const storage = require("../../utils/storage");

Page({
  data: {
    profile: {},
    privacy: {}
  },

  onShow() {
    this.setData({
      profile: storage.getProfile(),
      privacy: storage.getPrivacy()
    });
  },

  login() {
    wx.getUserProfile({
      desc: "用于展示微信昵称并同步衣橱数据",
      success: (res) => {
        const profile = Object.assign({}, this.data.profile, {
          loggedIn: true,
          nickname: res.userInfo.nickName || "微信用户"
        });
        storage.saveProfile(profile);
        this.setData({ profile });
        wx.showToast({ title: "登录成功", icon: "success" });
      },
      fail: () => {
        wx.showToast({ title: "已取消登录", icon: "none" });
      }
    });
  },

  onCity(event) {
    const profile = Object.assign({}, this.data.profile, { city: event.detail.value });
    this.setData({ profile });
  },

  saveProfile() {
    storage.saveProfile(this.data.profile);
  },

  togglePrivacy(event) {
    const field = event.currentTarget.dataset.field;
    const privacy = Object.assign({}, this.data.privacy, { [field]: event.detail.value });
    storage.savePrivacy(privacy);
    this.setData({ privacy });
  }
});
