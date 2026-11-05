import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAskAiMutation } from '../api/chatApi';
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
      'Xin chào! Tôi là Trợ lý AI của ChatApp (được hỗ trợ bởi Google Gemini) 🤖✨.\n\n' +
      'Tôi có thể giúp bạn giải đáp thắc mắc về lập trình, viết nội dung, hoặc tóm tắt các cuộc trò chuyện. Hãy hỏi tôi bất cứ điều gì nhé!',
    isAi: true,
    modelName: 'Gemini 1.5 Flash',
  },
];

/**
 * Màn hình Trợ lý ảo AI (Meta AI / Gemini)
 * Đáp ứng tiêu chí "AI basic" theo yêu cầu của Giảng viên.
 */
export default function AiAssistantScreen() {
  const [messages, setMessages] = useState<ChatMessageItem[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [askAi, { isLoading }] = useAskAiMutation();

  const listRef = useRef<FlatList<ChatMessageItem>>(null);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      content: prompt,
      isAi: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await askAi({ prompt }).unwrap();
      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        content: res.reply || 'Không có phản hồi từ AI.',
        isAi: true,
        modelName: res.model || 'Gemini 1.5 Flash',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        content: 'Rất tiếc, đã có lỗi kết nối với máy chủ AI. Vui lòng thử lại sau ít phút.',
        isAi: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
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
                <Text style={styles.thinkingText}>Gemini đang suy nghĩ...</Text>
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
          placeholder="Hỏi Meta AI bất cứ điều gì..."
          placeholderTextColor="#8A8D91"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
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
  listContent: {
    paddingVertical: 14,
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
