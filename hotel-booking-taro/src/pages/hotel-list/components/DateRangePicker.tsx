import { View, Text } from "@tarojs/components";
import { useEffect, useMemo, useState } from "react";

interface Props {
  visible: boolean;
  checkInDate: string;
  checkOutDate: string;
  onClose: () => void;
  onConfirm: (checkIn: string, checkOut: string) => void;
  onChange?: (checkIn: string, checkOut: string) => void;
}

export default function DateRangePicker({
  visible,
  checkInDate,
  checkOutDate,
  onClose,
  onConfirm,
  onChange,
}: Props) {
  const [start, setStart] = useState(checkInDate);
  const [end, setEnd] = useState(checkOutDate);
  const [panelDate, setPanelDate] = useState(
    checkInDate ? new Date(checkInDate) : new Date(),
  );

  useEffect(() => {
    setStart(checkInDate);
    setEnd(checkOutDate);
    setPanelDate(checkInDate ? new Date(checkInDate) : new Date());
  }, [visible, checkInDate, checkOutDate]);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const nights = useMemo(() => {
    if (!start || !end) return 0;
    const inD = new Date(start);
    const outD = new Date(end);
    const diff = Math.abs(outD.getTime() - inD.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [start, end]);

  const monthLabel = useMemo(() => {
    const y = panelDate.getFullYear();
    const m = panelDate.getMonth() + 1;
    return `${y}.${String(m).padStart(2, "0")}`;
  }, [panelDate]);

  const nextPanelDate = useMemo(
    () => new Date(panelDate.getFullYear(), panelDate.getMonth() + 1, 1),
    [panelDate],
  );

  const daysForMonth = (base: Date) => {
    const y = panelDate.getFullYear();
    const m = panelDate.getMonth();
    const y2 = base.getFullYear();
    const m2 = base.getMonth();
    const first = new Date(y2, m2, 1);
    const firstWeekday = first.getDay();
    const total = new Date(y2, m2 + 1, 0).getDate();
    const arr: Array<string | null> = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= total; d++) {
      arr.push(format(new Date(y2, m2, d)));
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  };

  const days1 = useMemo(() => daysForMonth(panelDate), [panelDate]);
  const days2 = useMemo(() => daysForMonth(nextPanelDate), [nextPanelDate]);

  const isInRange = (dateStr: string) => {
    if (!start || !end) return false;
    return dateStr >= start && dateStr <= end;
  };

  const todayStr = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return format(t);
  }, []);

  if (!visible) return null;

  return (
    <View
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <View
        className="w-full bg-white rounded-t-xl p-4"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <View className="text-base font-bold mb-3">选择日期</View>

        <View className="flex items-center justify-between mb-3">
          <View
            className="w-9 h-9 rounded-lg bg-app border border-solid border-border flex items-center justify-center"
            onClick={() =>
              setPanelDate(
                new Date(panelDate.getFullYear(), panelDate.getMonth() - 1, 1),
              )
            }
          >
            <Text>‹</Text>
          </View>
          <Text className="text-text1 font-medium">
            {monthLabel} /{" "}
            {`${nextPanelDate.getFullYear()}.${String(nextPanelDate.getMonth() + 1).padStart(2, "0")}`}
          </Text>
          <View
            className="w-9 h-9 rounded-lg bg-app border border-solid border-border flex items-center justify-center"
            onClick={() =>
              setPanelDate(
                new Date(panelDate.getFullYear(), panelDate.getMonth() + 1, 1),
              )
            }
          >
            <Text>›</Text>
          </View>
        </View>

        <View className="grid grid-cols-7 gap-1 mb-2 text-center text-text3 text-xs">
          <Text>日</Text>
          <Text>一</Text>
          <Text>二</Text>
          <Text>三</Text>
          <Text>四</Text>
          <Text>五</Text>
          <Text>六</Text>
        </View>

        <View className="grid grid-cols-1 gap-3">
          <View>
            <View className="grid grid-cols-7 gap-1 mb-1">
              {days1.map((d, idx) => {
                const isBlank = d === null;
                const isStart = !!d && d === start;
                const isEnd = !!d && d === end;
                const inRange = !!d && isInRange(d);
                const isPast = !!d && d < todayStr;
                const dayLabel = d ? String(new Date(d).getDate()) : "";
                const cellCls =
                  "h-9 rounded-lg flex items-center justify-center " +
                  (isBlank
                    ? ""
                    : isPast
                      ? "bg-white border border-solid border-border text-text3 opacity-40"
                      : isStart || isEnd
                        ? "bg-primary text-white"
                        : inRange
                          ? "bg-accentTint text-text1"
                          : "bg-white border border-solid border-border text-text1");
                return (
                  <View
                    key={idx}
                    className={isBlank ? "h-9" : cellCls}
                    onClick={() => {
                      if (!d || d < todayStr) return;
                      if (!start || (start && end)) {
                        setStart(d);
                        setEnd("");
                        onChange?.(d, "");
                      } else {
                        if (d < start) {
                          setStart(d);
                          setEnd("");
                          onChange?.(d, "");
                        } else {
                          setEnd(d);
                          onChange?.(start, d);
                        }
                      }
                    }}
                  >
                    {!isBlank && <Text>{dayLabel}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
          <View>
            <View className="grid grid-cols-7 gap-1">
              {days2.map((d, idx) => {
                const isBlank = d === null;
                const isStart = !!d && d === start;
                const isEnd = !!d && d === end;
                const inRange = !!d && isInRange(d);
                const isPast = !!d && d < todayStr;
                const dayLabel = d ? String(new Date(d).getDate()) : "";
                const cellCls =
                  "h-9 rounded-lg flex items-center justify-center " +
                  (isBlank
                    ? ""
                    : isPast
                      ? "bg-white border border-solid border-border text-text3 opacity-40"
                      : isStart || isEnd
                        ? "bg-primary text-white"
                        : inRange
                          ? "bg-accentTint text-text1"
                          : "bg-white border border-solid border-border text-text1");
                return (
                  <View
                    key={idx}
                    className={isBlank ? "h-9" : cellCls}
                    onClick={() => {
                      if (!d || d < todayStr) return;
                      if (!start || (start && end)) {
                        setStart(d);
                        setEnd("");
                        onChange?.(d, "");
                      } else {
                        if (d < start) {
                          setStart(d);
                          setEnd("");
                          onChange?.(d, "");
                        } else {
                          setEnd(d);
                          onChange?.(start, d);
                        }
                      }
                    }}
                  >
                    {!isBlank && <Text>{dayLabel}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className="text-center text-primary font-bold mb-3">
          共{nights}晚
        </View>

        <View className="flex items-center justify-between gap-3">
          <View
            className="flex-1 h-10 rounded-xl border border-solid border-border flex items-center justify-center text-text2"
            onClick={onClose}
          >
            取消
          </View>
          <View
            className="flex-1 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold"
            onClick={() => onConfirm(start, end)}
          >
            确定
          </View>
        </View>
      </View>
    </View>
  );
}
