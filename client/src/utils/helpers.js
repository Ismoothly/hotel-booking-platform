import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

/**
 * 格式化日期
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

/**
 * 获取日期范围
 */
export const getDateRange = (startDate, nights) => {
  const start = dayjs(startDate);
  const end = start.add(nights, 'day');
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD')
  };
};

/**
 * 计算入住天数
 */
export const calculateNights = (checkIn, checkOut) => {
  return dayjs(checkOut).diff(dayjs(checkIn), 'day');
};

/**
 * 格式化价格
 */
export const formatPrice = (price) => {
  return `¥${price}`;
};

/**
 * 获取星级显示
 */
export const getStarRating = (rating) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

/**
 * 防抖函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
