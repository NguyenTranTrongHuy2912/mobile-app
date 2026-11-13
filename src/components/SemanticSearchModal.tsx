import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text as RNText, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spinner, Text, View } from 'tamagui';
import { useSemanticSearchMutation } from '../api/chatApi';
import ScalePressable from './ScalePressable';
import dayjs from 'dayjs';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

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
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [query, setQuery] = useState('');
  const [semanticSearch, { data, isLoading }] = useSemanticSearchMutation();

  const handleSearch = () => {
    if (!query.trim() || isLoading) return;
    semanticSearch({ roomId, query: query.trim(), topK: 6 });
  };

  const results = data?.results ?? [];
  const searchDisabled = !query.trim() || isLoading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            <View onPress={onClose} style={{ padding: 4 }} role="button" aria-label="Đóng">
              <Ionicons name="close" size={24} color={C.muted} />
            </View>
          </View>

          {/* Input Box */}
          <View style={styles.inputSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Tìm theo ý nghĩa (VD: học phí, đồ án, quán ăn...)"
                placeholderTextColor={C.muted}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {query ? (
                <View onPress={() => setQuery('')} role="button" aria-label="Xóa">
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </View>
              ) : null}
            </View>
            <ScalePressable
              style={{ ...styles.searchBtn, ...(searchDisabled ? styles.searchBtnDisabled : null) }}
              onPress={handleSearch}
              disabled={searchDisabled}
            >
              <Text style={styles.searchBtnText}>Quét Vector</Text>
            </ScalePressable>
          </View>

          {/* Results List */}
          <View style={styles.body}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <Spinner size="large" color="$brand" />
                <RNText style={styles.loadingText}>
                  Đang tính toán ma trận Cosine Similarity trong Vector Space...
                </RNText>
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

                    <RNText style={styles.messageContent}>{item.content}</RNText>

                    {/* Progress Bar thể hiện độ tương đồng vector */}
                    <View style={styles.barContainer}>
                      <View
                        style={{
                          ...styles.barFill,
                          width: `${Math.max(10, Math.min(100, item.match_percent))}%` as `${number}%`,
                          backgroundColor: item.similarity_score >= 0.4 ? C.success : C.brand,
                        }}
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
                <Ionicons name="search-outline" size={44} color={C.muted} />
                <Text style={styles.emptyTitle}>Không tìm thấy tin nhắn tương đồng</Text>
                <RNText style={styles.emptySub}>Thử tìm kiếm với từ ngữ hoặc câu hỏi khác.</RNText>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="sparkles-outline" size={44} color={C.brand} />
                <Text style={styles.emptyTitle}>Tìm kiếm theo ngữ nghĩa thông minh</Text>
                <RNText style={styles.emptySub}>
                  Không chỉ tìm từ khóa chính xác, AI Vector Database chuyển đổi câu chat thành vector không gian để tìm ra những tin nhắn có ý nghĩa tương đồng nhất!
                </RNText>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: C.card,
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
      borderBottomColor: C.line,
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
      backgroundColor: C.brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: C.ink,
    },
    subTitle: {
      fontSize: 12,
      color: C.muted,
      marginTop: 1,
    },
    inputSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      borderRadius: 18,
      paddingHorizontal: 12,
      height: 42,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: C.ink,
      paddingVertical: 0,
    },
    searchBtn: {
      backgroundColor: C.brand,
      paddingHorizontal: 14,
      height: 42,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchBtnDisabled: {
      backgroundColor: C.isDark ? C.chip : '#BCC0C4',
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
      color: C.muted,
      marginTop: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    resultCard: {
      backgroundColor: C.isDark ? C.page : '#F7F8FA',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: C.line,
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
      color: C.ink,
    },
    similarityBadge: {
      backgroundColor: C.brandSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    similarityText: {
      fontSize: 11,
      fontWeight: '700',
      color: C.brandSoftText,
    },
    messageContent: {
      fontSize: 14,
      color: C.ink,
      lineHeight: 20,
      marginBottom: 8,
    },
    barContainer: {
      height: 4,
      backgroundColor: C.line,
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
      color: C.muted,
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
      color: C.ink,
      marginTop: 12,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      color: C.muted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 20,
    },
  });
