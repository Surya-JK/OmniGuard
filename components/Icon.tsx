import { Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// SVG icons for web - each is a complete SVG as a data URI
const WEB_ICONS: Record<string, string> = {
  'shield-checkmark': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32L48 128v128c0 117.4 86.6 218.4 208 234.7C377.4 474.4 464 373.4 464 256V128L256 32zm-48 244l-64-64 22.6-22.6L208 231l118-118 22.6 22.6L208 276z" fill="COLOR"/></svg>`,
  'shield-half': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32L48 128v128c0 117.4 86.6 218.4 208 234.7V32z" fill="COLOR"/><path d="M256 362.7C377.4 346.4 464 245.4 464 128L256 32v330.7z" fill="COLOR" opacity="0.5"/></svg>`,
  'log-out-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M304 336v40a40 40 0 01-40 40H104a40 40 0 01-40-40V136a40 40 0 0140-40h160a40 40 0 0140 40v40"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M368 336l80-80-80-80M176 256h256"/></svg>`,
  'document-text-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linejoin="round" stroke-width="32" d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48v160h160M176 288h160M176 368h160"/></svg>`,
  'server-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="48" y="48" width="416" height="128" rx="48" ry="48" fill="none" stroke="COLOR" stroke-linejoin="round" stroke-width="32"/><rect x="48" y="336" width="416" height="128" rx="48" ry="48" fill="none" stroke="COLOR" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M48 176v160M464 176v160"/><circle cx="144" cy="112" r="16" fill="COLOR"/><circle cx="144" cy="400" r="16" fill="COLOR"/></svg>`,
  'bulb': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 64C149.9 64 64 149.9 64 256c0 56.2 22.3 107.1 58.5 144.5L136 432v16a24 24 0 0024 24h192a24 24 0 0024-24v-16l13.5-31.5C425.7 363.1 448 312.2 448 256c0-106.1-85.9-192-192-192z" fill="COLOR"/><path d="M208 480h96v16H208z" fill="COLOR"/></svg>`,
  'scan-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="208" fill="none" stroke="COLOR" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M176 160h-48v48M336 160h48v48M176 352h-48v-48M336 352h48v-48M256 208v96M208 256h96"/></svg>`,
  'chatbubble-ellipses': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.4-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4C169.1 434.8 212.4 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32z" fill="COLOR"/></svg>`,
  'receipt': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M476 3.2L324.3 72.1 239.3 0 154.4 72.1 2.7 3.2C1.1 2.5 0 3.7 0 5.5v496c0 1.8 1.1 3 2.7 2.3l151.7-68.9 85 72.1 85-72.1 151.7 68.9c1.6.7 2.7-.5 2.7-2.3V5.5c.1-1.8-1-3-2.8-2.3zM352 368H160v-32h192zm0-64H160v-32h192zm0-64H160v-32h192zm0-64H160v-32h192z" fill="COLOR"/></svg>`,
  'link': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M200.66 352H144a96 96 0 010-192h55.41M312.59 160H368a96 96 0 010 192h-56.66M160 256h192"/></svg>`,
  'arrow-forward': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M268 112l144 144-144 144M392 256H100"/></svg>`,
  'arrow-back': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg>`,
  'chevron-back': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/></svg>`,
  'send': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M476.6 6.1L35.3 233.7c-14.5 7.4-12.6 29 3 33.9l74.1 23.6 222.6-200.6c3.8-3.4 9.4 1.8 6.3 6L145 337.1v83.8c0 17.5 21.7 24.8 31.7 10.4l51.4-72.9 100.6 32c14.3 4.6 29.3-4.5 31.4-19.3L508 33.3C511 18.7 494.2 5.9 476.6 6.1z" fill="COLOR"/></svg>`,
  'add': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M256 112v288M112 256h288"/></svg>`,
  'trash-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"/><path stroke="COLOR" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224"/></svg>`,
  'create-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"/></svg>`,
  'chatbubble-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M87.48 192c.17-57.86 48.49-96 112.52-96h224c64.42 0 112 38.14 112 96v96c0 57.86-47.58 96-112 96H200L100 480l13.48-96H87.48C23.06 384 0 345.86 0 288v-96z"/></svg>`,
  'warning': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M449.07 399.08L278.64 82.08a32 32 0 00-55.9.76L48 384l.4.67A31.94 31.94 0 0080 416h352a32 32 0 0017.07-16.92zM240 204a20 20 0 0140 0l-8 96h-24zM256 384a24 24 0 1124-24 24 24 0 01-24 24z" fill="COLOR"/></svg>`,
  'terminal': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M112 168l80 88-80 88M208 352h96"/><rect x="48" y="80" width="416" height="352" rx="48" ry="48" fill="none" stroke="COLOR" stroke-linejoin="round" stroke-width="32"/></svg>`,
  'mail': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="48" y="96" width="416" height="320" rx="40" ry="40" fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M112 160l144 112 144-112"/></svg>`,
  'lock-closed': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 01128 0z" fill="COLOR"/></svg>`,
  'eye': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="64" fill="COLOR"/><path d="M490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96c-42.52 0-84.33 12.15-124.27 36.11C90.66 158.26 58.2 191.37 32.29 234.46a32.35 32.35 0 000 32.95C54.77 305 88.31 337.05 131.1 362.78c42.49 26.13 90.43 40.06 140.56 41.1A32.35 32.35 0 00256 416a225.62 225.62 0 01-59.41-8.41zM256 336a80 80 0 1180-80 80.09 80.09 0 01-80 80z" fill="COLOR"/></svg>`,
  'eye-off': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M432 448a15.92 15.92 0 01-11.31-4.69l-352-352a16 16 0 0122.62-22.62l352 352A16 16 0 01432 448zM248 315.85l-51.79-51.79a2 2 0 00-3.39 1.69 64.11 64.11 0 0053.49 53.49 2 2 0 001.69-3.39zm16-119.7L315.87 248a2 2 0 003.4-1.69 64.13 64.13 0 00-53.55-53.55 2 2 0 00-1.72 3.39zM491 273.36a32.2 32.2 0 00-.1-34.76c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 00-74.89 12.83 4 4 0 00-1.48 6.55l47.65 47.65A112.15 112.15 0 01256 160a96 96 0 0196 96 108.12 108.12 0 01-3.2 24.78l60.44 60.44a4 4 0 006-.81c8.93-13.55 16.19-28.01 21.33-43.05zM256 352a96 96 0 01-92.47-121.88 4 4 0 00-1.05-3.81l-56.1-56.1a4 4 0 00-6.48 1.49C88 199.48 66 226.37 48.4 256a32 32 0 000 32C68.76 322.28 104 361.64 148 387.35c42.52 24.25 89.44 38.16 140.39 39.7a4 4 0 003-1.19l-31.89-31.89A96.14 96.14 0 01256 352z" fill="COLOR"/></svg>`,
  'logo-google': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M473.16 221.48l-2.26-9.59H262.46v88.22H387c-12.93 61.4-72.93 93.72-121.94 93.72-35.66 0-73.25-15-98.13-39.11a140.08 140.08 0 01-41.8-98.88c0-37.16 16.7-74.33 41-98.78s61-38.13 97.49-38.13c41.79 0 71.74 22.19 82.94 32.31l62.69-62.36C390.86 72.72 340.34 32 261.6 32c-60.75 0-119 23.27-161.58 65.71C58 139.5 36.25 199.93 36.25 256s20.58 113.48 61.3 155.6c43.51 44.92 105.13 68.4 168.58 68.4 57.73 0 112.2-22.88 151.49-63.92 38.44-40.23 60.6-101.56 60.6-165.56-.01-12.26-.69-24.26-4.06-29.04z" fill="COLOR"/></svg>`,
  'diamond': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M494.07 208L366.5 68a31.8 31.8 0 00-24.19-12H169.69a31.8 31.8 0 00-24.19 12L18.07 208a32.22 32.22 0 00.44 43.24l221.6 243.68a21.37 21.37 0 0031.78 0l221.6-243.68A32.21 32.21 0 00494.07 208z" fill="COLOR"/></svg>`,
  'sparkles': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M208 512a24.84 24.84 0 01-23.34-16l-39.84-103.6a16.06 16.06 0 00-9.19-9.19L32 343.34a25 25 0 010-46.67l103.6-39.84a16.06 16.06 0 009.19-9.19L184.66 144a25 25 0 0146.67 0l39.84 103.6a16.06 16.06 0 009.19 9.19L383.76 296a24.49 24.49 0 0116.24 23A24.86 24.86 0 01383.76 342.66l-103.6 39.84a16.06 16.06 0 00-9.19 9.19L231.34 496A24.84 24.84 0 01208 512zM400 160a16 16 0 01-15-10.34L370 115.07a7.93 7.93 0 00-4.64-4.64l-34.57-14.94a16 16 0 010-29.9l34.57-14.94a7.93 7.93 0 004.64-4.64L385 16a16 16 0 0130 0l14.93 34.95a7.93 7.93 0 004.64 4.64L469.57 70a16 16 0 010 29.9l-34.57 14.94a7.93 7.93 0 00-4.64 4.64L416 154.67A16 16 0 01400 160z" fill="COLOR"/></svg>`,
  'checkmark-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 0123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z" fill="COLOR"/></svg>`,
  'globe-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="192" fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 64c-63.1 101.9-63.1 288.1 0 384M256 64c63.1 101.9 63.1 288.1 0 384M64 256h384"/></svg>`,
  'phone-portrait-outline': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="128" y="16" width="256" height="480" rx="48" ry="48" fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path fill="none" stroke="COLOR" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M176 16h160"/></svg>`,
};

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: string;
  style?: any;
}

function toDataUri(svgTemplate: string, color: string): string {
  // Escape the color for use in the SVG (handle # prefix)
  const safeColor = color.startsWith('#') ? encodeURIComponent(color) : color;
  const filled = svgTemplate.replace(/COLOR/g, color);
  const encoded = encodeURIComponent(filled);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  if (Platform.OS !== 'web') {
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  const svgTemplate = WEB_ICONS[name as string];
  if (!svgTemplate) {
    // Fallback for any unmapped icon - render nothing rather than broken square
    return (
      <Image
        source={{ uri: toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>`, color) }}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  return (
    <Image
      source={{ uri: toDataUri(svgTemplate, color) }}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
