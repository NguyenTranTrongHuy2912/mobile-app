/**
 * callSignalEmitter.ts
 * Cung cấp cầu nối gửi tín hiệu WebRTC qua WebSocket kết nối sẵn của ứng dụng.
 */

type WebSocketProvider = () => WebSocket | null;

let getActiveWebSocket: WebSocketProvider = () => null;

export function registerCallWebSocketProvider(provider: WebSocketProvider) {
  getActiveWebSocket = provider;
}

export function sendCallSignal(data: Record<string, any>): boolean {
  try {
    const ws = getActiveWebSocket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
  } catch (e) {
    console.warn('[CallSignal] Failed to send signal:', e);
  }
  return false;
}
