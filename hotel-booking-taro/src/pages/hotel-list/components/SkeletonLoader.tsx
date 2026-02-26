import { View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";

export default function SkeletonLoader() {
  // 根据窗口高度计算可视区域能放多少个卡片
  const [count, setCount] = useState(6);

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync();
      // 卡片高度大约为 140px（图片 120 + 上下边距 16 + 内边距），多一点保证无白边
      const cardHeight = 140;
      const visible = Math.ceil(info.windowHeight / cardHeight) + 1;
      setCount(visible);
    } catch (e) {
      // 在非小程序环境获取失败则保持默认
    }
  }, []);

  return (
    <View className="px-3 box-border">
      {Array(count)
        .fill(0)
        .map((_, idx) => (
          <View
            key={idx}
            className="card bg-white rounded-xl overflow-hidden mb-4 shadow-soft"
          >
            <View className="flex">
              <View className="w-1/3">
                <View className="w-full h-full min-h-120px bg-gray-200 animate-pulse" />
              </View>
              <View className="w-2/3 p-3 flex flex-col">
                <View className="h-6 bg-gray-200 rounded animate-pulse mb-1 w-3/4" />
                <View className="flex items-center mb-1">
                  <View className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </View>
                <View className="mt-auto flex justify-between items-end">
                  <View className="flex items-center">
                    <View className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                    <View className="h-4 bg-gray-200 rounded animate-pulse ml-1 w-10" />
                  </View>
                  <View className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                </View>
              </View>
            </View>
          </View>
        ))}
    </View>
  );
}
