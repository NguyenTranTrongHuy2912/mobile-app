import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Text, View } from 'tamagui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAskAiMutation } from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import AiMessageBubble from '../components/AiMessageBubble';
import AiQuickPromptList from '../components/AiQuickPromptList';
import ScalePressable from '../components/ScalePressable';

interface ChatMessageItem {
  id: string;
  content: string;
  isAi: boolean;
  modelName?: string;
}

const INITIAL_MESSAGES: ChatMessageItem[] = [
  {
    id: 'ai-welcome',
    content:
      'Xin chào! Tôi là **HQ AI** 🤖✨ — Trợ lý thông minh trong ứng dụng ChatApp.\n\n' +
      'Tôi có thể hỗ trợ bạn:\n' +
      '• 💡 **Đời sống & Ý tưởng:** Lên thực đơn món ngon, lịch trình du lịch, lời chúc ý nghĩa.\n' +
      '• 🎓 **Học tập & Kiến thức:** Giải đáp khoa học, lịch sử, ngoại ngữ và kỹ năng hữu ích.\n' +
      '• 🧮 **Tính toán & Tiện ích:** Tính phần trăm, chia tiền nhóm, đổi đơn vị nhanh chóng.\n' +
      '• ✍️ **Soạn thảo & Dịch thuật:** Soạn thảo văn bản lịch sự, dịch câu từ tự nhiên.\n\n' +
      'Hãy nhắn câu hỏi bất kỳ hoặc chạm vào gợi ý bên dưới để bắt đầu nhé!',
    isAi: true,
    modelName: 'HQ AI',
  },
];

/**
 * Màn hình Trợ lý ảo HQ AI (Huy & Quốc AI)
 * Hỗ trợ Multi-turn Conversation & Lưu lịch sử AsyncStorage
 */
export default function AiAssistantScreen() {
  const colors = useScreenColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const myId = useAppSelector((s) => s.session.userId) || 'guest';
  const STORAGE_KEY = `@hq_ai_chat_history_${myId}`;

  const [messages, setMessages] = useState<ChatMessageItem[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [askAi, { isLoading }] = useAskAiMutation();

  const listRef = useRef<FlatList<ChatMessageItem>>(null);

  // 1. Nạp lịch sử cuộc trò chuyện từ AsyncStorage khi mở màn hình
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [STORAGE_KEY]);

  // 2. Lưu tin nhắn vào AsyncStorage
  const updateAndSaveMessages = (updater: (prev: ChatMessageItem[]) => ChatMessageItem[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  // 3. Xóa cuộc trò chuyện để bắt đầu phiên mới
  const handleClearHistory = () => {
    Alert.alert(
      'Làm mới hội thoại',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện và bắt đầu phiên mới với HQ AI?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Làm mới',
          style: 'destructive',
          onPress: () => {
            setMessages(INITIAL_MESSAGES);
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          },
        },
      ]
    );
  };

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      content: prompt,
      isAi: false,
    };

    updateAndSaveMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Chuẩn bị ngữ cảnh Multi-turn (lấy 6 câu gần nhất)
      const historyContext = messages
        .filter((m) => m.id !== 'ai-welcome')
        .slice(-6)
        .map((m) => ({
          role: m.isAi ? 'model' : 'user',
          content: m.content,
        }));

      const res = await askAi({ prompt, history: historyContext }).unwrap();
      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        content: res.reply || 'Không có phản hồi từ HQ AI.',
        isAi: true,
        modelName: res.model || 'HQ AI',
      };
      updateAndSaveMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        content: 'Rất tiếc, đã có sự cố kết nối tới máy chủ HQ AI. Vui lòng thử lại sau giây lát.',
        isAi: true,
        modelName: 'HQ AI',
      };
      updateAndSaveMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Bar: Tiêu đề phụ & Nút xóa lịch sử */}
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <View style={styles.onlineDot} />
          <Text style={styles.topSubText}>HQ AI luôn sẵn sàng hỗ trợ</Text>
        </View>
        <Pressable onPress={handleClearHistory} hitSlop={8} style={styles.clearBtn}>
          <Ionicons
            name="refresh-outline"
            size={16}
            color={colors.muted}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.clearBtnText}>Hội thoại mới</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AiMessageBubble
            content={item.content}
            isAi={item.isAi}
            modelName={item.modelName}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.thinkingWrap}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View style={styles.thinkingBubble}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={styles.thinkingText}>HQ AI đang suy nghĩ câu trả lời...</Text>
              </View>
            </View>
          ) : undefined
        }
      />

      {/* Thanh gợi ý câu hỏi nhanh */}
      <AiQuickPromptList onSelectPrompt={(p) => handleSend(p)} />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi HQ AI bất cứ điều gì..."
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />
        <ScalePressable
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </ScalePressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ScreenColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.page,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
      backgroundColor: colors.card,
    },
    topInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      marginRight: 6,
    },
    topSubText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '500',
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.chip,
    },
    clearBtnText: {
      fontSize: 12,
      color: colors.ink,
      fontWeight: '600',
    },
    listContent: {
      paddingVertical: 12,
    },
    thinkingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginVertical: 6,
    },
    aiAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    thinkingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    thinkingText: {
      fontSize: 13,
      color: colors.muted,
      marginLeft: 8,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
      backgroundColor: colors.card,
    },
    input: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      color: colors.ink,
      maxHeight: 120,
    },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      marginBottom: 2,
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });