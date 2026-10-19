import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';

// - Nếu chạy trên iOS Simulator / Web: 'http://localhost:8000'
// - Nếu chạy trên Android Emulator: 'http://10.0.2.2:8000'
// - Nếu chạy trên điện thoại thật: 'http://<IP_MAY_TIN_CUAN_BAN>:8000'
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export default function App() {
  const [message, setMessage] = useState('');
  const [responseLog, setResponseLog] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập nội dung tin nhắn!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/chat/send`, {
        room_id: 'room_101',
        sender_id: 'user_mobile_react_native',
        content: message,
      });

      setResponseLog(JSON.stringify(res.data, null, 2));
      setMessage('');
      Alert.alert('Thành công', 'Tin nhắn đã được lưu vào MongoDB!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể kết nối tới FastAPI Gateway!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      <Text style={styles.subtitle}>React Native ➔ FastAPI ➔ Java gRPC ➔ MongoDB</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập tin nhắn..."
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendMessage} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi Tin Nhắn</Text>}
      </TouchableOpacity>

      {responseLog !== '' && (
        <View style={styles.logBox}>
          <Text style={styles.logTitle}>Phản hồi từ Server (MongoDB):</Text>
          <Text style={styles.logText}>{responseLog}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});