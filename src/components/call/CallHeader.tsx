import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useScreenColors } from '../../features/theme/useScreenColors';

interface CallHeaderProps {
  isGroup: boolean;
  isVideo: boolean;
}

export function CallHeader({ isGroup, isVideo }: CallHeaderProps) {
  const colors = useScreenColors();

  const label = isGroup
    ? isVideo
      ? 'GỌI VIDEO NHÓM'
      : 'GỌI THOẠI NHÓM'
    : isVideo
    ? 'CUỘC GỌI VIDEO 2 CHIỀU'
    : 'CUỘC GỌI THOẠI 2 CHIỀU';

  return (
    <View style={styles.header} pointerEvents="none">
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={13} color={colors.success} />
        <Text style={styles.securityText}>Mã hóa WebRTC · STUN Google</Text>
      </View>
      <Text style={styles.callTypeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 36 : 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  securityText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  callTypeLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
