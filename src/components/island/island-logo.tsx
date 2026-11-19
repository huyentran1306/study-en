// Logo Đảo Tám Chuyện: chú shiba Bơ thò đầu từ hòn đảo nhỏ có cây dừa (cùng nét vẽ với nhân vật trong game).
// Bản SVG này cũng được lưu ở public/island-icon.svg để làm icon tab trình duyệt.
const O = "#4A3222";

export function IslandLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label="Đảo Tám Chuyện">
      <defs>
        <clipPath id="cci-logo-clip">
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>
      <g clipPath="url(#cci-logo-clip)">
        <rect width="64" height="64" fill="#CFEAF4" />
        <circle cx="14" cy="15" r="5.5" fill="#FFE39A" />
        <path d="M0 47 Q8 44 16 47 T32 47 T48 47 T64 47 V64 H0 Z" fill="#8FD0E3" />
        {/* Cây dừa */}
        <path d="M47 47 C48.5 38 48 30 45 23" fill="none" stroke="#A86A4A" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M45 23 C38 17 29 18 26 25 C32 22 38 23 45 23 Z" fill="#5E9B4C" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M45 23 C42 15 36 11 31 12 C36 15 41 18 45 23 Z" fill="#6FAE4F" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M45 23 C47 14 53 10 58 11 C53 14 49 18 45 23 Z" fill="#6FAE4F" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M45 23 C51 17 59 18 61 24 C56 21 50 22 45 23 Z" fill="#5E9B4C" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="43.6" cy="25.2" r="1.9" fill="#8B5E3C" stroke={O} strokeWidth="0.8" />
        <circle cx="47" cy="25.6" r="1.9" fill="#8B5E3C" stroke={O} strokeWidth="0.8" />
        {/* Bơ */}
        <path d="M17 26 L19.5 16 L25 23 Z" fill="#E9A15B" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M37 26 L34.5 16 L29 23 Z" fill="#E9A15B" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M19.5 19 L20.6 23.5 L23 22 Z" fill="#F7C7A0" />
        <circle cx="27" cy="34" r="12" fill="#E9A15B" stroke={O} strokeWidth="2" />
        <ellipse cx="27" cy="39" rx="8.5" ry="6.5" fill="#FFF4E2" />
        <circle cx="22.5" cy="33" r="1.7" fill={O} />
        <circle cx="31.5" cy="33" r="1.7" fill={O} />
        <circle cx="23" cy="32.4" r="0.55" fill="#fff" />
        <circle cx="32" cy="32.4" r="0.55" fill="#fff" />
        <ellipse cx="27" cy="36.4" rx="1.6" ry="1.1" fill={O} />
        <path d="M24.8 38.4 Q27 40.4 29.2 38.4" fill="none" stroke={O} strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="19.5" cy="37" rx="2.2" ry="1.3" fill="#F48FA0" opacity=".7" />
        <ellipse cx="34.5" cy="37" rx="2.2" ry="1.3" fill="#F48FA0" opacity=".7" />
        <path d="M27 22 C27 19 28.5 17 31 16.5 C30.5 19 29 21 27 22 Z" fill="#6FAE4F" stroke={O} strokeWidth="1.3" strokeLinejoin="round" />
        {/* Đảo */}
        <ellipse cx="32" cy="50" rx="26" ry="7.5" fill="#F4DFAA" stroke={O} strokeWidth="2" />
        <path d="M10 47.5 Q32 41 54 47.5 Q32 51 10 47.5 Z" fill="#9CCB6A" stroke={O} strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="19" cy="46" r="1.3" fill="#F48FA0" />
        <circle cx="24" cy="44.9" r="1.1" fill="#F2C14E" />
        <circle cx="38" cy="44.9" r="1.2" fill="#FFFFFF" />
        <circle cx="44" cy="46" r="1.1" fill="#F48FA0" />
      </g>
      <circle cx="32" cy="32" r="29" fill="none" stroke={O} strokeWidth="3" />
    </svg>
  );
}
