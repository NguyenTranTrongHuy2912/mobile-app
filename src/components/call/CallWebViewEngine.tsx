/**
 * CallWebViewEngine.tsx
 * Lớp điều khiển WebView WebRTC độc lập, xử lý luồng âm thanh và hình ảnh Jitsi trong ứng dụng
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { INJECTED_CALL_SCRIPT } from '../../features/call/callEngine';

interface CallWebViewEngineProps {
  webViewRef: React.RefObject<any>;
  jitsiUrl: string;
  isVideo: boolean;
  isVideoOff: boolean;
  isGroup: boolean;
  isConnected: boolean;
}

export function CallWebViewEngine({
  webViewRef,
  jitsiUrl,
  isVideo,
  isVideoOff,
  isGroup,
  isConnected,
}: CallWebViewEngineProps) {
  if (!isConnected || Platform.OS === 'web') return null;

  const isFullVideoVisible = isVideo && !isVideoOff && !isGroup;

  return (
    <View
      style={isFullVideoVisible ? styles.videoContainer : styles.audioContainer}
      pointerEvents={isFullVideoVisible ? 'auto' : 'none'}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: jitsiUrl }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        androidHardwareAccelerationDisabled={false}
        mediaCapturePermissionGrantType="grant"
        onPermissionRequest={(event: any) => {
          event.grant(event.resources);
        }}
        injectedJavaScript={INJECTED_CALL_SCRIPT}
        onShouldStartLoadWithRequest={(request) => {
          // Ngăn chặn hoàn toàn việc chuyển hướng sang Google Play hoặc app ngoài
          if (
            request.url.startsWith('intent://') ||
            request.url.startsWith('market://') ||
            request.url.startsWith('itms-apps://') ||
            (!request.url.startsWith('http://') && !request.url.startsWith('https://'))
          ) {
            return false;
          }
          return true;
        }}
        style={styles.fullWebView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#0F141C',
  },
  audioContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    zIndex: 0,
    opacity: 0.01,
  },
  fullWebView: {
    flex: 1,
    backgroundColor: '#0F141C',
  },
});
