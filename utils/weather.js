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

function getFallbackTip(reason) {
  const text = String(reason || "");
  if (/domain|url not in domain|合法域名|not in the domain/i.test(text)) {
    return "请求域名未放行";
  }
  if (/timeout|timed out/i.test(text)) return "请求超时";
  if (/fail|network|ERR_|request:fail/i.test(text)) return "网络请求失败";
  if (/401|403|Invalid Host|unauthorized/i.test(text)) return "天气凭据或 Host 未授权";
  if (/402|quota|balance/i.test(text)) return "天气额度不足";
  if (/No location/i.test(text)) return "城市解析失败";
  if (/missing_api_key/i.test(text)) return "缺少天气 Key";
  return text || "请求失败";
}

function fallbackWeather(reason) {
  return {
    city: "天气暂不可用",
    temp: 20,
    tempText: "",
    text: "默认",
    displayText: "已按默认气温推荐",
    icon: "☀️",
    rainChance: 0,
    wind: "2",
    season: getSeasonByTemp(20),
    summary: "默认天气",
    dressingTip: "建议穿薄款长袖",
    isFallback: true,
    fallbackReason: reason || "",
    fallbackTip: getFallbackTip(reason)
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
          const apiError = res.data && res.data.error;
          const apiCode = res.data && res.data.code;
          const message = apiError
            ? `${res.statusCode} ${apiError.title || ""} ${apiError.detail || ""}`
            : `HTTP ${res.statusCode} QWeather code ${apiCode || "unknown"}`;
          reject(new Error(message));
        }
      },
      fail: (error) => {
        reject(new Error(error && error.errMsg ? error.errMsg : "wx.request failed"));
      }
    });
  });
}

function normalizeCurrentWeather(weather, city) {
  const now = weather.now || {};
  const temp = Number(now.temp) || 20;
  const text = now.text || "晴";
  return {
    city,
    temp,
    tempText: `${temp}℃`,
    text,
    displayText: text,
    icon: getWeatherIcon(text),
    rainChance: Number(now.precip) > 0 ? 70 : 0,
    wind: now.windScale || "2",
    season: getSeasonByTemp(temp),
    summary: text,
    dressingTip: getDressingTip(temp, text),
    isFallback: false
  };
}

function isCoordinateLocation(location) {
  return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(String(location || "").trim());
}

function fetchWeatherByLocation(location, cityName) {
  return request(`${qweather.apiHost}/v7/weather/now`, { location, lang: "zh", unit: "m" })
    .then((weather) => normalizeCurrentWeather(weather, cityName || location));
}

function fetchWeatherByCity(city) {
  const queryCity = city || "南京";
  return request(`${qweather.apiHost}/geo/v2/city/lookup`, { location: queryCity, lang: "zh" })
    .then((geo) => {
      const location = geo.location && geo.location[0];
      if (!location) throw new Error("No location");
      return fetchWeatherByLocation(location.id, location.name || queryCity);
    });
}

function fetchCurrentWeather(locationOrCity) {
  if (!qweather.apiKey) {
    return Promise.resolve(fallbackWeather("missing_api_key"));
  }

  const query = locationOrCity || "南京";
  const weatherPromise = isCoordinateLocation(query)
    ? fetchWeatherByLocation(query, "当前位置")
    : fetchWeatherByCity(query);

  return weatherPromise
    .catch((error) => {
      console.warn("[YILAI weather] QWeather request failed", error);
      return fallbackWeather(error && error.message ? error.message : "request_failed");
    });
}

module.exports = {
  getMockWeather,
  fetchCurrentWeather,
  fallbackWeather
};
