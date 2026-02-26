import {
  View,
  ScrollView,
  Image,
  Input,
  Text,
  Picker,
  Button,
  Swiper,
  SwiperItem,
} from "@tarojs/components";
import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { hotelAPI, setAPIBaseURL } from "../../services/api";
import DateRangePicker from "../hotel-list/components/DateRangePicker";

interface Hotel {
  _id: string;
  nameCn: string;
  nameEn: string;
  starRating: number;
  address: string;
  city?: string;
  images?: string[];
  rooms?: Array<{ type: string; price: number; effectivePrice?: number }>;
  activeDiscountPercent?: number;
}

const CITIES = [
  "北京",
  "天津",
  "上海",
  "广州",
  "深圳",
  "杭州",
  "成都",
  "西安",
  "南京",
  "武汉",
  "重庆",
];
const STAR_RATINGS = ["不限", "三星级", "四星级", "五星级"];
const PRICE_OPTIONS = [
  "不限",
  "0-300元",
  "300-600元",
  "600-1000元",
  "1000元以上",
];
const PRICE_VALUES = ["", "0-300", "300-600", "600-1000", "1000-"];

const BANNERS = [
  {
    id: 1,
    title: "上海外滩豪华酒店",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    hotelId: "1",
  },
  {
    id: 2,
    title: "艺术家酒店",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
    hotelId: "2",
  },
];

const QUICK_TAGS = [
  "免费WiFi",
  "亲子酒店",
  "豪华酒店",
  "免费停车",
  "商务酒店",
  "景区周边",
  "游泳池",
  "健身房",
  "餐厅",
];

const ICONS = {
  location: "https://img.icons8.com/ios-filled/50/1765FF/marker.png",
  chevronDown: "https://img.icons8.com/ios-glyphs/30/cccccc/chevron-down.png",
  search: "https://img.icons8.com/ios-filled/50/c9cdd4/search.png",
  searchWhite: "https://img.icons8.com/ios-filled/50/FFFFFF/search.png",
  calendarBlue: "https://img.icons8.com/ios-filled/50/1765FF/calendar--v1.png",
  sliders: "https://img.icons8.com/ios-filled/50/1765FF/sliders.png",
};

