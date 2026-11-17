import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import ScalePressable from './ScalePressable';

interface AiSummarizeModalProps {
  visible: boolean;
  onClose: () => void;
  isLoading: boolean;
  roomName: string;
  summary: string;
  totalMessages: number;
}

/**
 * Modal hiển thị bản tóm tắt cuộc trò chuyện nhóm từ AI
 * Đáp ứng tiêu chí "AI basic" chuẩn trải nghiệm người dùng.
 */
export default function AiSummarizeModal({
  visible,
  onClose,
  isLoading,
  roomName,
  summary,
  totalMessages,
}: AiSummarizeModalProps) {
  const colors = useScreenColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>HQ AI Tóm tắt cuộc trò chuyện</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  Phòng: {roomName}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={styles.loadingText}>
                  HQ AI đang phân tích nội dung cuộc trò chuyện...
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.metaRow}>
                  <View style={styles.badge}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={12}
                      color={colors.brandSoftText}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.badgeText}>{totalMessages} tin nhắn gần nhất</Text>
                  </View>
                  <View style={styles.badgeModel}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={12}
                      color={colors.success}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.badgeModelText}>Google Gemini 1.5</Text>
                  </View>
                </View>

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryText}>{summary}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <ScalePressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Đã hiểu</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ScreenColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '75%',
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
    },
    headerSub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 1,
    },
    closeBtn: {
      padding: 4,
      marginLeft: 8,
    },
    body: {
      paddingHorizontal: 16,
    },
    bodyContent: {
      paddingVertical: 16,
    },
    loadingWrap: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 14,
      textAlign: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.brandSoft,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.brandSoftText,
    },
    badgeModel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.isDark ? 'rgba(49, 162, 76, 0.18)' : '#E8F5E9',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    badgeModelText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.success,
    },
    summaryBox: {
      backgroundColor: colors.inputBg,
      padding: 14,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.brand,
    },
    summaryText: {
      fontSize: 14,
      color: colors.ink,
      lineHeight: 22,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    doneBtn: {
      backgroundColor: colors.brand,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    doneBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });