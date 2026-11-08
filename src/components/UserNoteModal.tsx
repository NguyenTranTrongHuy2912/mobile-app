import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from './ScalePressable';

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
  const [noteText, setNoteText] = useState(currentNote);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setNoteText(currentNote);
      setShowEmojiPicker(false);
    }
  }, [visible, currentNote]);

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
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#050505" />
          </Pressable>
          <Text style={styles.headerTitle}>Ghi chú mới</Text>
          <Pressable
            onPress={handleShare}
            style={[styles.shareBtn, !noteText.trim() && styles.shareBtnDisabled]}
            disabled={!noteText.trim()}
          >
            <Text style={[styles.shareText, !noteText.trim() && styles.shareTextDisabled]}>
              Chia sẻ
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Bong bóng suy nghĩ (Thought Bubble) trên đầu Avatar */}
          <View style={styles.bubbleContainer}>
            <View style={styles.thoughtBubble}>
              <TextInput
                style={styles.thoughtInput}
                placeholder="Chia sẻ suy nghĩ..."
                placeholderTextColor="#8A8D91"
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
              <Ionicons name="musical-notes" size={22} color="#050505" />
            </ScalePressable>

            <ScalePressable
              style={styles.toolBtn}
              onPress={() => handleSelectEmoji('✨')}
              hitSlop={6}
            >
              <Text style={styles.gifText}>GIF</Text>
            </ScalePressable>

            <ScalePressable
              style={[styles.toolBtn, showEmojiPicker && styles.toolBtnActive]}
              onPress={() => setShowEmojiPicker((prev) => !prev)}
              hitSlop={6}
            >
              <Ionicons
                name={showEmojiPicker ? 'happy' : 'happy-outline'}
                size={22}
                color={showEmojiPicker ? '#4F46E5' : '#050505'}
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

          {/* Ghi chú thông báo phía dưới */}
          <View style={styles.footerNoteWrap}>
            <Text style={styles.footerNoteText}>
              Bạn bè có thể xem ghi chú của bạn trong 24 giờ.{' '}
              <Text style={styles.changeLink}>Thay đổi</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#050505',
  },
  shareBtn: {
    backgroundColor: '#4F46E5', // Indigo hiện đại, khác biệt Messenger
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  shareBtnDisabled: {
    backgroundColor: '#E4E6EB',
  },
  shareText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  shareTextDisabled: {
    color: '#8A8D91',
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
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
    color: '#050505',
    flex: 1,
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#8A8D91',
    marginLeft: 6,
  },
  bubbleTailDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
    marginTop: -2,
    marginRight: 24,
  },
  bubbleTailDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#E4E6EB',
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
    backgroundColor: '#EEF2FF',
    borderWidth: 3,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4F46E5',
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
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  gifText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#050505',
  },
  moodPickerContainer: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center',
  },
  moodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#65676B',
    textAlign: 'center',
    lineHeight: 18,
  },
  changeLink: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
