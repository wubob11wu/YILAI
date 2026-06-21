const storage = require("../../utils/storage");

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function sameMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

Page({
  data: {
    year: 0,
    month: 0,
    monthTitle: "",
    weekDays: ["一", "二", "三", "四", "五", "六", "日"],
    calendarDays: [],
    selectedDate: "",
    selectedOutfits: [],
    selectedSummary: "这一天还没有穿搭记录",
    privacy: {},
    outfitMap: {},
    itemMap: {}
  },

  onShow() {
    const today = new Date();
    const selectedDate = this.data.selectedDate || formatDate(today);
    this.loadMonth(today.getFullYear(), today.getMonth(), selectedDate);
  },

  loadMonth(year, month, selectedDate) {
    const items = storage.getItems();
    const outfits = storage.getOutfits();
    const privacy = storage.getPrivacy();
    const itemMap = items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    const outfitMap = outfits.reduce((map, outfit) => {
      if (!map[outfit.date]) map[outfit.date] = [];
      map[outfit.date].push(outfit);
      return map;
    }, {});

    const days = this.buildCalendarDays(year, month, selectedDate, outfitMap);
    this.setData({
      year,
      month,
      monthTitle: `${year}年${month + 1}月`,
      calendarDays: days,
      selectedDate,
      privacy,
      outfitMap,
      itemMap
    }, () => this.selectDateByValue(selectedDate));
  },

  buildCalendarDays(year, month, selectedDate, outfitMap) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstWeek = first.getDay() === 0 ? 7 : first.getDay();
    const total = firstWeek - 1 + last.getDate();
    const cells = Math.ceil(total / 7) * 7;
    const todayText = formatDate(new Date());
    const days = [];

    for (let index = 0; index < cells; index += 1) {
      const dayNumber = index - firstWeek + 2;
      if (dayNumber < 1 || dayNumber > last.getDate()) {
        days.push({ key: `empty_${index}`, empty: true });
        continue;
      }
      const date = `${year}-${pad(month + 1)}-${pad(dayNumber)}`;
      days.push({
        key: date,
        date,
        day: dayNumber,
        hasRecord: !!(outfitMap[date] && outfitMap[date].length),
        active: date === selectedDate,
        today: date === todayText
      });
    }
    return days;
  },

  prevMonth() {
    const current = new Date(this.data.year, this.data.month - 1, 1);
    const selected = sameMonth(new Date(this.data.selectedDate), current.getFullYear(), current.getMonth())
      ? this.data.selectedDate
      : formatDate(current);
    this.loadMonth(current.getFullYear(), current.getMonth(), selected);
  },

  nextMonth() {
    const current = new Date(this.data.year, this.data.month + 1, 1);
    const selected = sameMonth(new Date(this.data.selectedDate), current.getFullYear(), current.getMonth())
      ? this.data.selectedDate
      : formatDate(current);
    this.loadMonth(current.getFullYear(), current.getMonth(), selected);
  },

  selectDate(event) {
    const date = event.currentTarget.dataset.date;
    if (!date) return;
    this.selectDateByValue(date);
  },

  selectDateByValue(date) {
    const selectedOutfits = this.buildOutfitDetails(date);
    const calendarDays = this.data.calendarDays.map((day) => {
      if (day.empty) return day;
      return Object.assign({}, day, { active: day.date === date });
    });
    this.setData({
      selectedDate: date,
      calendarDays,
      selectedOutfits,
      selectedSummary: selectedOutfits.length ? `${selectedOutfits.length} 套穿搭记录` : "这一天还没有穿搭记录"
    }, () => this.drawOutfitCanvas());
  },

  buildOutfitDetails(date) {
    if (this.data.privacy.hideOutfitRecords) return [];
    const outfits = this.data.outfitMap[date] || [];
    return outfits.map((outfit) => {
      const pieces = (outfit.itemIds || []).map((id) => this.data.itemMap[id]).filter(Boolean);
      return Object.assign({}, outfit, {
        pieces,
        names: pieces.map((item) => item.name).join(" / "),
        sceneText: outfit.scene || "未记录场景",
        weatherText: outfit.weather ? `${outfit.weather.city || ""} ${outfit.weather.temp || ""}℃` : "未记录天气"
      });
    });
  },

  drawOutfitCanvas() {
    const ctx = wx.createCanvasContext("outfitCanvas", this);
    const width = 320;
    const height = 420;
    const outfits = this.data.selectedOutfits;
    ctx.setFillStyle("#ffffff");
    ctx.fillRect(0, 0, width, height);
    ctx.setFillStyle("#141821");
    ctx.setFontSize(20);
    ctx.fillText(this.data.selectedDate, 22, 38);
    ctx.setFillStyle("#141821");
    ctx.setFontSize(14);
    ctx.fillText(this.data.selectedSummary, 22, 62);

    if (!outfits.length) {
      ctx.setFillStyle("#eef5f7");
      ctx.fillRect(22, 92, 276, 210);
      ctx.setFillStyle("#66717d");
      ctx.setFontSize(15);
      ctx.fillText("暂无穿搭记录", 108, 190);
      ctx.fillText("从推荐页确认后会出现在这里", 66, 218);
      ctx.draw();
      return;
    }

    const outfit = outfits[0];
    const blocks = [
      { label: "上装", item: outfit.pieces[0] },
      { label: "下装", item: outfit.pieces[1] },
      { label: "鞋子", item: outfit.pieces[2] }
    ];

    blocks.forEach((block, index) => {
      const y = 92 + index * 82;
      ctx.setFillStyle(["#eef5f7", "#f7fafb", "#fffaf0"][index]);
      ctx.fillRect(22, y, 276, 64);
      ctx.setFillStyle("#141821");
      ctx.setFontSize(13);
      ctx.fillText(block.label, 40, y + 24);
      ctx.setFillStyle("#141821");
      ctx.setFontSize(15);
      ctx.fillText(block.item ? block.item.name.slice(0, 15) : "未记录", 88, y + 25);
      ctx.setFillStyle("#66717d");
      ctx.setFontSize(12);
      ctx.fillText(block.item ? `${block.item.color || "未填色"} · ${block.item.mainStyle || ""}`.slice(0, 18) : "", 88, y + 48);
    });

    ctx.setFillStyle("#141821");
    ctx.setFontSize(14);
    ctx.fillText(`场景：${outfit.sceneText}`, 22, 352);
    ctx.fillText(`天气：${outfit.weatherText}`, 22, 378);
    ctx.setFillStyle("#141821");
    ctx.fillText(`配色：${outfit.palette || "未记录"}`, 22, 404);
    ctx.draw();
  }
});


