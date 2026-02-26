import { View } from "@tarojs/components";

export default function SkeletonLoader() {
  return (
    <View className="px-3 box-border">
      {Array(6)
        .fill(0)
        .map((_, idx) => (
          <View
            key={idx}
            className="bg-white rounded-xl overflow-hidden mb-4 shadow-soft"
          >
            <View className="flex">
              <View className="w-1/3 h-120px bg-gray-200 animate-pulse" />
              <View className="w-2/3 p-3 flex flex-col gap-2">
                <View className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                <View className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mt-1" />
                <View className="h-4 bg-gray-200 rounded animate-pulse w-full mt-2" />
                <View className="mt-auto h-6 bg-gray-200 rounded animate-pulse w-1/3" />
              </View>
            </View>
          </View>
        ))}
    </View>
  );
}
