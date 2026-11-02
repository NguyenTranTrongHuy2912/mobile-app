import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export default function AppLogo({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* userSpaceOnUse để bong bóng và đuôi dùng chung một dải màu, không bị đường nối */}
        <LinearGradient id="logoBg" gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="76" y2="100">
          <Stop offset="0" stopColor="#5CF2FF" />
          <Stop offset="0.5" stopColor="#2EA8FF" />
          <Stop offset="1" stopColor="#2F5BFF" />
        </LinearGradient>
      </Defs>

      {/* Thân bong bóng */}
      <Circle cx="54" cy="46" r="42" fill="url(#logoBg)" />
      {/* Đuôi bong bóng ở góc dưới bên trái */}
      <Path d="M18 68 Q18 86 6 96 Q30 94 46 84 Z" fill="url(#logoBg)" />

      {/* Mắt trái */}
      <Circle cx="40" cy="40" r="4.5" fill="#0B1B3F" />
      {/* Mắt phải nháy (một nét cong) */}
      <Path
        d="M59 41 Q65 34 71 41"
        stroke="#0B1B3F"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Miệng cười */}
      <Path
        d="M34 56 Q54 76 74 56"
        stroke="#0B1B3F"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}