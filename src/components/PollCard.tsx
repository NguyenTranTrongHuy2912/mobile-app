import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import { useGetPollQuery, useVotePollMutation } from '../api/chatApi';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

interface PollCardProps {
  pollId: string;
  currentUserId: string;
  mine?: boolean;
}

export default function PollCard({ pollId, currentUserId, mine }: PollCardProps) {
  const C = useScreenColors();
  const styles = makeStyles(C, !!mine);

  const { data: poll, isLoading, isError } = useGetPollQuery(pollId, {
    skip: !pollId,
  });

  const [votePoll, { isLoading: isVoting }] = useVotePollMutation();

  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={C.brand} />
        <Text style={styles.loadingText}>Đang tải cuộc bình chọn...</Text>
      </View>
    );
  }

  if (isError || !poll) {
    return (
      <View style={styles.card}>
        <Ionicons name="alert-circle-outline" size={20} color={C.danger} />
        <Text style={styles.loadingText}>Không thể tải cuộc bình chọn.</Text>
      </View>
    );
  }

  const handleVote = async (optionId: string) => {
    if (poll.is_closed || isVoting) return;
    try {
      await votePoll({ pollId, optionId }).unwrap();
    } catch (e) {
      console.warn('Vote poll error:', e);
    }
  };

  const hasVotedAny = poll.options.some((opt) => opt.voter_ids.includes(currentUserId));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeWrap}>
          <Ionicons name="stats-chart" size={13} color="#fff" />
          <Text style={styles.badgeText}>BÌNH CHỌN</Text>
        </View>
        <Text style={styles.subInfo}>
          {poll.is_multiple_choice ? 'Nhiều lựa chọn' : '1 lựa chọn'}
          {poll.is_anonymous ? ' · Ẩn danh' : ''}
        </Text>
      </View>

      {/* Câu hỏi */}
      <Text style={styles.questionText}>{poll.question}</Text>

      {/* Danh sách lựa chọn */}
      <View style={styles.optionsList}>
        {poll.options.map((opt) => {
          const isSelected = opt.voter_ids.includes(currentUserId);
          const percent = opt.percentage ?? 0;

          return (
            <Pressable
              key={opt.id}
              style={[
                styles.optionRow,
                isSelected && styles.optionRowSelected,
              ]}
              onPress={() => handleVote(opt.id)}
              disabled={isVoting || poll.is_closed}
            >
              {/* Thanh tiến trình phần trăm (Progress Bar Background) */}
              {hasVotedAny && (
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(percent, 0)}%` },
                    isSelected && styles.progressBarFillSelected,
                  ]}
                />
              )}

              {/* Nội dung phương án */}
              <View style={styles.optionContent}>
                <Ionicons
                  name={
                    poll.is_multiple_choice
                      ? isSelected
                        ? 'checkbox'
                        : 'square-outline'
                      : isSelected
                        ? 'radio-button-on'
                        : 'radio-button-off'
                  }
                  size={19}
                  color={isSelected ? C.brand : C.muted}
                  style={styles.checkIcon}
                />
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {opt.text}
                </Text>
                {hasVotedAny && (
                  <Text style={styles.percentText}>
                    {percent}% ({opt.voter_ids.length})
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {poll.total_votes} lượt bình chọn · Tạo bởi {poll.creator_name}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (C: ScreenColors, mine: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: mine ? 'rgba(255,255,255,0.12)' : C.card,
      borderRadius: 14,
      padding: 12,
      minWidth: 260,
      maxWidth: 320,
      borderWidth: 1,
      borderColor: mine ? 'rgba(255,255,255,0.2)' : C.line,
    },
    loadingText: {
      fontSize: 13,
      color: mine ? 'rgba(255,255,255,0.8)' : C.muted,
      marginTop: 6,
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    badgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    subInfo: {
      fontSize: 11,
      color: mine ? 'rgba(255,255,255,0.7)' : C.muted,
    },
    questionText: {
      fontSize: 15,
      fontWeight: '700',
      color: mine ? '#fff' : C.ink,
      marginBottom: 10,
      lineHeight: 20,
    },
    optionsList: {
      gap: 7,
    },
    optionRow: {
      position: 'relative',
      borderRadius: 10,
      backgroundColor: mine ? 'rgba(255,255,255,0.15)' : C.inputBg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: mine ? 'rgba(255,255,255,0.15)' : C.line,
    },
    optionRowSelected: {
      borderColor: C.brand,
    },
    progressBarFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: mine ? 'rgba(255,255,255,0.25)' : C.brandSoft,
      borderRadius: 9,
    },
    progressBarFillSelected: {
      backgroundColor: mine ? 'rgba(255,255,255,0.35)' : 'rgba(47, 107, 255, 0.2)',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 10,
      zIndex: 2,
    },
    checkIcon: {
      marginRight: 8,
    },
    optionText: {
      flex: 1,
      fontSize: 13,
      color: mine ? '#fff' : C.ink,
      fontWeight: '500',
    },
    optionTextSelected: {
      fontWeight: '700',
      color: mine ? '#fff' : C.brand,
    },
    percentText: {
      fontSize: 12,
      fontWeight: '600',
      color: mine ? 'rgba(255,255,255,0.9)' : C.muted,
      marginLeft: 6,
    },
    footer: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: mine ? 'rgba(255,255,255,0.15)' : C.line,
    },
    footerText: {
      fontSize: 11,
      color: mine ? 'rgba(255,255,255,0.7)' : C.muted,
      textAlign: 'right',
    },
  });