export default function Index() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  // 输入框关键词
  const [searchValue, setSearchValue] = useState("");
  // 选中的快捷标签数组
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("上海");
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [dateVisible, setDateVisible] = useState(false);

  useLoad(() => {
    console.log("🏠 首页加载");

    // 初始化日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCheckInDate(formatDate(today));
    setCheckOutDate(formatDate(tomorrow));

    fetchHotels();
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchHotels = async (filters: any = {}) => {
    setLoading(true);
    try {
      const params: any = {
        city: selectedCity,
        ...filters,
      };

      // 关键字与设施处理
      if (filters.keyword !== undefined) {
        params.keyword = filters.keyword;
      } else if (!filters.facilities && searchValue) {
        params.keyword = searchValue;
      }

      if (filters.facilities !== undefined) {
        params.facilities = filters.facilities;
      } else if (selectedTags.length > 0) {
        params.facilities = selectedTags.join(",");
      }

      // 添加星级筛选
      if (selectedStar > 0) {
        // 索引1对应三星级(3)，索引2对应四星级(4)，索引3对应五星级(5)
        params.starRating = selectedStar + 2;
      }

      // 添加价格筛选
      if (selectedPrice > 0) {
        params.priceRange = PRICE_VALUES[selectedPrice];
      }

      console.log("🔍 获取酒店列表，参数:", params);
      const response = await hotelAPI.getHotels(params);
      console.log("✅ 获取酒店列表成功:", response);
      setHotels(response.data || []);
    } catch (error: any) {
      console.error("❌ 获取酒店列表失败:", error);

      const msg = error && error.message ? error.message : "";
      const err = error && error.errMsg ? error.errMsg : "";
      if (msg.indexOf("网络请求失败") !== -1 || err.indexOf("timeout") !== -1) {
        Taro.showModal({
          title: "网络连接失败",
          content:
            '真机测试时，请在Console运行：\nsetAPIBaseURL("http://YOUR_IP:5000/api")\n将YOUR_IP改为电脑局域网IP地址',
          showCancel: false,
        });
      } else {
        Taro.showToast({
          title: error.message || "获取酒店列表失败",
          icon: "none",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  // 点击搜索按钮，跳转至酒店列表页并携带当前筛选参数
  const handleSearchButton = () => {
    const params: any = {
      city: selectedCity,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };
    if (searchValue) params.keyword = searchValue;
    if (selectedTags.length > 0) params.facilities = selectedTags.join(",");
    if (selectedStar > 0) params.starRating = selectedStar + 2;
    if (selectedPrice > 0) params.priceRange = PRICE_VALUES[selectedPrice];

    const query = new URLSearchParams(params).toString();
    Taro.navigateTo({
      url: `/pages/hotel-list/index?${query}`,
    });
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => {
      const idx = prev.indexOf(tag);
      if (idx === -1) {
        return [...prev, tag];
      }
      // remove
      return prev.filter((t) => t !== tag);
    });
  };

  const handleCityChange = (e: any) => {
    const cityIndex = e.detail.value;
    setSelectedCity(CITIES[cityIndex]);
    fetchHotels({ city: CITIES[cityIndex] });
  };

  const handleStarChange = (e: any) => {
    const starIndex = Number(e.detail.value);
    setSelectedStar(starIndex);
    // 直接在这里调用fetchHotels，需要传递正确的starRating
    // 但由于fetchHotels依赖state，这里最好只设置state，或者传递参数覆盖
    // 这里采用简单方式，等待下次搜索或手动触发，或者我们改进fetchHotels逻辑
    // 为了即时响应，我们手动构建参数
    const params: any = {};
    if (starIndex > 0) params.starRating = starIndex + 2;
    fetchHotels(params);
  };

  const handlePriceChange = (e: any) => {
    const priceIndex = Number(e.detail.value);
    setSelectedPrice(priceIndex);
    const params: any = {};
    if (priceIndex > 0) params.priceRange = PRICE_VALUES[priceIndex];
    fetchHotels(params);
  };

  // legacy handlers replaced by DateRangePicker
  // const handleCheckInDateChange = (e: any) => {
  //   setCheckInDate(e.detail.value);
  // };
  // const handleCheckOutDateChange = (e: any) => {
  //   setCheckOutDate(e.detail.value);
  // };

  const handleGetLocation = async () => {
    try {
      Taro.showLoading({ title: "定位中..." });

      // 直接获取定位，首次会自动弹出授权
      const res = await Taro.getLocation({
        type: "gcj02",
        altitude: false,
        isHighAccuracy: true,
      });

      Taro.hideLoading();

      // 根据经纬度匹配城市
      const city = getCityFromCoordinates(res.latitude, res.longitude);

      if (city) {
        setSelectedCity(city);
        Taro.showToast({
          title: `已定位到${city}`,
          icon: "success",
          duration: 2000,
        });
        fetchHotels({ city });
      } else {
        Taro.showToast({
          title: `定位成功，但当前位置暂不支持\n请手动选择城市`,
          icon: "none",
          duration: 2500,
        });
      }
    } catch (error: any) {
      Taro.hideLoading();
      console.error("定位失败:", error);

      // 根据不同错误码给出提示
      let errorMsg = "定位失败，请手动选择城市";
      if (error.errMsg) {
        if (error.errMsg.includes("auth deny")) {
          errorMsg = "定位权限被拒绝\n请在小程序设置中开启定位权限";
        } else if (error.errMsg.includes("timeout")) {
          errorMsg = "定位超时，请重试";
        }
      }

      Taro.showModal({
        title: "定位失败",
        content: errorMsg,
        showCancel: false,
      });
    }
  };

  const getCityFromCoordinates = (lat: number, lng: number) => {
    // 主要城市的大致经纬度范围
    const cityRanges = [
      { name: "北京", lat: [39.4, 41.6], lng: [115.4, 117.5] },
      { name: "天津", lat: [38.7, 40.3], lng: [116.7, 118.1] },
      { name: "上海", lat: [30.7, 31.9], lng: [120.8, 122.2] },
      { name: "广州", lat: [22.5, 24.0], lng: [112.9, 114.5] },
      { name: "深圳", lat: [22.4, 22.9], lng: [113.7, 114.7] },
      { name: "杭州", lat: [29.2, 30.6], lng: [118.3, 120.9] },
      { name: "成都", lat: [30.1, 31.4], lng: [102.9, 104.9] },
      { name: "西安", lat: [33.7, 34.8], lng: [107.8, 109.8] },
      { name: "南京", lat: [31.2, 32.6], lng: [118.4, 119.2] },
      { name: "武汉", lat: [29.9, 31.4], lng: [113.7, 115.1] },
      { name: "重庆", lat: [28.1, 32.2], lng: [105.3, 110.2] },
    ];

    for (const city of cityRanges) {
      if (
        lat >= city.lat[0] &&
        lat <= city.lat[1] &&
        lng >= city.lng[0] &&
        lng <= city.lng[1]
      ) {
        return city.name;
      }
    }
    return null;
  };

  const handleHotelDetail = (hotelId: string) => {
    Taro.navigateTo({
      url: `/pages/hotel-detail/index?id=${hotelId}`,
    });
  };

  const getMinPrice = (
    rooms?: Array<{ price: number; effectivePrice?: number }>,
  ) => {
    if (!rooms || rooms.length === 0) return 0;
    return Math.min(
      ...rooms.map((r) =>
        r.effectivePrice != null ? r.effectivePrice : r.price,
      ),
    );
  };

  const getMinOriginalPrice = (
    rooms?: Array<{ price: number; effectivePrice?: number }>,
  ) => {
    if (!rooms || rooms.length === 0) return 0;
    return Math.min(...rooms.map((r) => r.price));
  };

  const formatZhe = (percentOff?: number) => {
    if (!percentOff || percentOff <= 0) return "";
    const zheStr = ((100 - Math.round(percentOff)) / 10).toFixed(1);
    return zheStr.endsWith(".0") ? `${zheStr.slice(0, -2)}折` : `${zheStr}折`;
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getGlobalMinPrice = () => {
    if (!hotels || hotels.length === 0) return 0;
    const prices = hotels
      .map((h) => getMinPrice(h.rooms))
      .filter((p) => typeof p === "number" && p > 0);
    if (prices.length === 0) return 0;
    return Math.min(...prices);
  };

  const formatDayLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate();
    return `${day}日`;
  };

  return (
    <View className="bg-app min-h-screen pb-5">
      {/* Banner 区域 */}
      <Swiper
        className="w-full h-400px bg-white"
        indicatorColor="rgba(255, 255, 255, 0.6)"
        indicatorActiveColor="#fff"
        circular
        indicatorDots
        autoplay
      >
        {BANNERS.map((item) => (
          <SwiperItem key={item.id}>
            <View
              className="relative w-full"
              onClick={() => handleHotelDetail(item.hotelId)}
            >
              <Image src={item.image} mode="widthFix" className="w-full" />
              <View className="absolute inset-x-0 bottom-0 px-4 pt-3 pb-6 bg-gradient-to-t from-black70 to-transparent text-white text-base font-bold">
                {item.title}
              </View>
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 筛选区域 */}
      <View className="bg-white p-3 m-3 -mt-6 rounded-xl shadow-lgsoft relative z-10">
        <View className="flex items-center justify-between mb-3">
          <Picker
            mode="selector"
            range={CITIES}
            onChange={handleCityChange}
            value={CITIES.indexOf(selectedCity)}
          >
            <View className="flex items-center text-text1 font-medium text-28px h-8 leading-8 cursor-pointer">
              <Image src={ICONS.location} className="w-4 h-4 mr-2" />
              <Text>{selectedCity}</Text>
              <Image src={ICONS.chevronDown} className="w-3 h-3 ml-1" />
            </View>
          </Picker>
          <View
            className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg active:opacity-80"
            onClick={handleGetLocation}
          >
            <Image
              src="https://img.icons8.com/ios-filled/50/FFFFFF/worldwide-location.png"
              className="w-5 h-5"
            />
          </View>
        </View>

        <View className="mb-2 h-8 relative flex items-center">
          <View className="absolute left-3 top-1/2 -translate-y-1/2">
            <Image src={ICONS.search} className="w-4 h-4 translate-y-1" />
          </View>
          <Input
            className="w-full h-8 leading-8 pl-10 pr-4 bg-white rounded-xl text-28px box-border placeholder-grayCCC border border-solid border-border"
            style={{ lineHeight: "3.2px" }}
            type="text"
            value={searchValue}
            onInput={(e) => handleSearch(e.detail.value)}
            placeholder="输入酒店名称/地址"
            placeholderClass="placeholder"
            placeholderStyle="line-height:32px"
          />
        </View>

        <View className="flex items-center mb-2 gap-2">
          <View
            className="flex-1 flex items-center justify-between px-3 h-8 bg-white rounded-xl border border-solid border-border cursor-pointer"
            onClick={() => setDateVisible(true)}
          >
            <View className="flex items-center gap-2">
              <Text className="text-base font-medium leading-8 text-text1">
                {formatDayLabel(checkInDate)} - {formatDayLabel(checkOutDate)}
              </Text>
            </View>
            <Image src={ICONS.calendarBlue} className="w-4 h-4" />
          </View>
          <View className="px-2 py-0_5 text-xs text-accent bg-accentTint rounded-lg whitespace-nowrap">
            <Text>共{calculateNights()}晚</Text>
          </View>
        </View>

        <View className="flex items-center justify-between">
          <View
            className="flex items-center justify-center gap-2 flex-1 bg-primary text-white border border-solid border-primary rounded-xl h-8 leading-8 px-4 text-28px font-bold shadow-primary"
            onClick={handleSearchButton}
          >
            <Image src={ICONS.searchWhite} className="w-4 h-4" />
            <Text className="inline-block relative">搜索</Text>
          </View>
        </View>
        {/* 快捷标签 */}
        <View className="mt-3 px-1">
          <ScrollView
            scrollX
            className="flex overflow-x-auto gap-2 pb-2 w-full no-scrollbar"
            enableFlex
          >
            {QUICK_TAGS.map((tag, index) => (
              <View
                key={index}
                className={`px-4 h-8 flex items-center justify-center rounded-full text-base shadow-card whitespace-nowrap ${selectedTags.includes(tag) ? "bg-primary text-white" : "bg-white text-text2"}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="hidden">
          <View className="flex-1 flex flex-col">
            <Text className="text-xs text-text3 mb-1_5">星级</Text>
            <Picker
              mode="selector"
              range={STAR_RATINGS}
              onChange={handleStarChange}
              value={selectedStar}
            >
              <View className="flex items-center justify-between p-2_5 bg-grayF9 rounded-lg text-15px font-medium text-text1">
                <Text>{STAR_RATINGS[selectedStar]}</Text>
                <Text className="text-10px text-grayCCC ml-1">▼</Text>
              </View>
            </Picker>
          </View>
          <View className="flex-1 flex flex-col">
            <Text className="text-xs text-text3 mb-1_5">价格</Text>
            <Picker
              mode="selector"
              range={PRICE_OPTIONS}
              onChange={handlePriceChange}
              value={selectedPrice}
            >
              <View className="flex items-center justify-between p-2_5 bg-grayF9 rounded-lg text-15px font-medium text-text1">
                <Text>{PRICE_OPTIONS[selectedPrice]}</Text>
                <Text className="text-10px text-grayCCC ml-1">▼</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className="hidden flex gap-2_5 items-center mt-2">
          <Input
            className="flex-1 h-8 px-4 bg-app rounded-20px text-sm box-border placeholder-grayBBB"
            type="text"
            value={searchValue}
            onInput={(e) => handleSearch(e.detail.value)}
            placeholder="搜索酒店名称"
            placeholderClass="placeholder"
          />
          <View
            className="bg-btnGradient text-white rounded-20px h-8 leading-8 px-6 text-sm font-bold shadow-gradient"
            onClick={() => {
              const params = new URLSearchParams({
                city: selectedCity,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                keyword: searchValue || "",
              });
              Taro.navigateTo({
                url: `/pages/hotel-list/index?${params.toString()}`,
              });
            }}
          >
            搜索
          </View>
        </View>
      </View>

      {/* date picker modal */}
      <DateRangePicker
        visible={dateVisible}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        onClose={() => setDateVisible(false)}
        onChange={(inD, outD) => {
          setCheckInDate(inD);
          setCheckOutDate(outD);
        }}
        onConfirm={(inD, outD) => {
          setCheckInDate(inD);
          setCheckOutDate(outD);
          setDateVisible(false);
        }}
      />

      <ScrollView scrollY className="hidden px-3 box-border">
        {hotels.map((hotel) => (
          <View
            key={hotel._id}
            className="card bg-white rounded-xl overflow-hidden mb-4 shadow-soft active:opacity-98 active:scale-99_5 transition-all duration-100"
            onClick={() => handleHotelDetail(hotel._id)}
          >
            <View className="flex">
              <View className="w-1/3">
                {hotel.images && hotel.images.length > 0 && (
                  <Image
                    src={hotel.images[0]}
                    className="w-full h-full min-h-120px bg-grayEEE object-cover"
                    mode="aspectFill"
                  />
                )}
              </View>
              <View className="w-2/3 p-3 flex flex-col">
                <View>
                  <View className="font-semibold text-text1 text-base whitespace-nowrap overflow-hidden text-ellipsis">
                    {hotel.nameCn}
                  </View>
                  <View className="flex items-center mt-1">
                    <View className="text-xs text-orangeFF9800">
                      {"⭐".repeat(hotel.starRating)}
                    </View>
                    <Text className="text-xs text-text3 ml-1">
                      {hotel.starRating === 5
                        ? "五星级"
                        : hotel.starRating === 4
                          ? "四星级"
                          : hotel.starRating === 3
                            ? "三星级"
                            : `${hotel.starRating}星级`}
                    </Text>
                  </View>
                </View>
                <View className="mt-auto flex justify-between items-end">
                  <View>
                    <View className="flex items-center">
                      <Text className="text-accent font-bold text-28px">
                        ¥{getMinPrice(hotel.rooms)}
                      </Text>
                      <Text className="text-xs text-text3 ml-1">起</Text>
                      {getMinOriginalPrice(hotel.rooms) >
                        getMinPrice(hotel.rooms) && (
                        <Text className="text-xs text-text3 ml-2 line-through">
                          ¥{getMinOriginalPrice(hotel.rooms)}
                        </Text>
                      )}
                      {hotel.activeDiscountPercent > 0 && (
                        <Text className="text-xs text-red-500 ml-2">
                          {formatZhe(hotel.activeDiscountPercent)}
                        </Text>
                      )}
                    </View>
                    <View className="text-xs text-text3">{hotel.address}</View>
                  </View>
                  <View
                    className="inline-flex items-center justify-center text-sm h-7 leading-7 px-3 rounded-lg bg-accent text-white whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHotelDetail(hotel._id);
                    }}
                  >
                    预订
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
        {hotels.length === 0 && !loading && (
          <View className="py-10 text-center text-text3 text-sm">
            <Text>暂无符合条件的酒店</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
