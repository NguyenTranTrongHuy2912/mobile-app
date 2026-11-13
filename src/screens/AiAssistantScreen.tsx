import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAskAiMutation } from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
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
      'Xin chào! Tôi là **HQ AI** (Huy & Quốc AI) 🤖✨ — Trợ lý thông minh trong ứng dụng ChatApp.\n\n' +
      'Tôi có thể hỗ trợ bạn:\n' +
      '• 🎓 **Học tập & Lập trình:** Code React Native, Python, Java, giải thuật.\n' +
      '• 🧮 **Tính toán & Khoa học:** Tính phần trăm, chia tiền, giải thích hiện tượng tự nhiên.\n' +
      '• ✍️ **Soạn thảo văn bản:** Viết email xin nghỉ học, lời chúc sinh nhật, dịch Anh - Việt.\n' +
      '• 🏛️ **Kiến trúc ChatApp:** Nắm rõ Microservices 3 tầng Clean Architecture.\n\n' +
      'Hãy nhập câu hỏi bất kỳ hoặc chọn gợi ý bên dưới nhé!',
    isAi: true,
    modelName: 'HQ AI',
  },
];

/**
 * Màn hình Trợ lý ảo HQ AI (Huy & Quốc AI)
 * Hỗ trợ Multi-turn Conversation & Lưu lịch sử AsyncStorage
 */
export default function AiAssistantScreen() {
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
          <Ionicons name="refresh-outline" size={16} color="#65676B" style={{ marginRight: 4 }} />
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
                <ActivityIndicator size="small" color="#0084FF" />
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
          placeholderTextColor="#8A8D91"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
    backgroundColor: '#F8F9FA',
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#31A24C',
    marginRight: 6,
  },
  topSubText: {
    fontSize: 12,
    color: '#65676B',
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#E4E6EB',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#050505',
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
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  thinkingText: {
    fontSize: 13,
    color: '#65676B',
    marginLeft: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E6EB',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#050505',
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#BCC0C4',
  },
});
