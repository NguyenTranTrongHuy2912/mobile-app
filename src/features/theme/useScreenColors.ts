import { useMemo } from 'react';
import { useTheme } from 'tamagui';
import { useAppSelector } from '../../store/hooks';

// Bảng màu dùng chung cho các màn hình
export type ScreenColors = {
  isDark: boolean;
  page: string; // nền trang dạng danh sách (sáng: trắng, tối: đen)
  screen: string; // nền màn hình dạng thẻ (thẻ nổi lên trên nền này)
  card: string; // thẻ, bong bóng người khác, thanh nhập, header
  ink: string; // chữ chính
  muted: string; // chữ phụ, icon phụ
  line: string; // đường kẻ, viền
  brand: string; // màu nhấn
  brandSoft: string; // nền nhạt của màu nhấn (nút, pill đang chọn)
  brandSoftText: string; // chữ trên nền brandSoft
  danger: string;
  dangerSoft: string;
  success: string;
  inputBg: string; // ô nhập, nút tròn nhạt
  chip: string; // nút nhỏ nền xám
};

const themeValue = (v: { val?: unknown } | undefined, fallback: string): string =>
  typeof v?.val === 'string' ? v.val : fallback;

export function useScreenColors(): ScreenColors {
  const isDark = useAppSelector((s) => s.theme.isDark);
  const theme = useTheme();
  const bg = themeValue(theme.background, isDark ? '#18191A' : '#FFFFFF');
  const surface = themeValue(theme.surface, isDark ? '#242526' : '#F5F7FA');
  const ink = themeValue(theme.ink, isDark ? '#E4E6EB' : '#050505');
  const muted = themeValue(theme.muted, isDark ? '#B0B3B8' : '#65676B');
  const line = themeValue(theme.line, isDark ? '#3E4042' : '#CED0D4');
  const brand = themeValue(theme.brand, '#2F6BFF');
  const danger = themeValue(theme.danger, isDark ? '#FA383E' : '#E41E3F');

  return useMemo<ScreenColors>(
    () => ({
      isDark,
      page: bg,
      // Sáng: nền xám nhạt + thẻ trắng. Tối: nền đen + thẻ xám đậm
      screen: isDark ? bg : surface,
      card: isDark ? surface : bg,
      ink,
      muted,
      line,
      brand,
      brandSoft: isDark ? '#1E2A4A' : '#E6EEFF',
      brandSoftText: isDark ? '#8AB0FF' : brand,
      danger,
      dangerSoft: isDark ? '#3A1F24' : '#FFEBEE',
      success: '#31A24C',
      inputBg: isDark ? '#3A3B3C' : '#F0F2F5',
      chip: isDark ? '#3A3B3C' : '#E4E6EB',
    }),
    [isDark, bg, surface, ink, muted, line, brand, danger],
  );
}
