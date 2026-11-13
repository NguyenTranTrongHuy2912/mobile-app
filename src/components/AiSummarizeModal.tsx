import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <Modal visible={visible} transparent animationType="slide">
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
              <Ionicons name="close" size={22} color="#65676B" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#0084FF" />
                <Text style={styles.loadingText}>
                  HQ AI đang phân tích nội dung cuộc trò chuyện...
                </Text>
              </View>
            ) : (
              <View>
                <View style={styles.metaRow}>
                  <View style={styles.badge}>
                    <Ionicons name="chatbubbles-outline" size={12} color="#0064D1" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>{totalMessages} tin nhắn gần nhất</Text>
                  </View>
                  <View style={styles.badgeModel}>
                    <Ionicons name="hardware-chip-outline" size={12} color="#2e7d32" style={{ marginRight: 4 }} />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E4E6EB',
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
    backgroundColor: '#0084FF',
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
    color: '#050505',
  },
  headerSub: {
    fontSize: 12,
    color: '#65676B',
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
    color: '#65676B',
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
    backgroundColor: '#E7F3FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0064D1',
  },
  badgeModel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeModelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2e7d32',
  },
  summaryBox: {
    backgroundColor: '#F0F2F5',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0084FF',
  },
  summaryText: {
    fontSize: 14,
    color: '#050505',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  doneBtn: {
    backgroundColor: '#0084FF',
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
