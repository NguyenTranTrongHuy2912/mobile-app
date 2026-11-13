import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text as RNText } from 'react-native';
import { Text, View, XStack, YStack } from 'tamagui';

interface AiMessageBubbleProps {
  content: string;
  isAi: boolean;
  modelName?: string;
}

/**
 * Hiển thị khối mã nguồn với giao diện lập trình chuyên nghiệp
 */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.codeContainer}>
      <XStack style={styles.codeHeader}>
        <XStack style={{ alignItems: 'center', gap: 6 }}>
          <View style={[styles.codeDot, { backgroundColor: '#FF5F56' }]} />
          <View style={[styles.codeDot, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.codeDot, { backgroundColor: '#27C93F' }]} />
          <Text color="#A0A0B0" fontSize={12} fontWeight="600" style={{ marginLeft: 6 }}>
            {language || 'code'}
          </Text>
        </XStack>
        <Pressable onPress={handleCopy} hitSlop={6} style={styles.copyBtn}>
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={14}
            color={copied ? '#4ADE80' : '#A0A0B0'}
          />
          <Text color={copied ? '#4ADE80' : '#A0A0B0'} fontSize={11} fontWeight="600" style={{ marginLeft: 4 }}>
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </Text>
        </Pressable>
      </XStack>
      <RNText selectable style={styles.codeBody}>
        {code.trim()}
      </RNText>
    </View>
  );
}

/**
 * Phân tích và định dạng văn bản Markdown cơ bản (In đậm **, Khối mã ```, Gạch đầu dòng •)
 */
function FormattedAiContent({ text }: { text: string }) {
  // Tách các khối mã nguồn ```language ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderTextWithFormatting(textBefore, `text-${lastIndex}`));
    }
    const lang = match[1] || '';
    const code = match[2] || '';
    parts.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    parts.push(renderTextWithFormatting(remainingText, `text-end-${lastIndex}`));
  }

  return <YStack style={{ gap: 6 }}>{parts}</YStack>;
}

function renderTextWithFormatting(raw: string, keyPrefix: string): React.ReactNode {
  const lines = raw.split('\n');
  return (
    <YStack key={keyPrefix} style={{ gap: 4 }}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <View key={`${keyPrefix}-blank-${lIdx}`} style={{ height: 4 }} />;
        }

        // Tách chuỗi in đậm dạng **in đậm**
        const boldRegex = /\*\*(.*?)\*\*/g;
        const lineParts: React.ReactNode[] = [];
        let curIdx = 0;
        let m: RegExpExecArray | null;

        while ((m = boldRegex.exec(line)) !== null) {
          if (m.index > curIdx) {
            lineParts.push(
              <RNText key={`normal-${curIdx}`} style={styles.normalText}>
                {line.slice(curIdx, m.index)}
              </RNText>
            );
          }
          lineParts.push(
            <RNText key={`bold-${m.index}`} style={styles.boldText}>
              {m[1]}
            </RNText>
          );
          curIdx = m.index + m[0].length;
        }
        if (curIdx < line.length) {
          lineParts.push(
            <RNText key={`normal-end-${curIdx}`} style={styles.normalText}>
              {line.slice(curIdx)}
            </RNText>
          );
        }

        return (
          <RNText key={`${keyPrefix}-line-${lIdx}`} selectable style={styles.lineWrapper}>
            {lineParts}
          </RNText>
        );
      })}
    </YStack>
  );
}

/**
 * Bubble hiển thị tin nhắn trong màn hình Trợ lý HQ AI
 */
export default function AiMessageBubble({
  content,
  isAi,
  modelName = 'HQ AI',
}: AiMessageBubbleProps) {
  if (!isAi) {
    return (
      <YStack style={{ marginVertical: 6, paddingHorizontal: 12, alignItems: 'flex-end' }}>
        <View
          backgroundColor="brand"
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            maxWidth: '82%',
          }}
        >
          <RNText selectable style={{ color: '#fff', fontSize: 15, lineHeight: 21 }}>
            {content}
          </RNText>
        </View>
      </YStack>
    );
  }

  return (
    <XStack
      style={{
        marginVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        maxWidth: '94%',
      }}
    >
      {/* Avatar biểu tượng HQ AI */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#0084FF',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
          marginTop: 2,
        }}
      >
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>

      <YStack style={{ flexShrink: 1, flexGrow: 0, flexBasis: 'auto', alignItems: 'flex-start' }}>
        <View
          backgroundColor="surface"
          style={{
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: 'auto',
            alignSelf: 'flex-start',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 18,
            borderTopLeftRadius: 4,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: '#E4E6EB',
          }}
        >
          <FormattedAiContent text={content} />
        </View>

        {/* Nhãn phiên bản HQ AI */}
        <XStack style={{ alignItems: 'center', marginTop: 4, marginLeft: 4 }}>
          <Ionicons name="hardware-chip-outline" size={11} color="#65676B" style={{ marginRight: 3 }} />
          <Text color="muted" fontSize={11} fontWeight="600">
            {modelName}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
}

const styles = StyleSheet.create({
  normalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#050505',
  },
  boldText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: '#050505',
  },
  lineWrapper: {
    fontSize: 15,
    lineHeight: 22,
    color: '#050505',
  },
  codeContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#313244',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#181825',
    borderBottomWidth: 1,
    borderBottomColor: '#313244',
  },
  codeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#313244',
  },
  codeBody: {
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#CDD6F4',
    lineHeight: 19,
  },
});
