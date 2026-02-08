import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { usersAPI } from '../services/api';
import './Users.css';

function Users() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    currentMonthUsers: 0,
    lastMonthUsers: 0,
    percentChange: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const limit = 10;

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await usersAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch users list
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.getList({ page, limit });
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.totalUsers);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const response = await usersAPI.getDetails(userId);
      if (response.success) {
        setUserDetails(response.data);
        setShowUserDetails(true);
      } else {
        alert('Failed to fetch user details');
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewDetails = (userId) => {
    setSelectedUserId(userId);
    fetchUserDetails(userId);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUserId(userToDelete._id);
      const response = await usersAPI.delete(userToDelete._id);
      
      if (response.success) {
        // Refresh users list
        await fetchUsers(currentPage);
        // Close modal if it's open
        if (showUserDetails && userDetails?.user._id === userToDelete._id) {
          setShowUserDetails(false);
        }
        alert('User deleted successfully');
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setDeletingUserId(null);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <AdminLayout>
      <div className="users-page">
        <div className="page-header">
          <h1>Users Management</h1>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p className="stat-value">{stats.activeUsers.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>This Month</h3>
              <p className="stat-value">{stats.currentMonthUsers.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Last Month</h3>
              <p className="stat-value">{stats.lastMonthUsers.toLocaleString()}</p>
            </div>
          </div>

          <div className={`stat-card ${stats.percentChange >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-icon">{stats.percentChange >= 0 ? '📈' : '📉'}</div>
            <div className="stat-content">
              <h3>Change</h3>
              <p className="stat-value">
                {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="users-section">
          <div className="section-header">
            <h2>Users List</h2>
            <span className="total-count">Total: {totalUsers}</span>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={() => fetchUsers(currentPage)}>Retry</button>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-name-cell">
                            {user.avatar && (
                              <img src={user.avatar} alt={user.name} className="user-avatar" />
                            )}
                            <span>{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{user.totalOrders || 0}</td>
                        <td className="revenue-cell">{formatCurrency(user.totalRevenue || 0)}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-view-details"
                              onClick={() => handleViewDetails(user._id)}
                              disabled={loadingDetails}
                            >
                              {loadingDetails && selectedUserId === user._id ? 'Loading...' : 'View Details'}
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteClick(user)}
                              disabled={deletingUserId === user._id}
                            >
                              {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Details Modal */}
        {showUserDetails && userDetails && (
          <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>User Details</h2>
                <div className="modal-header-actions">
                  <button
                    className="btn-delete-modal"
                    onClick={() => handleDeleteClick(userDetails.user)}
                    disabled={deletingUserId === userDetails.user._id}
                  >
                    {deletingUserId === userDetails.user._id ? 'Deleting...' : 'Delete User'}
                  </button>
                  <button className="modal-close" onClick={() => setShowUserDetails(false)}>×</button>
                </div>
              </div>

              <div className="modal-body">
                {/* User Information */}
                <div className="details-section">
                  <h3>User Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{userDetails.user.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{userDetails.user.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{userDetails.user.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Profile Complete:</label>
                      <span>{userDetails.user.isProfileComplete ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={userDetails.user.isActive ? 'status-active' : 'status-inactive'}>
                        {userDetails.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Joined:</label>
                      <span>{formatDate(userDetails.user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {(userDetails.user.addressLine1 || userDetails.user.city) && (
                  <div className="details-section">
                    <h3>Address</h3>
                    <div className="address-details">
                      {userDetails.user.fullName && <p><strong>Name:</strong> {userDetails.user.fullName}</p>}
                      {userDetails.user.addressLine1 && <p><strong>Address Line 1:</strong> {userDetails.user.addressLine1}</p>}
                      {userDetails.user.addressLine2 && <p><strong>Address Line 2:</strong> {userDetails.user.addressLine2}</p>}
                      {userDetails.user.area && <p><strong>Area:</strong> {userDetails.user.area}</p>}
                      {userDetails.user.block && <p><strong>Block:</strong> {userDetails.user.block}</p>}
                      {userDetails.user.landmark && <p><strong>Landmark:</strong> {userDetails.user.landmark}</p>}
                      {userDetails.user.city && (
                        <p>
                          <strong>City, State, Pincode:</strong>{' '}
                          {[userDetails.user.city, userDetails.user.state, userDetails.user.pincode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Revenue Statistics */}
                <div className="details-section">
                  <h3>Revenue Statistics</h3>
                  <div className="revenue-stats">
                    <div className="revenue-stat-item">
                      <label>Total Revenue:</label>
                      <span className="revenue-value">{formatCurrency(userDetails.revenue.totalRevenue)}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Total Orders:</label>
                      <span>{userDetails.revenue.totalOrders}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Completed Orders:</label>
                      <span>{userDetails.revenue.completedOrders}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Pending Orders:</label>
                      <span>{userDetails.revenue.pendingOrders}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Cancelled Orders:</label>
                      <span>{userDetails.revenue.cancelledOrders}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Average Order Value:</label>
                      <span>{formatCurrency(userDetails.revenue.averageOrderValue)}</span>
                    </div>
                    <div className="revenue-stat-item">
                      <label>Last Order Date:</label>
                      <span>{formatDate(userDetails.revenue.lastOrderDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {userDetails.orders && userDetails.orders.length > 0 && (
                  <div className="details-section">
                    <h3>Orders ({userDetails.orders.length})</h3>
                    <div className="orders-list">
                      {userDetails.orders.map((order) => (
                        <div key={order._id} className="order-item">
                          <div className="order-header">
                            <span className="order-id">Order #{order._id.toString().slice(-8)}</span>
                            <span className={`order-status ${order.orderStatus.toLowerCase()}`}>
                              {order.orderStatus}
                            </span>
                            <span className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
                              {order.paymentStatus}
                            </span>
                            {order.paymentMethod && (
                              <span className="payment-method">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod}
                              </span>
                            )}
                          </div>
                          <div className="order-details">
                            <p><strong>Amount:</strong> {formatCurrency(order.totalAmount)}</p>
                            <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                            {order.items && order.items.length > 0 && (
                              <div className="order-items">
                                <strong>Items:</strong>
                                <ul>
                                  {order.items.map((item, idx) => (
                                    <li key={idx}>
                                      {item.productId?.name || 'Product'} - Qty: {item.quantity} - {formatCurrency(item.price)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete User</h2>
                <button className="modal-close" onClick={handleDeleteCancel}>×</button>
              </div>
              <div className="modal-body">
                <p className="delete-warning">
                  Are you sure you want to delete user <strong>{userToDelete.name || userToDelete.email || 'this user'}</strong>?
                </p>
                <p className="delete-note">
                  This action cannot be undone. The user and all associated orders will be permanently removed from the system.
                </p>
                {userToDelete.totalOrders > 0 && (
                  <p className="delete-warning-note">
                    ⚠️ This user has {userToDelete.totalOrders} order(s) that will also be deleted.
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={handleDeleteCancel}
                    disabled={deletingUserId === userToDelete._id}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-confirm-delete"
                    onClick={handleDeleteConfirm}
                    disabled={deletingUserId === userToDelete._id}
                  >
                    {deletingUserId === userToDelete._id ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Users;
