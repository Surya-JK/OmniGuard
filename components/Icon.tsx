import { Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  // On mobile, always use native Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  // On web: show text for logout and back buttons, nothing for everything else
  const nameStr = name as string;

  if (nameStr === 'log-out-outline') {
    return (
      <Text style={[{ color, fontSize: size * 0.6, fontWeight: '600' }, style]}>
        Leave
      </Text>
    );
  }

  if (nameStr === 'arrow-back' || nameStr === 'chevron-back') {
    return (
      <Text style={[{ color, fontSize: size * 0.75, fontWeight: '600' }, style]}>
        ← Back
      </Text>
    );
  }

  // All other icons: render nothing on web
  return null;
}
