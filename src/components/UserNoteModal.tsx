import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import ScalePressable from './ScalePressable';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

interface UserNoteModalProps {
  visible: boolean;
  currentNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
  userInitial?: string;
}

const EMOJI_MOODS = ['😊', '☕', '🔥', '🎧', '💪', '😴', '📚', '🎉', '🌟', '🚀'];

/**
 * Modal "Ghi chú mới" (Thought Note):
 * Cho phép người dùng viết suy nghĩ ngắn và chọn biểu tượng cảm xúc (emoji/mood),
 * hiển thị trong bong bóng suy nghĩ trên avatar ở hàng bạn bè.
 */
export default function UserNoteModal({
  visible,
  currentNote,
  onClose,
  onSave,
  userInitial = 'U',
}: UserNoteModalProps) {
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [noteText, setNoteText] = useState(currentNote);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setNoteText(currentNote);
      setShowEmojiPicker(false);
    }
  }, [visible, currentNote]);

  const canShare = noteText.trim().length > 0;

  const handleShare = () => {
    onSave(noteText.trim());
    onClose();
  };

  const handleSelectEmoji = (emoji: string) => {
    setNoteText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${emoji}` : emoji;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View onPress={onClose} style={styles.closeBtn} role="button" aria-label="Đóng">
            <Ionicons name="close" size={26} color={C.ink} />
          </View>
          <Text style={styles.headerTitle}>Ghi chú mới</Text>
          <View
            onPress={canShare ? handleShare : undefined}
            style={{ ...styles.shareBtn, ...(canShare ? null : styles.shareBtnDisabled) }}
            role="button"
          >
            <Text style={{ ...styles.shareText, ...(canShare ? null : styles.shareTextDisabled) }}>
              Chia sẻ
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Bong bóng suy nghĩ (Thought Bubble) trên đầu Avatar */}
          <View style={styles.bubbleContainer}>
            <View style={styles.thoughtBubble}>
              <TextInput
                style={styles.thoughtInput}
                placeholder="Chia sẻ suy nghĩ..."
                placeholderTextColor={C.muted}
                value={noteText}
                onChangeText={setNoteText}
                maxLength={60}
                autoFocus
                multiline={false}
              />
              <Text style={styles.charCount}>{noteText.length}/60</Text>
            </View>
            {/* Đuôi bong bóng suy nghĩ (2 chấm tròn nhỏ nối vào avatar) */}
            <View style={styles.bubbleTailDotLarge} />
            <View style={styles.bubbleTailDotSmall} />
          </View>

          {/* Avatar người dùng */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial.toUpperCase()}</Text>
            </View>
          </View>

          {/* Quick Action Icons dưới Avatar: Nhạc, GIF, Biểu tượng cảm xúc */}
          <View style={styles.quickToolsRow}>
            <ScalePressable
              style={styles.toolBtn}
              onPress={() => handleSelectEmoji('🎵')}
              hitSlop={6}
            >
              <Ionicons name="musical-notes" size={22} color={C.ink} />
            </ScalePressable>

            <ScalePressable
              style={styles.toolBtn}
              onPress={() => handleSelectEmoji('✨')}
              hitSlop={6}
            >
              <Text style={styles.gifText}>GIF</Text>
            </ScalePressable>

            <ScalePressable
              style={{ ...styles.toolBtn, ...(showEmojiPicker ? styles.toolBtnActive : null) }}
              onPress={() => setShowEmojiPicker((prev) => !prev)}
              hitSlop={6}
            >
              <Ionicons
                name={showEmojiPicker ? 'happy' : 'happy-outline'}
                size={22}
                color={showEmojiPicker ? styles.accentText.color : C.ink}
              />
            </ScalePressable>
          </View>

          {/* Bảng chọn cảm xúc nhanh */}
          {showEmojiPicker && (
            <View style={styles.moodPickerContainer}>
              <Text style={styles.moodTitle}>Chọn tâm trạng hôm nay:</Text>
              <View style={styles.moodGrid}>
                {EMOJI_MOODS.map((emoji) => (
                  <ScalePressable
                    key={emoji}
                    style={styles.moodItem}
                    onPress={() => handleSelectEmoji(emoji)}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                  </ScalePressable>
                ))}
              </View>
            </View>
          )}

          {/* Ghi chú thông báo phía dưới & Xóa ghi chú */}
          <View style={styles.footerNoteWrap}>
            <RNText style={styles.footerNoteText}>
              Chỉ những người đã kết bạn mới có thể xem ghi chú của bạn trong 24 giờ.
            </RNText>
            {currentNote ? (
              <ScalePressable
                onPress={() => {
                  onSave('');
                  onClose();
                }}
                style={{ marginTop: 10, paddingVertical: 6, paddingHorizontal: 14 }}
              >
                <Text style={{ color: '#E53E3E', fontSize: 13, fontWeight: '600' }}>
                  Xóa ghi chú hiện tại
                </Text>
              </ScalePressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const INDIGO = '#4F46E5';

const makeStyles = (C: ScreenColors) => {
  const accent = C.isDark ? '#818CF8' : INDIGO;
  const accentSoft = C.isDark ? '#25284F' : '#EEF2FF';
  const pickerBg = C.isDark ? C.card : '#F8FAFC';
  const pickerBorder = C.isDark ? C.line : '#E2E8F0';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.page,
    },
    header: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    closeBtn: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: C.ink,
    },
    shareBtn: {
      backgroundColor: INDIGO, // Indigo hiện đại, khác biệt Messenger
      paddingVertical: 7,
      paddingHorizontal: 16,
      borderRadius: 18,
    },
    shareBtnDisabled: {
      backgroundColor: C.chip,
    },
    shareText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    shareTextDisabled: {
      color: C.muted,
    },
    content: {
      paddingTop: 36,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    bubbleContainer: {
      alignItems: 'center',
      marginBottom: 4,
    },
    thoughtBubble: {
      backgroundColor: C.card,
      borderWidth: 1.5,
      borderColor: C.line,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      minWidth: 180,
      maxWidth: 280,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    thoughtInput: {
      fontSize: 15,
      color: C.ink,
      flex: 1,
      paddingVertical: 0,
    },
    charCount: {
      fontSize: 11,
      color: C.muted,
      marginLeft: 6,
    },
    bubbleTailDotLarge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.card,
      borderWidth: 1.5,
      borderColor: C.line,
      marginTop: -2,
      marginRight: 24,
    },
    bubbleTailDotSmall: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: C.card,
      borderWidth: 1.2,
      borderColor: C.line,
      marginTop: 2,
      marginRight: 32,
    },
    avatarWrap: {
      marginVertical: 12,
    },
    avatarCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: accentSoft,
      borderWidth: 3,
      borderColor: INDIGO,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 34,
      fontWeight: '700',
      color: accent,
    },
    accentText: {
      color: accent,
    },
    quickToolsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 18,
    },
    toolBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolBtnActive: {
      backgroundColor: accentSoft,
      borderWidth: 1.5,
      borderColor: INDIGO,
    },
    gifText: {
      fontSize: 12,
      fontWeight: '800',
      color: C.ink,
    },
    moodPickerContainer: {
      marginTop: 20,
      backgroundColor: pickerBg,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: pickerBorder,
      width: '100%',
      alignItems: 'center',
    },
    moodTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: C.muted,
      marginBottom: 10,
    },
    moodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
    },
    moodItem: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: C.isDark ? C.inputBg : '#fff',
      borderWidth: 1,
      borderColor: pickerBorder,
    },
    moodEmoji: {
      fontSize: 22,
    },
    footerNoteWrap: {
      marginTop: 40,
      paddingHorizontal: 20,
    },
    footerNoteText: {
      fontSize: 13,
      color: C.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
    changeLink: {
      color: accent,
      fontWeight: '600',
    },
  });
};
