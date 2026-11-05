import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSemanticSearchMutation } from '../api/chatApi';
import ScalePressable from './ScalePressable';
import dayjs from 'dayjs';

interface SemanticSearchModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  roomName?: string;
}

/**
 * Modal Tìm kiếm ngữ nghĩa bằng thuật toán Vector Database (Cosine Similarity)
 * Đáp ứng yêu cầu: "sử dụng thuật toán của vector database để làm AI với database"
 */
export default function SemanticSearchModal({
  visible,
  onClose,
  roomId,
  roomName = 'Phòng chat',
}: SemanticSearchModalProps) {
  const [query, setQuery] = useState('');
  const [semanticSearch, { data, isLoading }] = useSemanticSearchMutation();

  const handleSearch = () => {
    if (!query.trim() || isLoading) return;
    semanticSearch({ roomId, query: query.trim(), topK: 6 });
  };

  const results = data?.results ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <View style={styles.aiBadge}>
                <Ionicons name="hardware-chip" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.title}>Tìm kiếm AI Vector Database</Text>
                <Text style={styles.subTitle} numberOfLines={1}>
                  Phòng: {roomName} · Thuật toán Cosine Similarity
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#65676B" />
            </Pressable>
          </View>

          {/* Input Box */}
          <View style={styles.inputSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#65676B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Tìm theo ý nghĩa (VD: học phí, đồ án, quán ăn...)"
                placeholderTextColor="#8A8D91"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color="#8A8D91" />
                </Pressable>
              ) : null}
            </View>
            <ScalePressable
              style={[styles.searchBtn, (!query.trim() || isLoading) && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={!query.trim() || isLoading}
            >
              <Text style={styles.searchBtnText}>Quét Vector</Text>
            </ScalePressable>
          </View>

          {/* Results List */}
          <View style={styles.body}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#0084FF" />
                <Text style={styles.loadingText}>
                  Đang tính toán ma trận Cosine Similarity trong Vector Space...
                </Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={(item) => item.message_id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.resultCard}>
                    <View style={styles.resultTop}>
                      <Text style={styles.sender}>{item.sender_name}</Text>
                      <View style={styles.similarityBadge}>
                        <Text style={styles.similarityText}>
                          Độ khớp: {item.match_percent}% (Cos: {item.similarity_score})
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.messageContent}>{item.content}</Text>

                    {/* Progress Bar thể hiện độ tương đồng vector */}
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(10, Math.min(100, item.match_percent))}%`,
                            backgroundColor:
                              item.similarity_score >= 0.4 ? '#31A24C' : '#0084FF',
                          },
                        ]}
                      />
                    </View>

                    {item.timestamp ? (
                      <Text style={styles.timeText}>
                        {dayjs(item.timestamp).format('HH:mm · DD/MM/YYYY')}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            ) : data && results.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={44} color="#8A8D91" />
                <Text style={styles.emptyTitle}>Không tìm thấy tin nhắn tương đồng</Text>
                <Text style={styles.emptySub}>
                  Thử tìm kiếm với từ ngữ hoặc câu hỏi khác.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="sparkles-outline" size={44} color="#0084FF" />
                <Text style={styles.emptyTitle}>Tìm kiếm theo ngữ nghĩa thông minh</Text>
                <Text style={styles.emptySub}>
                  Không chỉ tìm từ khóa chính xác, AI Vector Database chuyển đổi câu chat thành vector không gian để tìm ra những tin nhắn có ý nghĩa tương đồng nhất!
                </Text>
              </View>
            )}
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
    height: '80%',
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
  },
  subTitle: {
    fontSize: 12,
    color: '#65676B',
    marginTop: 1,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#050505',
    paddingVertical: 0,
  },
  searchBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: '#BCC0C4',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#65676B',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sender: {
    fontSize: 14,
    fontWeight: '700',
    color: '#050505',
  },
  similarityBadge: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  similarityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0064D1',
  },
  messageContent: {
    fontSize: 14,
    color: '#050505',
    lineHeight: 20,
    marginBottom: 8,
  },
  barContainer: {
    height: 4,
    backgroundColor: '#E4E6EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#8A8D91',
    textAlign: 'right',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#65676B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
