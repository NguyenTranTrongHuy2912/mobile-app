import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { API_URL } from '../config';

interface AdminStats {
  database: string;
  status: string;
  system_status: string;
  total_users: number;
  total_admins: number;
  total_active_users: number;
  total_rooms: number;
  total_messages: number;
  vector_indexed_messages: number;
}

interface AdminUserItem {
  user_id: string;
  account: string;
  display_name: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  avatar_url?: string;
  created_at: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.session.token);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Users
      const url = searchQuery.trim()
        ? `${API_URL}/api/v1/admin/users?q=${encodeURIComponent(searchQuery.trim())}`
        : `${API_URL}/api/v1/admin/users`;
      const usersRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu quản trị:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleChangeRole = async (targetUser: AdminUserItem) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionText = newRole === 'ADMIN' ? 'thăng cấp làm Quản trị viên (ADMIN)' : 'hạ cấp xuống Thành viên (USER)';

    Alert.alert(
      'Xác nhận phân quyền',
      `Bạn có chắc chắn muốn ${actionText} cho "${targetUser.display_name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            setActionLoadingId(targetUser.user_id);
            try {
              const res = await fetch(`${API_URL}/api/v1/admin/users/${targetUser.user_id}/role`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
              });
              if (res.ok) {
                Alert.alert('Thành công', `Đã cập nhật quyền thành ${newRole}!`);
                fetchData();
              } else {
                Alert.alert('Lỗi', 'Không thể cập nhật quyền người dùng.');
              }
            } catch {
              Alert.alert('Lỗi', 'Lỗi kết nối máy chủ.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (targetUser: AdminUserItem) => {
    const newStatus = !targetUser.is_active;
    const actionText = newStatus ? 'mở khóa tài khoản' : 'tạm khóa tài khoản';

    Alert.alert(
      'Xác nhận trạng thái',
      `Bạn có chắc chắn muốn ${actionText} của "${targetUser.display_name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoadingId(targetUser.user_id);
            try {
              const res = await fetch(`${API_URL}/api/v1/admin/users/${targetUser.user_id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ is_active: newStatus }),
              });
              if (res.ok) {
                Alert.alert('Thành công', `Đã ${actionText}!`);
                fetchData();
              } else {
                Alert.alert('Lỗi', 'Không thể thay đổi trạng thái.');
              }
            } catch {
              Alert.alert('Lỗi', 'Lỗi kết nối máy chủ.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Header Info Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bảng Điều Khiển Quản Trị</Text>
            <Text style={styles.bannerSub}>Hệ thống cơ sở dữ liệu MongoDB Atlas & AI Vector Search</Text>
          </View>
        </View>
      </View>

      {/* Thống kê Tổng quan (Stats Grid) */}
      <Text style={styles.sectionTitle}>THỐNG KÊ HỆ THỐNG</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#4F46E5', borderLeftWidth: 4 }]}>
            <Ionicons name="people" size={20} color="#4F46E5" />
            <Text style={styles.statNumber}>{stats?.total_users ?? 0}</Text>
            <Text style={styles.statLabel}>Tổng người dùng</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statNumber}>{stats?.total_active_users ?? 0}</Text>
            <Text style={styles.statLabel}>Đang hoạt động</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
            <Ionicons name="shield" size={20} color="#8B5CF6" />
            <Text style={styles.statNumber}>{stats?.total_admins ?? 0}</Text>
            <Text style={styles.statLabel}>Quản trị viên</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#06B6D4', borderLeftWidth: 4 }]}>
            <Ionicons name="chatbubbles" size={20} color="#06B6D4" />
            <Text style={styles.statNumber}>{stats?.total_rooms ?? 0}</Text>
            <Text style={styles.statLabel}>Phòng chat</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
            <Ionicons name="mail" size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats?.total_messages ?? 0}</Text>
            <Text style={styles.statLabel}>Tin nhắn gửi</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#EC4899', borderLeftWidth: 4 }]}>
            <Ionicons name="hardware-chip" size={20} color="#EC4899" />
            <Text style={styles.statNumber}>{stats?.vector_indexed_messages ?? 0}</Text>
            <Text style={styles.statLabel}>Vector Embeddings</Text>
          </View>
        </View>
      )}

      {/* Quản lý Người dùng & Phân quyền */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN ({users.length})</Text>
      </View>

      {/* Ô tìm kiếm */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên hoặc email..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchData}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* Danh sách người dùng */}
      {users.map((u) => {
        const isAdmin = u.role === 'ADMIN';
        const isActionLoading = actionLoadingId === u.user_id;

        return (
          <View key={u.user_id} style={styles.userCard}>
            <View style={styles.userCardTop}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{u.display_name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.userDisplayName} numberOfLines={1}>
                    {u.display_name}
                  </Text>
                  {isAdmin ? (
                    <View style={styles.badgeAdmin}>
                      <Ionicons name="shield-checkmark" size={10} color="#fff" />
                      <Text style={styles.badgeAdminText}>ADMIN</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeUser}>
                      <Text style={styles.badgeUserText}>USER</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.userEmail} numberOfLines={1}>
                  {u.account}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: u.is_active ? '#10B981' : '#EF4444' },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: u.is_active ? '#059669' : '#DC2626' }]}>
                    {u.is_active ? 'Đang hoạt động' : 'Tài khoản bị khóa'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Các nút hành động CRUD/Quyền */}
            <View style={styles.actionRow}>
              {/* Nút Đổi quyền */}
              <Pressable
                style={[
                  styles.btnAction,
                  { backgroundColor: isAdmin ? '#F3F4F6' : '#EEF2FF', borderColor: isAdmin ? '#D1D5DB' : '#C7D2FE' },
                ]}
                onPress={() => handleChangeRole(u)}
                disabled={isActionLoading}
              >
                <Ionicons
                  name={isAdmin ? 'arrow-down-circle-outline' : 'shield-checkmark-outline'}
                  size={15}
                  color={isAdmin ? '#4B5563' : '#4F46E5'}
                />
                <Text style={[styles.btnActionText, { color: isAdmin ? '#4B5563' : '#4F46E5' }]}>
                  {isAdmin ? 'Hạ cấp User' : 'Thăng cấp Admin'}
                </Text>
              </Pressable>

              {/* Nút Khóa / Mở khóa */}
              <Pressable
                style={[
                  styles.btnAction,
                  { backgroundColor: u.is_active ? '#FEF2F2' : '#ECFDF5', borderColor: u.is_active ? '#FECACA' : '#A7F3D0' },
                ]}
                onPress={() => handleToggleStatus(u)}
                disabled={isActionLoading}
              >
                <Ionicons
                  name={u.is_active ? 'lock-closed-outline' : 'lock-open-outline'}
                  size={15}
                  color={u.is_active ? '#DC2626' : '#059669'}
                />
                <Text style={[styles.btnActionText, { color: u.is_active ? '#DC2626' : '#059669' }]}>
                  {u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  userDisplayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  badgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  badgeAdminText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeUser: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeUserText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
