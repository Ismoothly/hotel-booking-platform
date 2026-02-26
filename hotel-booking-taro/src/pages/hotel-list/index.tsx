import {
  View,
  ScrollView,
  Image,
  Text,
  Picker,
  Input,
} from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";
import Taro, { useLoad, useRouter } from "@tarojs/taro";
import { hotelAPI } from "../../services/api";
import DateRangePicker from "./components/DateRangePicker";

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
const SORT_OPTIONS = ["按最低价", "按星级"];
const ICONS = {
  search: "https://img.icons8.com/ios-filled/50/c9cdd4/search.png",
};

export default function HotelList() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState("上海");
  const [selectedStar, setSelectedStar] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [rooms, setRooms] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [dateVisible, setDateVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState(-1);
  const [sortType, setSortType] = useState<"" | "price" | "star">("");

  useLoad(() => {
    const p = router.params || {};
    const city = p.city ? decodeURIComponent(p.city) : "上海";
    const checkIn = p.checkIn || "";
    const checkOut = p.checkOut || "";
    const kw = p.keyword ? decodeURIComponent(p.keyword) : "";
    const fac = p.facilities ? decodeURIComponent(p.facilities) : "";
    const starIdx = p.starIndex ? Number(p.starIndex) : 0;
    const priceIdx = p.priceIndex ? Number(p.priceIndex) : 0;
    setSelectedCity(city);
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setKeyword(kw);
    setFacilities(
      fac
        ? fac
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        : [],
    );
    setSelectedStar(Number.isFinite(starIdx) ? starIdx : 0);
    setSelectedPrice(Number.isFinite(priceIdx) ? priceIdx : 0);
  });

  useEffect(() => {
    fetchHotels({});
  }, [
    selectedCity,
    selectedStar,
    selectedPrice,
    keyword,
    facilities,
    checkInDate,
    checkOutDate,
    sortType,
  ]);

  const formatDayLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate();
    return `${day}日`;
  };

  const calculateNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkInDate, checkOutDate]);

  const fetchHotels = async (filters: any = {}) => {
    setLoading(true);
    try {
      const params: any = {
        city: selectedCity,
        ...filters,
      };
      if (keyword) {
        params.keyword = keyword;
      }
      if (facilities && facilities.length > 0) {
        params.facilities = facilities.join(",");
      }
      if (checkInDate) {
        params.checkInDate = checkInDate;
      }
      if (checkOutDate) {
        params.checkOutDate = checkOutDate;
      }
      if (selectedStar > 0) {
        params.starRating = selectedStar + 2;
      }
      if (selectedPrice > 0) {
        params.priceRange = PRICE_VALUES[selectedPrice];
      }
      const response = await hotelAPI.getHotels(params);
      const list = (response.data || []) as Hotel[];
      const minPrice = (
        rs?: Array<{ price: number; effectivePrice?: number }>,
      ) => {
        if (!rs || rs.length === 0) return Number.POSITIVE_INFINITY;
        return Math.min(
          ...rs.map((r) =>
            r.effectivePrice != null ? r.effectivePrice : r.price,
          ),
        );
      };
      let sorted = list.slice();
      if (sortType === "price") {
        sorted.sort((a, b) => minPrice(a.rooms) - minPrice(b.rooms));
      } else if (sortType === "star") {
        sorted.sort((a, b) => (b.starRating || 0) - (a.starRating || 0));
      }
      setHotels(sorted);
    } catch (error: any) {
      Taro.showToast({
        title: error.message || "获取酒店列表失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (e: any) => {
    const cityIndex = e.detail.value;
    const city = CITIES[cityIndex];
    setSelectedCity(city);
  };

  const handleStarChange = (e: any) => {
    const starIndex = Number(e.detail.value);
    setSelectedStar(starIndex);
  };

  const handlePriceChange = (e: any) => {
    const priceIndex = Number(e.detail.value);
    setSelectedPrice(priceIndex);
  };

  const handleSortChange = (e: any) => {
    const idx = Number(e.detail.value);
    setSelectedSort(idx);
    setSortType(idx === 0 ? "price" : "star");
  };

  const formatMonthDay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${m}.${day}`;
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

  const handleHotelDetail = (hotelId: string) => {
    const params: any = { id: hotelId };
    if (checkInDate) params.checkIn = checkInDate;
    if (checkOutDate) params.checkOut = checkOutDate;
    const query = new URLSearchParams(params).toString();
    Taro.navigateTo({ url: `/pages/hotel-detail/index?${query}` });
  };

  return (
    <View className="bg-app min-h-screen pb-5">
      <View className="px-3 pt-3">
        <View className="flex items-center">
          <View className="flex-1 bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-soft">
            <Picker
              mode="selector"
              range={CITIES}
              onChange={handleCityChange}
              value={CITIES.indexOf(selectedCity)}
            >
              <View className="flex items-center px-1">
                <Text className="text-text1 font-medium">{selectedCity}</Text>
              </View>
            </Picker>
            <View
              className="flex flex-col items-start px-1"
              onClick={() => setDateVisible(true)}
            >
              <View className="flex items-center gap-1">
                <Text className="text-text3 text-xs">住</Text>
                <Text className="text-primary text-xs">
                  {formatMonthDay(checkInDate)}
                </Text>
              </View>
              <View className="flex items-center gap-1 mt-0_5">
                <Text className="text-text3 text-xs">离</Text>
                <Text className="text-primary text-xs">
                  {formatMonthDay(checkOutDate)}
                </Text>
              </View>
            </View>
            <View className="flex-1 h-8 bg-app rounded-lg px-2 flex items-center">
              <Image src={ICONS.search} className="w-4 h-4 mr-1" />
              <Input
                className="flex-1 text-28px"
                value={keyword}
                placeholder="搜索酒店"
                onInput={(e) => setKeyword(e.detail.value)}
                confirmType="search"
                onConfirm={() => fetchHotels({})}
              />
            </View>
          </View>
        </View>
      </View>
      {facilities && facilities.length > 0 && (
        <View className="px-3 mt-2 flex flex-wrap gap-2">
          {facilities.map((tag, idx) => (
            <View
              key={idx}
              className="inline-flex items-center bg-primary text-white px-3 py-1 rounded-full cursor-pointer"
              onClick={() => {
                const updated = facilities.filter((t, i) => i !== idx);
                setFacilities(updated);
                fetchHotels({ facilities: updated.join(",") });
              }}
            >
              <Text className="text-sm">{tag}</Text>
              <Text className="ml-1 text-xs">×</Text>
            </View>
          ))}
        </View>
      )}

      <View className="bg-white mt-3 px-3 py-2">
        <View className="flex items-center justify-between">
          <View className="flex-1 text-center">
            <Picker
              mode="selector"
              range={SORT_OPTIONS}
              onChange={handleSortChange}
              value={Math.max(selectedSort, 0)}
            >
              <View className="text-text2">
                {selectedSort === -1 ? "智能排序" : SORT_OPTIONS[selectedSort]}{" "}
                ▼
              </View>
            </Picker>
          </View>
          <View className="flex-1 text-center">
            <Picker
              mode="selector"
              range={PRICE_OPTIONS}
              onChange={handlePriceChange}
              value={selectedPrice}
            >
              <View className="text-text2">价格 ▼</View>
            </Picker>
          </View>
          <View className="flex-1 text-center">
            <Picker
              mode="selector"
              range={STAR_RATINGS}
              onChange={handleStarChange}
              value={selectedStar}
            >
              <View className="text-text2">星级 ▼</View>
            </Picker>
          </View>
        </View>
      </View>
      <View className="hidden">
        <View className="flex items-center justify-between mb-3">
          <Picker
            mode="selector"
            range={CITIES}
            onChange={handleCityChange}
            value={CITIES.indexOf(selectedCity)}
          >
            <View className="flex items-center text-text1 font-medium text-28px h-8 leading-8">
              <Text>{selectedCity}</Text>
            </View>
          </Picker>
          <View className="flex items-center gap-2">
            <View className="flex items-center">
              <Text className="text-28px text-text3 mr-2">房间</Text>
              <View
                className="w-7 h-7 bg-app rounded-lg flex items-center justify-center border border-solid border-border"
                onClick={() => setRooms((v) => Math.max(1, v - 1))}
              >
                <Text>-</Text>
              </View>
              <Text className="mx-2 text-28px text-text1">{rooms}间</Text>
              <View
                className="w-7 h-7 bg-app rounded-lg flex items-center justify-center border border-solid border-border"
                onClick={() => setRooms((v) => v + 1)}
              >
                <Text>+</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-2 flex items-center gap-2">
          <View className="flex-1">
            <Picker
              mode="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.detail.value)}
            >
              <View className="flex items-center justify-between px-3 h-8 bg-white rounded-xl border border-solid border-border">
                <View className="flex items-center">
                  <Text className="text-28px font-medium leading-8 text-text1">
                    {formatDayLabel(checkInDate)}
                  </Text>
                </View>
              </View>
            </Picker>
          </View>
          <View className="px-2 py-0_5 text-xs text-accent bg-accentTint rounded-lg whitespace-nowrap">
            <Text>共{calculateNights}晚</Text>
          </View>
          <View className="flex-1">
            <Picker
              mode="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.detail.value)}
            >
              <View className="flex items-center justify-between px-3 h-8 bg-white rounded-xl border border-solid border-border">
                <View className="flex items-center">
                  <Text className="text-28px font-medium leading-8 text-text1">
                    {formatDayLabel(checkOutDate)}
                  </Text>
                </View>
              </View>
            </Picker>
          </View>
        </View>

        <View className="flex items-center mb-2 gap-2">
          <View className="flex-1 flex items-center gap-2">
            <Text className="text-28px text-text3">星级</Text>
            <Picker
              mode="selector"
              range={STAR_RATINGS}
              onChange={handleStarChange}
              value={selectedStar}
            >
              <View className="flex items-center justify-between px-2 h-7 bg-white rounded-xl border border-solid border-border flex-1">
                <Text className="text-sm font-medium leading-7 text-text1">
                  {STAR_RATINGS[selectedStar]}
                </Text>
              </View>
            </Picker>
          </View>
          <View className="flex-1 flex items-center gap-2">
            <Text className="text-28px text-text3">价格</Text>
            <Picker
              mode="selector"
              range={PRICE_OPTIONS}
              onChange={handlePriceChange}
              value={selectedPrice}
            >
              <View className="flex items-center justify-between px-2 h-7 bg-white rounded-xl border border-solid border-border flex-1">
                <Text className="text-sm font-medium leading-7 text-text1">
                  {PRICE_OPTIONS[selectedPrice]}
                </Text>
              </View>
            </Picker>
          </View>
        </View>

        <View
          className="flex items-center justify-center bg-primary text-white border border-solid border-primary rounded-xl h-8 leading-8 px-4 text-28px font-bold shadow-primary"
          onClick={() => fetchHotels({})}
        >
          <Text>筛选</Text>
        </View>
      </View>

      {loading && (
        <View className="p-5 text-center text-text3 text-sm">
          <Text>加载中...</Text>
        </View>
      )}

      <ScrollView scrollY className="px-3 box-border">
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
                        ¥
                        {(
                          getMinPrice(hotel.rooms) *
                          rooms *
                          Math.max(1, calculateNights)
                        ).toFixed(2)}
                      </Text>
                      <Text className="text-xs text-text3 ml-1">起</Text>
                      {getMinOriginalPrice(hotel.rooms) >
                        getMinPrice(hotel.rooms) && (
                        <Text className="text-xs text-text3 ml-2 line-through">
                          ¥
                          {(
                            getMinOriginalPrice(hotel.rooms) *
                            rooms *
                            Math.max(1, calculateNights)
                          ).toFixed(2)}
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
          fetchHotels({});
        }}
      />
    </View>
  );
}
