import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  useWindowDimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { API_URL } from '../config';
import { logout } from '../features/session/sessionSlice';

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

type AdminMenuKey = 'overview' | 'users' | 'rooms' | 'ai' | 'security';
type FilterType = 'all' | 'admin' | 'user' | 'active' | 'suspended';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 800;

  const token = useSelector((state: RootState) => state.session.token);
  const myName = useSelector((state: RootState) => state.session.displayName) || 'Administrator';
  const myAccount = useSelector((state: RootState) => state.session.userId);

  // States
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('users');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal Thêm người dùng mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  // Fetch dữ liệu từ Gateway
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

  // Thao tác: Đổi quyền Admin / User
  const handleChangeRole = async (targetUser: AdminUserItem) => {
    const updatedRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionText = updatedRole === 'ADMIN' ? 'thăng cấp làm Quản trị viên (ADMIN)' : 'hạ cấp xuống Thành viên (USER)';

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
                body: JSON.stringify({ role: updatedRole }),
              });
              if (res.ok) {
                Alert.alert('Thành công', `Đã cập nhật quyền thành ${updatedRole}!`);
                fetchData();
              } else {
                Alert.alert('Lỗi', 'Không thể cập nhật quyền.');
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

  // Thao tác: Khóa / Mở khóa tài khoản
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

  // Thao tác: Xóa tài khoản
  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    Alert.alert(
      'Xóa người dùng',
      `Hành động này không thể hoàn tác! Bạn có chắc muốn xóa tài khoản "${targetUser.display_name}" (${targetUser.account})?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(targetUser.user_id);
            try {
              const res = await fetch(`${API_URL}/api/v1/admin/users/${targetUser.user_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                Alert.alert('Thành công', 'Đã xóa người dùng khỏi hệ thống.');
                fetchData();
              } else {
                const errData = await res.json().catch(() => ({}));
                Alert.alert('Lỗi', errData.detail || 'Không thể xóa người dùng.');
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

  // Tạo người dùng mới qua Admin API
  const handleCreateUser = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải có độ dài ít nhất 6 ký tự.');
      return;
    }
    setIsSubmittingNewUser(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account: newEmail.trim().toLowerCase(),
          display_name: newName.trim() || newEmail.split('@')[0],
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thành công', 'Đã thêm người dùng mới thành công!');
        setShowAddModal(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('USER');
        fetchData();
      } else {
        Alert.alert('Lỗi', data.detail || 'Không thể tạo người dùng.');
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Lọc danh sách người dùng theo Filter Tab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (currentFilter === 'admin') return u.role === 'ADMIN';
      if (currentFilter === 'user') return u.role === 'USER';
      if (currentFilter === 'active') return u.is_active;
      if (currentFilter === 'suspended') return !u.is_active;
      return true;
    });
  }, [users, currentFilter]);

  // Sidebar Menu Content
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.brandTitle}>HQ Admin</Text>
          <Text style={styles.brandSub}>Enterprise Portal</Text>
        </View>
      </View>

      {/* Menu Groups */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.menuGroupHeader}>TRANG QUẢN TRỊ</Text>

        <Pressable
          style={[styles.menuItem, activeMenu === 'overview' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('overview');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="pie-chart-outline"
            size={19}
            color={activeMenu === 'overview' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'overview' && styles.menuItemTextActive]}>
            Tổng quan (Overview)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.menuItem, activeMenu === 'users' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('users');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="people-outline"
            size={19}
            color={activeMenu === 'users' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'users' && styles.menuItemTextActive]}>
            Quản lý người dùng
          </Text>
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{users.length}</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.menuItem, activeMenu === 'rooms' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('rooms');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={19}
            color={activeMenu === 'rooms' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'rooms' && styles.menuItemTextActive]}>
            Giám sát phòng chat
          </Text>
        </Pressable>

        <Text style={[styles.menuGroupHeader, { marginTop: 24 }]}>HỆ THỐNG & AI</Text>

        <Pressable
          style={[styles.menuItem, activeMenu === 'ai' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('ai');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="sparkles-outline"
            size={19}
            color={activeMenu === 'ai' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'ai' && styles.menuItemTextActive]}>
            Trợ lý HQ AI
          </Text>
          <View style={[styles.menuBadge, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.menuBadgeText, { color: '#4F46E5' }]}>Pro</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.menuItem, activeMenu === 'security' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('security');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={activeMenu === 'security' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'security' && styles.menuItemTextActive]}>
            Bảo mật & Giám sát
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.sidebarFooter}>
        <Pressable
          style={styles.switchAppButton}
          onPress={() => router.push('/rooms')}
        >
          <Ionicons name="chatbubbles" size={17} color="#2563EB" />
          <Text style={styles.switchAppText}>Vào chế độ Chat</Text>
        </Pressable>

        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Đăng xuất', 'Đăng xuất khỏi phiên Quản trị viên?', [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Đăng xuất', style: 'destructive', onPress: () => dispatch(logout() as any) },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={17} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất Admin</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Sidebar Desktop/Tablet */}
        {isLargeScreen && renderSidebar()}

        {/* Mobile Sidebar Drawer Modal */}
        {!isLargeScreen && (
          <Modal
            visible={isSidebarOpenMobile}
            animationType="slide"
            transparent
            onRequestClose={() => setIsSidebarOpenMobile(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.mobileDrawerContainer, { width: Math.min(width * 0.8, 320) }]}>
                {renderSidebar()}
              </View>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setIsSidebarOpenMobile(false)}
              />
            </View>
          </Modal>
        )}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Top Bar Header */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {!isLargeScreen && (
                <Pressable
                  style={styles.hamburgerBtn}
                  onPress={() => setIsSidebarOpenMobile(true)}
                  hitSlop={8}
                >
                  <Ionicons name="menu" size={24} color="#1E293B" />
                </Pressable>
              )}
              <View>
                <Text style={styles.breadcrumb}>
                  Quản trị / {activeMenu === 'users' ? 'Người dùng' : activeMenu === 'overview' ? 'Tổng quan' : activeMenu === 'rooms' ? 'Phòng chat' : activeMenu === 'ai' ? 'Cấu hình AI' : 'Bảo mật'} / Danh sách
                </Text>
                <Text style={styles.pageTitle}>
                  {activeMenu === 'users' ? 'Quản Lý Người Dùng' : activeMenu === 'overview' ? 'Tổng Quan Hệ Thống' : activeMenu === 'rooms' ? 'Giám Sát Phòng Chat' : activeMenu === 'ai' ? 'Cấu Hình HQ AI' : 'Bảo Mật & Nhật Ký'}
                </Text>
              </View>
            </View>

            <View style={styles.topBarRight}>
              <Pressable style={styles.refreshBtn} onPress={onRefresh} hitSlop={8}>
                <Ionicons name="refresh" size={18} color="#2563EB" />
                <Text style={styles.refreshText}>Làm mới</Text>
              </Pressable>

              <View style={styles.adminProfileBadge}>
                <View style={styles.adminAvatar}>
                  <Text style={styles.adminAvatarText}>{myName.charAt(0).toUpperCase()}</Text>
                </View>
                {isLargeScreen && (
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.adminNameText}>{myName}</Text>
                    <Text style={styles.adminRoleTag}>ADMIN</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Scrollable Main Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          >
            {/* 4 Thẻ KPI Metrics lớn theo mẫu Front SaaS */}
            <View style={styles.kpiGrid}>
              {/* Thẻ 1: Tổng người dùng */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiLabel}>TỔNG NGƯỜI DÙNG</Text>
                  <View style={[styles.kpiGrowthBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="trending-up" size={13} color="#16A34A" />
                    <Text style={[styles.kpiGrowthText, { color: '#16A34A' }]}>+5.0%</Text>
                  </View>
                </View>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiValueNumber}>{stats?.total_users ?? users.length}</Text>
                  <Text style={styles.kpiSubText}>thành viên</Text>
                </View>
              </View>

              {/* Thẻ 2: Thành viên hoạt động */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiLabel}>HOẠT ĐỘNG TRỰC TUYẾN</Text>
                  <View style={[styles.kpiGrowthBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="trending-up" size={13} color="#16A34A" />
                    <Text style={[styles.kpiGrowthText, { color: '#16A34A' }]}>+1.2%</Text>
                  </View>
                </View>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiValueNumber}>{stats?.total_active_users ?? 0}</Text>
                  <Text style={styles.kpiSubText}>đang hoạt động</Text>
                </View>
              </View>

              {/* Thẻ 3: Tổng số phòng chat */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiLabel}>PHÒNG TRÒ CHUYỆN</Text>
                  <View style={[styles.kpiGrowthBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.kpiGrowthText, { color: '#2563EB' }]}>Thời gian thực</Text>
                  </View>
                </View>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiValueNumber}>{stats?.total_rooms ?? 0}</Text>
                  <Text style={styles.kpiSubText}>phòng chat</Text>
                </View>
              </View>

              {/* Thẻ 4: Tin nhắn trao đổi */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiLabel}>TỔNG TIN NHẮN</Text>
                  <View style={[styles.kpiGrowthBadge, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="hardware-chip-outline" size={13} color="#9333EA" />
                    <Text style={[styles.kpiGrowthText, { color: '#9333EA' }]}>AI Ready</Text>
                  </View>
                </View>
                <View style={styles.kpiValueRow}>
                  <Text style={styles.kpiValueNumber}>{stats?.total_messages ?? 0}</Text>
                  <Text style={styles.kpiSubText}>tin nhắn gửi</Text>
                </View>
              </View>
            </View>

            {/* Quản lý Người dùng & Data Table Card */}
            <View style={styles.tableCard}>
              {/* Header Action Bar */}
              <View style={styles.tableHeaderBar}>
                <View style={styles.tableTitleRow}>
                  <Text style={styles.tableTitle}>Danh Sách Tài Khoản</Text>
                  <Text style={styles.tableSubtitle}>
                    Quản lý thông tin, phân quyền Quản trị viên và kiểm soát trạng thái truy cập
                  </Text>
                </View>

                <Pressable
                  style={styles.addUserButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.addUserText}>Thêm người dùng</Text>
                </Pressable>
              </View>

              {/* Filter Tabs & Search Row */}
              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <Pressable
                    style={[styles.filterChip, currentFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('all')}
                  >
                    <Text style={[styles.filterChipText, currentFilter === 'all' && styles.filterChipTextActive]}>
                      Tất cả ({users.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'admin' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('admin')}
                  >
                    <Text style={[styles.filterChipText, currentFilter === 'admin' && styles.filterChipTextActive]}>
                      Quản trị viên ({users.filter((u) => u.role === 'ADMIN').length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'user' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('user')}
                  >
                    <Text style={[styles.filterChipText, currentFilter === 'user' && styles.filterChipTextActive]}>
                      Người dùng ({users.filter((u) => u.role === 'USER').length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'active' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('active')}
                  >
                    <Text style={[styles.filterChipText, currentFilter === 'active' && styles.filterChipTextActive]}>
                      Đang hoạt động ({users.filter((u) => u.is_active).length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'suspended' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('suspended')}
                  >
                    <Text style={[styles.filterChipText, currentFilter === 'suspended' && styles.filterChipTextActive]}>
                      Bị tạm khóa ({users.filter((u) => !u.is_active).length})
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Ô Search Input */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm theo tên tài khoản hoặc email..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={fetchData}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Table Body / Cards List */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loadingText}>Đang tải dữ liệu từ máy chủ...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="file-tray-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>Không tìm thấy người dùng nào</Text>
                  <Text style={styles.emptySubtitle}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</Text>
                </View>
              ) : (
                <View style={styles.userListContainer}>
                  {filteredUsers.map((item, index) => {
                    const isSelf = item.user_id === myAccount;
                    const isProcessing = actionLoadingId === item.user_id;

                    return (
                      <View key={item.user_id || index} style={styles.userRowCard}>
                        {/* Avatar & User Info */}
                        <View style={styles.userMainCol}>
                          <View
                            style={[
                              styles.userAvatar,
                              { backgroundColor: item.role === 'ADMIN' ? '#4F46E5' : '#0284C7' },
                            ]}
                          >
                            <Text style={styles.userAvatarText}>
                              {item.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>

                          <View style={styles.userTextInfo}>
                            <View style={styles.userNameRow}>
                              <Text style={styles.userName}>{item.display_name || 'Chưa đặt tên'}</Text>
                              {item.role === 'ADMIN' && (
                                <View style={styles.roleBadgeAdmin}>
                                  <Ionicons name="shield-checkmark" size={11} color="#6366F1" />
                                  <Text style={styles.roleBadgeAdminText}>ADMIN</Text>
                                </View>
                              )}
                              {isSelf && (
                                <View style={styles.roleBadgeSelf}>
                                  <Text style={styles.roleBadgeSelfText}>BẠN</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.userEmail}>{item.account}</Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusCol}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: item.is_active ? '#22C55E' : '#EF4444' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: item.is_active ? '#15803D' : '#B91C1C' },
                            ]}
                          >
                            {item.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </Text>
                        </View>

                        {/* Actions Col */}
                        <View style={styles.actionsCol}>
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                          ) : (
                            <>
                              {/* Nút Đổi quyền */}
                              <Pressable
                                style={styles.actionBtnSecondary}
                                onPress={() => handleChangeRole(item)}
                              >
                                <Ionicons
                                  name={item.role === 'ADMIN' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                                  size={15}
                                  color="#4B5563"
                                />
                                <Text style={styles.actionBtnText}>
                                  {item.role === 'ADMIN' ? 'Hạ USER' : 'Thăng ADMIN'}
                                </Text>
                              </Pressable>

                              {/* Nút Khóa / Mở khóa */}
                              <Pressable
                                style={[
                                  styles.actionBtnSecondary,
                                  item.is_active ? styles.btnDangerOutline : styles.btnSuccessOutline,
                                ]}
                                onPress={() => handleToggleStatus(item)}
                              >
                                <Ionicons
                                  name={item.is_active ? 'lock-closed-outline' : 'lock-open-outline'}
                                  size={14}
                                  color={item.is_active ? '#DC2626' : '#16A34A'}
                                />
                                <Text
                                  style={[
                                    styles.actionBtnText,
                                    { color: item.is_active ? '#DC2626' : '#16A34A' },
                                  ]}
                                >
                                  {item.is_active ? 'Khóa' : 'Mở'}
                                </Text>
                              </Pressable>

                              {/* Nút Xóa (không xóa chính mình) */}
                              {!isSelf && (
                                <Pressable
                                  style={styles.actionBtnIconOnly}
                                  onPress={() => handleDeleteUser(item)}
                                  hitSlop={8}
                                >
                                  <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                                </Pressable>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Chi tiết mục Trợ lý HQ AI & Bảo mật */}
            {activeMenu === 'ai' && (
              <View style={[styles.tableCard, { marginTop: 20 }]}>
                <Text style={styles.tableTitle}>Trí Tuệ Nhân Tạo HQ AI (Gemini Flash & Vector DB)</Text>
                <Text style={styles.tableSubtitle}>
                  Chỉ mục hóa tin nhắn bằng TF-IDF Vector Space Model và kết nối Google Gemini API
                </Text>
                <View style={{ marginTop: 16, flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                  <View style={styles.aiInfoBox}>
                    <Text style={styles.aiInfoNumber}>{stats?.vector_indexed_messages ?? 0}</Text>
                    <Text style={styles.aiInfoLabel}>Vector tin nhắn đã lập chỉ mục</Text>
                  </View>
                  <View style={styles.aiInfoBox}>
                    <Text style={[styles.aiInfoNumber, { color: '#16A34A' }]}>Sẵn sàng</Text>
                    <Text style={styles.aiInfoLabel}>Bộ lọc PII Shield bảo mật thông tin</Text>
                  </View>
                </View>
              </View>
            )}

            {activeMenu === 'security' && (
              <View style={[styles.tableCard, { marginTop: 20 }]}>
                <Text style={styles.tableTitle}>Nhật Ký Bảo Mật & Tiêu Chuẩn Truy Cập</Text>
                <Text style={styles.tableSubtitle}>
                  Cơ chế RBAC (Role-Based Access Control) bảo vệ các API quản trị và ẩn tài khoản Quản trị viên
                </Text>
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.securityBullet}>
                    • Tài khoản Quản trị viên được bảo vệ tuyệt đối: Người dùng thông thường không thể tìm kiếm hoặc gửi kết bạn tới Admin.
                  </Text>
                  <Text style={styles.securityBullet}>
                    • JWT Secret Signature xác thực trên từng phiên request.
                  </Text>
                  <Text style={styles.securityBullet}>
                    • Mã hóa mật khẩu an toàn với hàm băm SHA-256 tiêu chuẩn.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Modal Thêm Người Dùng Mới */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addUserModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Thêm Người Dùng Mới</Text>
                <Text style={styles.modalSubtitle}>Tạo tài khoản trực tiếp từ hệ thống quản trị</Text>
              </View>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Họ và tên hiển thị</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Nguyễn Văn A"
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Địa chỉ Email</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: user@chatapp.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mật khẩu ban đầu</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Vai trò tài khoản (Role)</Text>
              <View style={styles.rolePickerRow}>
                <Pressable
                  style={[
                    styles.roleOptionBtn,
                    newRole === 'USER' && styles.roleOptionBtnActive,
                  ]}
                  onPress={() => setNewRole('USER')}
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={newRole === 'USER' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'USER' && styles.roleOptionTextActive,
                    ]}
                  >
                    Thành viên (USER)
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.roleOptionBtn,
                    newRole === 'ADMIN' && styles.roleOptionBtnActiveAdmin,
                  ]}
                  onPress={() => setNewRole('ADMIN')}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={newRole === 'ADMIN' ? '#6366F1' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      newRole === 'ADMIN' && styles.roleOptionTextActiveAdmin,
                    ]}
                  >
                    Quản trị viên (ADMIN)
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={styles.modalSubmitBtn}
                onPress={handleCreateUser}
                disabled={isSubmittingNewUser}
              >
                {isSubmittingNewUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Tạo tài khoản</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar Styles
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    flexDirection: 'column',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  menuGroupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginLeft: 10,
    flex: 1,
  },
  menuItemTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  menuBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  switchAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
  },
  switchAppText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburgerBtn: {
    padding: 6,
    marginRight: 4,
  },
  breadcrumb: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  adminProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  adminNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  adminRoleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
  },

  bodyScroll: {
    flex: 1,
  },
  bodyScrollContent: {
    padding: 24,
    paddingBottom: 48,
  },

  // KPI Metrics Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  kpiGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  kpiGrowthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  kpiValueNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiSubText: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // Table Card
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tableHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tableTitleRow: {
    flex: 1,
  },
  tableTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addUserText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Filter Tabs
  filterRow: {
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  // User Row Card
  userListContainer: {
    gap: 10,
  },
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 12,
  },
  userMainCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 220,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  userTextInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  roleBadgeAdminText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
  },
  roleBadgeSelf: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeSelfText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  btnDangerOutline: {
    backgroundColor: '#FEF2F2',
  },
  btnSuccessOutline: {
    backgroundColor: '#F0FDF4',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionBtnIconOnly: {
    padding: 6,
    borderRadius: 6,
  },

  // AI & Security Cards
  aiInfoBox: {
    flex: 1,
    minWidth: 180,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiInfoNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 4,
  },
  aiInfoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  securityBullet: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 6,
  },

  // Loading & Empty
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mobileDrawerContainer: {
    height: '100%',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  addUserModalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  roleOptionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleOptionBtnActiveAdmin: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  roleOptionTextActiveAdmin: {
    color: '#6366F1',
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
