import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import { useCreatePollMutation } from '../api/chatApi';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

interface CreatePollModalProps {
  visible: boolean;
  roomId: string;
  onClose: () => void;
}

export default function CreatePollModal({ visible, roomId, onClose }: CreatePollModalProps) {
  const C = useScreenColors();
  const styles = makeStyles(C);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [createPoll, { isLoading }] = useCreatePollMutation();

  const handleAddOption = () => {
    if (options.length >= 10) {
      Alert.alert('Giới hạn', 'Một cuộc bình chọn chỉ được tối đa 10 phương án.');
      return;
    }
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Giới hạn', 'Cần ít nhất 2 phương án bình chọn.');
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeOption = (text: string, index: number) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleReset = () => {
    setQuestion('');
    setOptions(['', '']);
    setIsMultipleChoice(false);
    setIsAnonymous(false);
  };

  const handleSubmit = async () => {
    const trimmedQ = question.trim();
    if (!trimmedQ) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập câu hỏi bình chọn.');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ít nhất 2 phương án hợp lệ.');
      return;
    }

    try {
      await createPoll({
        roomId,
        question: trimmedQ,
        options: validOptions,
        isMultipleChoice,
        isAnonymous,
      }).unwrap();

      handleReset();
      onClose();
    } catch (e: any) {
      Alert.alert('Lỗi tạo bình chọn', e?.data?.detail || 'Không thể tạo cuộc bình chọn lúc này.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Tạo cuộc bình chọn</Text>
            <Pressable onPress={handleSubmit} disabled={isLoading} hitSlop={8}>
              {isLoading ? (
                <ActivityIndicator size="small" color={C.brand} />
              ) : (
                <Text style={styles.submitText}>Tạo</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Câu hỏi */}
            <Text style={styles.sectionLabel}>CÂU HỎI BÌNH CHỌN</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="Đặt câu hỏi bình chọn..."
              placeholderTextColor={C.muted}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
            />

            {/* Các phương án */}
            <Text style={styles.sectionLabel}>CÁC LỰA CHỌN</Text>
            {options.map((opt, idx) => (
              <View key={idx} style={styles.optionRow}>
                <Ionicons name="radio-button-off" size={20} color={C.muted} style={styles.radioIcon} />
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Lựa chọn ${idx + 1}`}
                  placeholderTextColor={C.muted}
                  value={opt}
                  onChangeText={(text) => handleChangeOption(text, idx)}
                  maxLength={150}
                />
                {options.length > 2 && (
                  <Pressable
                    onPress={() => handleRemoveOption(idx)}
                    hitSlop={8}
                    style={styles.deleteOptionBtn}
                  >
                    <Ionicons name="close-circle" size={20} color={C.muted} />
                  </Pressable>
                )}
              </View>
            ))}

            {options.length < 10 && (
              <Pressable style={styles.addOptionBtn} onPress={handleAddOption}>
                <Ionicons name="add-circle-outline" size={20} color={C.brand} />
                <Text style={styles.addOptionText}>Thêm lựa chọn</Text>
              </Pressable>
            )}

            {/* Cài đặt cuộc bình chọn */}
            <Text style={styles.sectionLabel}>CÀI ĐẶT</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Cho phép chọn nhiều phương án</Text>
                <Text style={styles.settingSub}>Thành viên có thể vote cho hơn 1 lựa chọn</Text>
              </View>
              <Switch
                value={isMultipleChoice}
                onValueChange={setIsMultipleChoice}
                trackColor={{ false: C.line, true: C.brand }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Bình chọn ẩn danh</Text>
                <Text style={styles.settingSub}>Không hiển thị tên người đã bình chọn</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: C.line, true: C.brand }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    cancelText: {
      fontSize: 15,
      color: C.muted,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.ink,
    },
    submitText: {
      fontSize: 15,
      fontWeight: '700',
      color: C.brand,
    },
    body: {
      flexGrow: 0,
    },
    bodyContent: {
      padding: 16,
      paddingBottom: 32,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: C.muted,
      letterSpacing: 0.5,
      marginTop: 12,
      marginBottom: 8,
    },
    questionInput: {
      backgroundColor: C.inputBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: C.ink,
      minHeight: 60,
      borderWidth: 1,
      borderColor: C.line,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.line,
    },
    radioIcon: {
      marginRight: 8,
    },
    optionInput: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 14,
      color: C.ink,
    },
    deleteOptionBtn: {
      padding: 4,
    },
    addOptionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    addOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.brand,
      marginLeft: 6,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    settingInfo: {
      flex: 1,
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: C.ink,
    },
    settingSub: {
      fontSize: 12,
      color: C.muted,
      marginTop: 2,
    },
  });
