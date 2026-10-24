// Curated selection of avatar emojis strictly for profile avatar representation
// No basic people emojis (e.g. 👩, 🧔, 👧, 👦, 👵, 👴, 👶) per design specification

export const CHRISTMAS_WINTER_AVATARS = [
  '🎁', '🎄', '🎅', '🤶', '⛄', '❄️', '🦌', '🌟',
  '🔔', '🕯️', '🍪', '🧦', '✨', '🐻', '🦊', '🐶',
];

export const CHRISTMAS_AUSSIE_AVATARS = [
  '🏖️', '☀️', '🏄', '🌊', '🩴', '🦘', '🐨', '🎁',
  '🎄', '🍦', '🍉', '🦐', '🕶️', '🍹', '🌴', '🍍',
];

export const HALLOWEEN_AVATARS = [
  '🎃', '👻', '🦇', '🕷️', '🧙', '🍬', '🕯️', '🐈‍⬛',
  '🦉', '🔮', '✨', '💀', '🌕', '🐺', '🦊', '🐻',
];

export const VALENTINE_AVATARS = [
  '💖', '💝', '🌹', '💌', '🍫', '🧸', '🕊️', '✨',
  '🍓', '🍰', '🧁', '👑', '🐶', '🐱', '🦊', '🐻',
];

export const BASE_AVATARS = [
  // Animals & Creatures
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯',
  '🦄', '🐙', '🦉', '🐧', '🐸', '🐢', '🦋', '🐝',
  '🦖', '🐬', '🦔', '🦥',
  
  // Festive & Celebrations
  '🎁', '🎄', '🎅', '⛄', '❄️', '🎃', '👻', '✨',
  '⭐', '🎉', '🎈', '🎆', '🕯️', '🔔',
  
  // Aussie & Summer
  '🏖️', '☀️', '🏄', '🌊', '🩴', '🦘', '🦐',
  
  // Treats, Food & Drinks
  '☕', '🍪', '🧁', '🍕', '🍔', '🍦', '🍩', '🍓',
  '🥑', '🍿', '🥞', '🌮',
  
  // Hobbies, Fantasy & Play
  '🚀', '🎨', '📚', '🎮', '🎸', '🎧', '⚽', '🏀',
  '💎', '👑', '🪄', '🚲', '📷', '🧩',
];

// Deduplicated master list for fallback compatibility
export const AVATAR_OPTIONS = Array.from(new Set([
  ...CHRISTMAS_WINTER_AVATARS,
  ...CHRISTMAS_AUSSIE_AVATARS,
  ...HALLOWEEN_AVATARS,
  ...VALENTINE_AVATARS,
  ...BASE_AVATARS,
]));

/**
 * Returns prioritized theme-aware avatar array for selection
 */
export function getThemeAvatars(themeId = 'christmas_duo', seasonalAtmosphere = 'snow') {
  let primaryList = [];

  if (themeId === 'christmas_duo' || themeId === 'christmas') {
    primaryList = seasonalAtmosphere === 'sun'
      ? CHRISTMAS_AUSSIE_AVATARS
      : CHRISTMAS_WINTER_AVATARS;
  } else if (themeId === 'halloween') {
    primaryList = HALLOWEEN_AVATARS;
  } else if (themeId === 'valentine') {
    primaryList = VALENTINE_AVATARS;
  }

  // Deduplicate and place theme-specific avatars first
  return Array.from(new Set([...primaryList, ...AVATAR_OPTIONS]));
}

/**
 * Returns the theme-aware default avatar emoji
 */
export function getDefaultAvatar(themeId = 'christmas_duo', seasonalAtmosphere = 'snow') {
  if (themeId === 'christmas_duo' || themeId === 'christmas') {
    return seasonalAtmosphere === 'sun' ? '🏖️' : '🎁';
  }
  if (themeId === 'halloween') return '🎃';
  if (themeId === 'valentine') return '💖';
  return '🎁';
}
