const qweather = require("../config/qweather");

function getSeasonByTemp(temp) {
  if (temp >= 26) return "夏";
  if (temp >= 16) return "春";
  if (temp >= 8) return "秋";
  return "冬";
}

function getDressingTip(temp, text) {
  if (temp >= 30) return "建议穿短袖和轻薄透气面料";
  if (temp >= 24) return "建议穿薄款长袖或短袖";
  if (temp >= 16) return "建议穿薄款长袖";
  if (temp >= 8) return "建议叠穿外套";
  return "建议穿厚外套并注意保暖";
}

function getWeatherIcon(text) {
  if (/雨|阵雨|雷/.test(text)) return "🌧️";
  if (/雪/.test(text)) return "❄️";
  if (/云|阴/.test(text)) return "☁️";
  return "☀️";
}

function fallbackWeather() {
  return {
    city: "北京",
    temp: 20,
    text: "晴",
    icon: "☀️",
    rainChance: 0,
    wind: "2",
    season: getSeasonByTemp(20),
    summary: "晴",
    dressingTip: "建议穿薄款长袖",
    isFallback: true
  };
}

function getMockWeather(city) {
  const seed = String(city || "上海").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const temp = 12 + (seed % 20);
  const rainChance = seed % 3 === 0 ? 68 : seed % 3 === 1 ? 28 : 10;
  const wind = 1 + (seed % 5);
  return {
    city: city || "上海",
    temp,
    text: rainChance > 50 ? "小雨" : temp > 28 ? "晴" : "多云",
    icon: rainChance > 50 ? "🌧️" : temp > 28 ? "☀️" : "☁️",
    rainChance,
    wind: String(wind),
    season: getSeasonByTemp(temp),
    summary: rainChance > 50 ? "有降水可能" : temp > 28 ? "偏热" : temp < 12 ? "偏冷" : "舒适",
    dressingTip: getDressingTip(temp)
  };
}

function request(url, data) {
  const header = {};
  if (qweather.authMode === "bearer") {
    header.Authorization = `Bearer ${qweather.apiKey}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      data: qweather.authMode === "key" ? Object.assign({}, data, { key: qweather.apiKey }) : data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.code === "200") {
          resolve(res.data);
        } else {
          reject(new Error("QWeather request failed"));
        }
      },
      fail: reject
    });
  });
}

function fetchCurrentWeather(city) {
  if (!qweather.apiKey) {
    return Promise.resolve(fallbackWeather());
  }

  const queryCity = city || "南京";
  return request(`${qweather.apiHost}/geo/v2/city/lookup`, { location: queryCity, lang: "zh" })
    .then((geo) => {
      const location = geo.location && geo.location[0];
      if (!location) throw new Error("No location");
      return request(`${qweather.apiHost}/v7/weather/now`, { location: location.id, lang: "zh", unit: "m" })
        .then((weather) => {
          const now = weather.now || {};
          const temp = Number(now.temp) || 20;
          const text = now.text || "晴";
          return {
            city: location.name || queryCity,
            temp,
            text,
            icon: getWeatherIcon(text),
            rainChance: Number(now.precip) > 0 ? 70 : 0,
            wind: now.windScale || "2",
            season: getSeasonByTemp(temp),
            summary: text,
            dressingTip: getDressingTip(temp, text),
            isFallback: false
          };
        });
    })
    .catch(() => fallbackWeather());
}

module.exports = {
  getMockWeather,
  fetchCurrentWeather,
  fallbackWeather
};
