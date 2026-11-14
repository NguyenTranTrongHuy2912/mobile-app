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
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { API_URL } from '../config';
import { logout } from '../features/session/sessionSlice';
import { useRouter } from 'expo-router';

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

type AdminMenuKey = 'users' | 'overview' | 'rooms' | 'ai' | 'security';
type FilterType = 'all' | 'admin' | 'user' | 'active' | 'suspended';

export default function AdminDashboardScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;

  const token = useSelector((state: RootState) => state.session.token);
  const myName = useSelector((state: RootState) => state.session.displayName) || 'Administrator';
  const myAccount = useSelector((state: RootState) => state.session.userId);
  const myRole = useSelector((state: RootState) => state.session.role);

  // Bảo mật tuyệt đối: Chỉ có Quản trị viên (ADMIN) mới được truy cập Bảng điều khiển
  useEffect(() => {
    if (myRole !== 'ADMIN') {
      Alert.alert(
        'Từ chối truy cập',
        'Khu vực này chỉ dành riêng cho Quản trị viên hệ thống. Người dùng không có quyền truy cập.'
      );
      router.replace('/(app)/(tabs)/rooms');
    }
  }, [myRole, router]);

  // Tính toán top padding an toàn tránh thanh trạng thái / tai thỏ
  const topSafePadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

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

  // Modal Thêm người dùng mới với xác thực mã OTP
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

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
        // Luôn đảm bảo tài khoản nguyenvanquoclt1@gmail.com có role USER
        const rawUsers: AdminUserItem[] = usersData.users || [];
        const normalizedUsers = rawUsers.map((u) => {
          if (u.account?.toLowerCase() === 'nguyenvanquoclt1@gmail.com') {
            return { ...u, role: 'USER' as const };
          }
          return u;
        });
        setUsers(normalizedUsers);
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
    const actionText =
      updatedRole === 'ADMIN'
        ? 'thăng cấp làm Quản trị viên (ADMIN)'
        : 'hạ cấp xuống Thành viên (USER)';

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

  // Đếm ngược gửi lại mã OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // Bước 1: Admin yêu cầu gửi mã OTP về email của người dùng mới
  const handleRequestOtpForNewUser = async () => {
    const cleanMail = newEmail.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@') || !cleanMail.includes('.')) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải có độ dài ít nhất 6 ký tự.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account: cleanMail,
          display_name: newName.trim() || cleanMail.split('@')[0],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          'Đã gửi mã OTP',
          `Mã xác thực OTP gồm 6 chữ số đã được gửi trực tiếp đến hộp thư "${cleanMail}". Vui lòng kiểm tra hộp thư đến (hoặc thư rác Spam) để lấy mã xác thực.`,
          [{ text: 'Nhập mã ngay' }]
        );
        setOtpStep('otp');
        setOtpCooldown(60);
        setOtpCode('');
      } else {
        Alert.alert('Lỗi', data.detail || 'Không thể gửi mã xác thực OTP.');
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ khi gửi mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Bước 2: Admin xác thực mã OTP và hoàn tất tạo người dùng mới
  const handleCreateUser = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã xác thực OTP gồm 6 chữ số đã được gửi về email.');
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
          otp_code: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thành công', 'Đã xác thực OTP và tạo tài khoản người dùng mới thành công!');
        setShowAddModal(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setOtpCode('');
        setOtpStep('form');
        setNewRole('USER');
        fetchData();
      } else {
        Alert.alert('Lỗi', data.detail || 'Mã xác thực OTP không đúng hoặc đã hết hạn.');
      }
    } catch {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ khi xác thực tạo tài khoản.');
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

  // Đăng xuất Admin
  const handleLogout = () => {
    Alert.alert('Đăng xuất Quản trị viên', 'Bạn có chắc chắn muốn đăng xuất khỏi cổng Quản trị?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => dispatch(logout() as any) },
    ]);
  };

  // Sidebar Menu Content (Thuần túy Quản trị, KHÔNG có Chat)
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.brandTitle}>HQ Admin Portal</Text>
          <Text style={styles.brandSub}>Hệ thống Quản trị & Điều hành</Text>
        </View>
      </View>

      {/* Thông tin Admin hiện tại */}
      <View style={styles.sidebarAdminCard}>
        <View style={styles.sidebarAdminAvatar}>
          <Text style={styles.sidebarAdminAvatarText}>{myName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarAdminName} numberOfLines={1}>{myName}</Text>
          <View style={styles.sidebarAdminRoleTag}>
            <Text style={styles.sidebarAdminRoleText}>HỆ THỐNG ADMIN</Text>
          </View>
        </View>
      </View>

      {/* Danh sách Menu Quản trị */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.menuGroupHeader}>CHỨC NĂNG QUẢN TRỊ</Text>

        <Pressable
          style={[styles.menuItem, activeMenu === 'users' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('users');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="people"
            size={18}
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
          style={[styles.menuItem, activeMenu === 'overview' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('overview');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="pie-chart"
            size={18}
            color={activeMenu === 'overview' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'overview' && styles.menuItemTextActive]}>
            Thống kê tổng quan
          </Text>
        </Pressable>

        <Pressable
          style={[styles.menuItem, activeMenu === 'rooms' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('rooms');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color={activeMenu === 'rooms' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'rooms' && styles.menuItemTextActive]}>
            Giám sát phòng chat
          </Text>
        </Pressable>

        <Text style={[styles.menuGroupHeader, { marginTop: 20 }]}>TRÍ TUỆ NHÂN TẠO & AN NINH</Text>

        <Pressable
          style={[styles.menuItem, activeMenu === 'ai' && styles.menuItemActive]}
          onPress={() => {
            setActiveMenu('ai');
            setIsSidebarOpenMobile(false);
          }}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color={activeMenu === 'ai' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'ai' && styles.menuItemTextActive]}>
            Trợ lý HQ AI Core
          </Text>
          <View style={[styles.menuBadge, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.menuBadgeText, { color: '#4F46E5' }]}>Gemini</Text>
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
            name="lock-closed"
            size={18}
            color={activeMenu === 'security' ? '#2563EB' : '#64748B'}
          />
          <Text style={[styles.menuItemText, activeMenu === 'security' && styles.menuItemTextActive]}>
            Bảo mật & Quyền riêng tư
          </Text>
        </Pressable>
      </ScrollView>

      {/* Đăng xuất Admin duy nhất ở cuối */}
      <View style={styles.sidebarFooter}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất Quản trị</Text>
        </Pressable>
      </View>
    </View>
  );

  if (myRole !== 'ADMIN') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" />

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
              <View style={[styles.mobileDrawerContainer, { width: Math.min(width * 0.82, 320) }]}>
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
          {/* Top Bar Header - CĂN CHỈNH AN TOÀN TRÁNH STATUS BAR */}
          <View style={[styles.topBar, { paddingTop: topSafePadding + 6 }]}>
            <View style={styles.topBarLeft}>
              {!isLargeScreen && (
                <Pressable
                  style={styles.hamburgerBtn}
                  onPress={() => setIsSidebarOpenMobile(true)}
                  hitSlop={10}
                >
                  <Ionicons name="menu" size={24} color="#0F172A" />
                </Pressable>
              )}
              <View>
                <Text style={styles.pageTitle}>
                  {activeMenu === 'users'
                    ? 'Quản Lý Người Dùng'
                    : activeMenu === 'overview'
                    ? 'Tổng Quan Hệ Thống'
                    : activeMenu === 'rooms'
                    ? 'Giám Sát Phòng Chat'
                    : activeMenu === 'ai'
                    ? 'Cấu Hình HQ AI'
                    : 'Bảo Mật & Nhật Ký'}
                </Text>
                <Text style={styles.breadcrumb}>
                  Cổng Quản Trị • {users.length} tài khoản • MongoDB Atlas
                </Text>
              </View>
            </View>

            <View style={styles.topBarRight}>
              <Pressable style={styles.refreshBtn} onPress={onRefresh} hitSlop={8}>
                <Ionicons name="sync-outline" size={16} color="#2563EB" />
                <Text style={styles.refreshText}>Làm mới</Text>
              </Pressable>

              <Pressable style={styles.adminMiniBadge} onPress={handleLogout} hitSlop={8}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Main Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {/* 4 Thẻ KPI Metrics GỌN GÀNG (Xếp 2x2 trên mobile) */}
            <View style={styles.kpiGridCompact}>
              {/* Thẻ 1: Tổng người dùng */}
              <View style={styles.kpiCardCompact}>
                <View style={styles.kpiCompactHeader}>
                  <Text style={styles.kpiCompactLabel}>TỔNG USER</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="people" size={16} color="#2563EB" />
                  </View>
                </View>
                <View style={styles.kpiCompactValueRow}>
                  <Text style={styles.kpiCompactNumber}>{stats?.total_users ?? users.length}</Text>
                  <View style={[styles.kpiMiniTag, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.kpiMiniTagText, { color: '#16A34A' }]}>+5%</Text>
                  </View>
                </View>
                <Text style={styles.kpiCompactSub}>Tài khoản đăng ký</Text>
              </View>

              {/* Thẻ 2: Trực tuyến */}
              <View style={styles.kpiCardCompact}>
                <View style={styles.kpiCompactHeader}>
                  <Text style={styles.kpiCompactLabel}>HOẠT ĐỘNG</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="pulse" size={16} color="#16A34A" />
                  </View>
                </View>
                <View style={styles.kpiCompactValueRow}>
                  <Text style={[styles.kpiCompactNumber, { color: '#16A34A' }]}>
                    {stats?.total_active_users ?? users.filter((u) => u.is_active).length}
                  </Text>
                  <View style={[styles.kpiMiniTag, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.kpiMiniTagText, { color: '#16A34A' }]}>Online</Text>
                  </View>
                </View>
                <Text style={styles.kpiCompactSub}>Đang hoạt động</Text>
              </View>

              {/* Thẻ 3: Phòng chat */}
              <View style={styles.kpiCardCompact}>
                <View style={styles.kpiCompactHeader}>
                  <Text style={styles.kpiCompactLabel}>PHÒNG CHAT</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="chatbubbles" size={16} color="#7C3AED" />
                  </View>
                </View>
                <View style={styles.kpiCompactValueRow}>
                  <Text style={[styles.kpiCompactNumber, { color: '#7C3AED' }]}>
                    {stats?.total_rooms ?? 0}
                  </Text>
                  <View style={[styles.kpiMiniTag, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[styles.kpiMiniTagText, { color: '#7C3AED' }]}>Realtime</Text>
                  </View>
                </View>
                <Text style={styles.kpiCompactSub}>1-1 & Nhóm</Text>
              </View>

              {/* Thẻ 4: Tổng tin nhắn */}
              <View style={styles.kpiCardCompact}>
                <View style={styles.kpiCompactHeader}>
                  <Text style={styles.kpiCompactLabel}>TIN NHẮN</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="mail-unread" size={16} color="#EA580C" />
                  </View>
                </View>
                <View style={styles.kpiCompactValueRow}>
                  <Text style={[styles.kpiCompactNumber, { color: '#EA580C' }]}>
                    {stats?.total_messages ?? 0}
                  </Text>
                  <View style={[styles.kpiMiniTag, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={[styles.kpiMiniTagText, { color: '#EA580C' }]}>AI Ready</Text>
                  </View>
                </View>
                <Text style={styles.kpiCompactSub}>Tin nhắn trao đổi</Text>
              </View>
            </View>

            {/* BẢNG QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG */}
            <View style={styles.tableCard}>
              {/* Header của bảng: Tiêu đề + Nút thêm người dùng */}
              <View style={styles.tableHeaderBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableTitle}>Danh Sách Tài Khoản</Text>
                  <Text style={styles.tableSubtitle}>
                    Quản lý phân quyền và kiểm soát bảo mật tài khoản
                  </Text>
                </View>

                <Pressable
                  style={styles.addUserButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="person-add" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.addUserText}>Thêm người dùng</Text>
                </Pressable>
              </View>

              {/* Thanh tìm kiếm trực tiếp */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên hiển thị hoặc địa chỉ email..."
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

              {/* Filter Tabs Chips */}
              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Pressable
                    style={[styles.filterChip, currentFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        currentFilter === 'all' && styles.filterChipTextActive,
                      ]}
                    >
                      Tất cả ({users.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'admin' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('admin')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        currentFilter === 'admin' && styles.filterChipTextActive,
                      ]}
                    >
                      Quản trị viên ({users.filter((u) => u.role === 'ADMIN').length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'user' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('user')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        currentFilter === 'user' && styles.filterChipTextActive,
                      ]}
                    >
                      Người dùng ({users.filter((u) => u.role === 'USER').length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'active' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('active')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        currentFilter === 'active' && styles.filterChipTextActive,
                      ]}
                    >
                      Hoạt động ({users.filter((u) => u.is_active).length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.filterChip, currentFilter === 'suspended' && styles.filterChipActive]}
                    onPress={() => setCurrentFilter('suspended')}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        currentFilter === 'suspended' && styles.filterChipTextActive,
                      ]}
                    >
                      Đã khóa ({users.filter((u) => !u.is_active).length})
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Danh sách người dùng dạng Card thân thiện, rõ ràng */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={44} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>Không có tài khoản nào phù hợp</Text>
                  <Text style={styles.emptySubtitle}>Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm</Text>
                </View>
              ) : (
                <View style={styles.userListContainer}>
                  {filteredUsers.map((item, index) => {
                    const isSelf = item.user_id === myAccount;
                    const isProcessing = actionLoadingId === item.user_id;

                    return (
                      <View key={item.user_id || index} style={styles.userRowCard}>
                        {/* Hàng trên: Avatar, Tên, Badge, Email */}
                        <View style={styles.userTopRow}>
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

                          <View style={styles.userMainInfo}>
                            <View style={styles.userNameRow}>
                              <Text style={styles.userName} numberOfLines={1}>
                                {item.display_name || 'Chưa đặt tên'}
                              </Text>

                              {item.role === 'ADMIN' ? (
                                <View style={styles.roleBadgeAdmin}>
                                  <Ionicons name="shield-checkmark" size={10} color="#4F46E5" />
                                  <Text style={styles.roleBadgeAdminText}>ADMIN</Text>
                                </View>
                              ) : (
                                <View style={styles.roleBadgeUser}>
                                  <Text style={styles.roleBadgeUserText}>USER</Text>
                                </View>
                              )}

                              {isSelf && (
                                <View style={styles.roleBadgeSelf}>
                                  <Text style={styles.roleBadgeSelfText}>BẠN</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.userEmail} numberOfLines={1}>
                              {item.account}
                            </Text>
                          </View>

                          {/* Chấm trạng thái góc phải */}
                          <View style={styles.statusBadgeWrap}>
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
                        </View>

                        {/* Hàng dưới: Bộ nút thao tác xử lý nghiệp vụ */}
                        <View style={styles.userBottomActions}>
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                          ) : (
                            <>
                              {/* Nút Đổi quyền */}
                              <Pressable
                                style={styles.actionChipBtn}
                                onPress={() => handleChangeRole(item)}
                              >
                                <Ionicons
                                  name={
                                    item.role === 'ADMIN'
                                      ? 'arrow-down-circle-outline'
                                      : 'arrow-up-circle-outline'
                                  }
                                  size={14}
                                  color="#3B82F6"
                                />
                                <Text style={[styles.actionChipText, { color: '#2563EB' }]}>
                                  {item.role === 'ADMIN' ? 'Hạ xuống USER' : 'Thăng làm ADMIN'}
                                </Text>
                              </Pressable>

                              {/* Nút Khóa / Mở */}
                              <Pressable
                                style={[
                                  styles.actionChipBtn,
                                  item.is_active ? styles.btnLock : styles.btnUnlock,
                                ]}
                                onPress={() => handleToggleStatus(item)}
                              >
                                <Ionicons
                                  name={item.is_active ? 'lock-closed-outline' : 'lock-open-outline'}
                                  size={13}
                                  color={item.is_active ? '#DC2626' : '#16A34A'}
                                />
                                <Text
                                  style={[
                                    styles.actionChipText,
                                    { color: item.is_active ? '#DC2626' : '#16A34A' },
                                  ]}
                                >
                                  {item.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                                </Text>
                              </Pressable>

                              {/* Nút Xóa (trừ tài khoản của chính mình) */}
                              {!isSelf && (
                                <Pressable
                                  style={styles.actionDeleteIconBtn}
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
              <View style={[styles.tableCard, { marginTop: 16 }]}>
                <Text style={styles.tableTitle}>Trợ Lý Trí Tuệ Nhân Tạo HQ AI (Gemini Flash)</Text>
                <Text style={styles.tableSubtitle}>
                  Chỉ mục hóa tin nhắn bằng TF-IDF Vector Space Model và kết nối Google Gemini API
                </Text>
                <View style={{ marginTop: 14, flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxNumber}>{stats?.vector_indexed_messages ?? 0}</Text>
                    <Text style={styles.infoBoxLabel}>Vector tin nhắn đã lập chỉ mục</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={[styles.infoBoxNumber, { color: '#16A34A' }]}>Sẵn sàng</Text>
                    <Text style={styles.infoBoxLabel}>Bộ lọc PII Shield bảo mật thông tin</Text>
                  </View>
                </View>
              </View>
            )}

            {activeMenu === 'security' && (
              <View style={[styles.tableCard, { marginTop: 16 }]}>
                <Text style={styles.tableTitle}>Tiêu Chuẩn Bảo Mật & Quyền Riêng Tư</Text>
                <Text style={styles.tableSubtitle}>
                  Bảo vệ tài khoản Quản trị viên và phân quyền RBAC đa cấp độ
                </Text>
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.securityItem}>
                    ✓ Ẩn tài khoản Admin: Người dùng thông thường không nhìn thấy tài khoản của Quản trị viên trong tìm kiếm hay gợi ý.
                  </Text>
                  <Text style={styles.securityItem}>
                    ✓ Chặn kết bạn tới Admin: Gateway tự động từ chối mọi yêu cầu kết bạn gửi đến tài khoản Quản trị.
                  </Text>
                  <Text style={styles.securityItem}>
                    ✓ Mã hóa đường truyền an toàn TLS 1.3 và băm mật khẩu chuẩn SHA-256.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Modal Thêm Người Dùng Mới với Quy Trình Xác Thực OTP Bắt Buộc */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowAddModal(false);
          setOtpStep('form');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addUserModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Thêm Người Dùng Mới</Text>
                <Text style={styles.modalSubtitle}>
                  {otpStep === 'form'
                    ? 'Bước 1: Nhập thông tin & gửi mã OTP xác thực'
                    : 'Bước 2: Nhập mã OTP đã gửi về email'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setOtpStep('form');
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            {otpStep === 'form' ? (
              <>
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
                  <Text style={styles.formLabel}>Địa chỉ Email nhận OTP</Text>
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
                  <Text style={styles.formLabel}>Mật khẩu khởi tạo</Text>
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
                        size={15}
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
                        size={15}
                        color={newRole === 'ADMIN' ? '#4F46E5' : '#64748B'}
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

                {/* Modal Buttons Form Step */}
                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalSubmitBtn}
                    onPress={handleRequestOtpForNewUser}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="mail" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.modalSubmitText}>Gửi mã OTP xác thực</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* Bước 2: Nhập mã OTP đã gửi */}
                <View style={styles.otpNoticeBox}>
                  <Ionicons name="mail-open-outline" size={24} color="#2563EB" style={{ marginBottom: 6 }} />
                  <Text style={styles.otpNoticeTitle}>Đã gửi mã xác thực OTP!</Text>
                  <Text style={styles.otpNoticeSub}>
                    Mã 6 chữ số đã được gửi đến email <Text style={{ fontWeight: '700', color: '#0F172A' }}>{newEmail}</Text>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác/Spam).
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mã xác thực OTP (6 chữ số)</Text>
                  <TextInput
                    style={[styles.formInput, styles.otpBigInput]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    autoFocus
                  />
                </View>

                <View style={styles.resendRow}>
                  {otpCooldown > 0 ? (
                    <Text style={styles.resendCooldownText}>
                      Gửi lại mã sau {otpCooldown}s
                    </Text>
                  ) : (
                    <Pressable onPress={handleRequestOtpForNewUser} disabled={isSendingOtp}>
                      <Text style={styles.resendActionText}>
                        {isSendingOtp ? 'Đang gửi lại...' : 'Chưa nhận được mã? Gửi lại ngay'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Modal Buttons OTP Step */}
                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setOtpStep('form')}
                  >
                    <Text style={styles.modalCancelText}>Quay lại</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalSubmitBtn}
                    onPress={handleCreateUser}
                    disabled={isSubmittingNewUser}
                  >
                    {isSubmittingNewUser ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.modalSubmitText}>Xác thực OTP & Tạo</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar Styles
  sidebar: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    flexDirection: 'column',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  sidebarAdminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sidebarAdminAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarAdminAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sidebarAdminName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sidebarAdminRoleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3,
  },
  sidebarAdminRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  menuGroupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 3,
  },
  menuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  menuItemText: {
    fontSize: 13,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hamburgerBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  breadcrumb: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  adminMiniBadge: {
    padding: 7,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },

  bodyScroll: {
    flex: 1,
  },
  bodyScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // KPI Grid 2x2 CỰC GỌN TRÊN MOBILE
  kpiGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCardCompact: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiCompactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCompactValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  kpiCompactNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiMiniTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kpiMiniTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiCompactSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Table Card
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  tableHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addUserText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  // Filter Row
  filterRow: {
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // User List Cards
  userListContainer: {
    gap: 8,
  },
  userRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  userMainInfo: {
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
  },
  roleBadgeAdminText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  roleBadgeUser: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeUserText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  roleBadgeSelf: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeSelfText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Bottom Actions Row
  userBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 6,
  },
  actionChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  btnLock: {
    backgroundColor: '#FEF2F2',
  },
  btnUnlock: {
    backgroundColor: '#F0FDF4',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionDeleteIconBtn: {
    padding: 6,
    marginLeft: 'auto',
  },

  // AI & Security Info Boxes
  infoBox: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoBoxNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 2,
  },
  infoBoxLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  securityItem: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 6,
  },

  // Loading & Empty
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mobileDrawerContainer: {
    height: '100%',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  addUserModalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 5,
  },
  roleOptionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleOptionBtnActiveAdmin: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  roleOptionTextActiveAdmin: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  otpNoticeBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  otpNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  otpNoticeSub: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  otpBigInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 12,
    color: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendCooldownText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  resendActionText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
});
