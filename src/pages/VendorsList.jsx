import React, { useState, useEffect } from "react";
import AdminLayout from "../components/Layout/AdminLayout";
import { vendorsAPI } from "../services/api";
import IconButton from "../components/UI/IconButton";
import "./VendorsList.css";

function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Helper functions for localStorage
  const getCacheKey = () => {
    return "vendors_cache_all";
  };

  const saveVendorsToCache = (vendorsData) => {
    try {
      const cacheKey = getCacheKey();
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          vendors: vendorsData,
          timestamp: Date.now(),
        }),
      );
    } catch (err) {
      console.error("Error saving vendors to localStorage:", err);
    }
  };

  const loadVendorsFromCache = () => {
    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { vendors: cachedVendors, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedVendors;
        }
      }
    } catch (err) {
      console.error("Error loading vendors from localStorage:", err);
    }
    return null;
  };

  // Fetch vendors on mount
  useEffect(() => {
    // Try cache first
    const cachedVendors = loadVendorsFromCache();
    if (cachedVendors && cachedVendors.length > 0) {
      setVendors(cachedVendors);
      setFilteredVendors(cachedVendors);
      setLoading(false);
    }
    fetchVendors();
  }, []);

  // Filter vendors
  useEffect(() => {
    let result = vendors;

    if (search) {
      result = result.filter(
        (v) =>
          v.name?.toLowerCase().includes(search.toLowerCase()) ||
          v.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
          v.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter === "pending") {
      result = result.filter(
        (v) => v.status === "PENDING" || v.status === "Pending",
      );
    } else if (statusFilter === "active") {
      result = result.filter(
        (v) =>
          v.status === "APPROVED" ||
          v.status === "Active" ||
          v.status === "ACTIVE",
      );
    }

    setFilteredVendors(result);
  }, [search, statusFilter, vendors]);

  // Fetch vendors from backend
  const fetchVendors = async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cachedVendors = loadVendorsFromCache();
        if (cachedVendors && cachedVendors.length > 0) {
          return; // Already loaded from cache in useEffect
        }
      }

      setLoading(true);
      setError(null);
      const response = await vendorsAPI.getAll();
      const vendorsData = response.data || [];
      setVendors(vendorsData);
      setFilteredVendors(vendorsData);

      // Save to cache
      saveVendorsToCache(vendorsData);
    } catch (err) {
      setError(err.message || "Failed to fetch vendors");
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  // Approval Workflow
  const handleApprove = async (id) => {
    try {
      await vendorsAPI.approve(id);
      // Update local state immediately
      const updatedVendors = vendors.map((v) =>
        v._id === id || v.id === id ? { ...v, status: "APPROVED" } : v,
      );
      setVendors(updatedVendors);
      setFilteredVendors(updatedVendors);
      saveVendorsToCache(updatedVendors);
      alert("Vendor approved successfully");
    } catch (err) {
      alert("Error approving vendor: " + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason) {
      try {
        await vendorsAPI.reject(id, reason);
        // Update local state immediately
        const updatedVendors = vendors.map((v) =>
          v._id === id || v.id === id ? { ...v, status: "REJECTED" } : v,
        );
        setVendors(updatedVendors);
        setFilteredVendors(updatedVendors);
        saveVendorsToCache(updatedVendors);
        alert("Vendor rejected successfully");
      } catch (err) {
        alert("Error rejecting vendor: " + err.message);
      }
    }
  };

  // Commission Update
  const handleCommissionChange = async (id, commission) => {
    const commissionValue = Number(commission);
    
    // Validate commission value
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      alert("Commission must be a number between 0 and 100");
      // Refresh to reset the input
      await fetchVendors(true);
      return;
    }

    try {
      await vendorsAPI.updateCommission(id, commissionValue);
      // Update local state immediately for better UX
      const updatedVendors = vendors.map((v) =>
        (v._id === id || v.id === id) ? { ...v, commission: commissionValue } : v
      );
      setVendors(updatedVendors);
      setFilteredVendors(updatedVendors);
      saveVendorsToCache(updatedVendors);
    } catch (err) {
      alert("Error updating commission: " + err.message);
      // Refresh to reset the input on error
      await fetchVendors(true);
    }
  };

  // Stats
  const awaitingApproval = vendors.filter(
    (v) => v.status === "PENDING" || v.status === "Pending",
  ).length;

  const totalGMV = vendors.reduce((sum, v) => {
    const revenue = parseFloat(v.totalRevenue || v.revenue || 0);
    return sum + (isNaN(revenue) ? 0 : revenue);
  }, 0);

  // Vendor form state
  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    slug: "",
    commission: 15,
  });

  // Handle edit vendor
  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setVendorFormData({
      name: vendor.name || "",
      ownerName: vendor.ownerName || vendor.owner || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      slug: vendor.slug || "",
      commission: vendor.commission || 15,
    });
    setShowEditModal(true);
  };

  // Handle update vendor
  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    try {
      await vendorsAPI.update(selectedVendor._id || selectedVendor.id, vendorFormData);
      alert("Vendor updated successfully");
      setShowEditModal(false);
      setSelectedVendor(null);
      await fetchVendors(true);
    } catch (err) {
      alert("Error updating vendor: " + err.message);
    }
  };

  // Handle view vendor details
  const handleViewDetails = async (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setVendorDetails(null);

    try {
      const response = await vendorsAPI.getDetails(vendor._id || vendor.id);
      if (response.success) {
        setVendorDetails(response.data);
      } else {
        alert("Failed to fetch vendor details");
      }
    } catch (err) {
      alert("Error fetching vendor details: " + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to generate slug from name
  const generateSlugFromName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, "") // Remove special characters except hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };

  // Check if slug exists
  const checkSlugExists = async (slug) => {
    if (!slug) return false;
    try {
      const response = await vendorsAPI.getBySlug(slug);
      return response.success && response.data !== null;
    } catch (err) {
      // If 404, slug doesn't exist (which is good)
      return false;
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!vendorFormData.name || !vendorFormData.email) {
      alert("Please fill in required fields (name, email)");
      return;
    }

    // Check if slug is provided and if it exists
    if (vendorFormData.slug && vendorFormData.slug.trim()) {
      const slugExists = await checkSlugExists(vendorFormData.slug.trim());
      if (slugExists) {
        alert("Slug isn't unique. Please use a different slug.");
        return;
      }
    }

    try {
      // Prepare form data - backend will auto-generate slug if not provided
      const formDataToSend = { ...vendorFormData };
      if (!formDataToSend.slug || !formDataToSend.slug.trim()) {
        // Remove slug if empty so backend generates it
        delete formDataToSend.slug;
      }

      await vendorsAPI.create(formDataToSend);
      alert("Vendor onboarded successfully");
      setShowAddModal(false);
      setVendorFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        slug: "",
        commission: 15,
      });
      await fetchVendors();
    } catch (err) {
      alert("Error onboarding vendor: " + err.message);
    }
  };

  // Auto-generate slug when name changes (only if slug is empty)
  const handleNameChange = (name) => {
    const newFormData = { ...vendorFormData, name };
    // Auto-generate slug only if slug field is empty
    if (!vendorFormData.slug || vendorFormData.slug.trim() === "") {
      newFormData.slug = generateSlugFromName(name);
    }
    setVendorFormData(newFormData);
  };

  return (
    <AdminLayout>
      <div className="vendors-container">
        {/* Header */}
        <div className="vendors-header-modern">
          <div>
            <h1>Vendor Management</h1>
            <p className="text-muted">
              Oversee vendor performance, approvals, and payouts.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">Export Report</button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Onboard Vendor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="vendors-overview-grid">
          <div className="stat-card">
            <div className="stat-value">{vendors.length}</div>
            <div className="stat-label">Total Vendors</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{awaitingApproval}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">₹{(totalGMV / 100000).toFixed(1)}L</div>
            <div className="stat-label">Total G.M.V.</div>
          </div>
        </div>

        {/* Controls */}
        <div className="vendors-controls-bar card">
          <div className="vendor-search-group">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor name, owner..."
              className="search-input"
            />
          </div>
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>
        </div>

        {/* Table */}
        <div className="card table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Vendor Detail</th>
                <th>Products</th>
                <th>Commission (%)</th>
                <th>Performance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading vendors...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--danger)",
                    }}
                  >
                    Error: {error}
                    <button
                      onClick={fetchVendors}
                      style={{ marginLeft: "10px" }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No vendors found
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const isPending =
                    vendor.status === "PENDING" || vendor.status === "Pending";
                  const isApproved =
                    vendor.status === "APPROVED" ||
                    vendor.status === "Active" ||
                    vendor.status === "ACTIVE";

                  return (
                    <tr key={vendor._id || vendor.id}>
                      <td>
                        <div className="vendor-identity">
                          <div className="vendor-logo">
                            {(vendor.name || "V").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="vendor-name-group">
                            <span className="vendor-brand">
                              {vendor.name || "Unknown Vendor"}
                            </span>
                            <span className="vendor-owner">
                              {vendor.ownerName ||
                                vendor.owner ||
                                vendor.email ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{vendor.productCount || vendor.products || 0}</td>
                      <td>
                        <div className="commission-input-wrapper">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={vendor.commission !== undefined ? vendor.commission : 15}
                            onChange={(e) => {
                              // Allow typing, but don't save until blur
                              const value = e.target.value;
                              // Update local state for immediate feedback
                              const updatedVendors = vendors.map((v) =>
                                (v._id === vendor._id || v.id === vendor.id) 
                                  ? { ...v, commission: value === '' ? '' : Number(value) } 
                                  : v
                              );
                              setVendors(updatedVendors);
                              setFilteredVendors(updatedVendors);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              const numValue = value === '' ? 15 : Number(value);
                              const currentCommission = vendor.commission !== undefined ? vendor.commission : 15;
                              
                              if (value !== '' && numValue !== currentCommission) {
                                handleCommissionChange(
                                  vendor._id || vendor.id,
                                  numValue,
                                );
                              } else if (value === '') {
                                // Reset to current value if empty
                                const resetVendors = vendors.map((v) =>
                                  (v._id === vendor._id || v.id === vendor.id) 
                                    ? { ...v, commission: currentCommission } 
                                    : v
                                );
                                setVendors(resetVendors);
                                setFilteredVendors(resetVendors);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                            placeholder="15"
                            className="commission-input"
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`rating-badge ${(vendor.rating || 0) >= 4.5 ? "high" : (vendor.rating || 0) >= 4 ? "avg" : "low"}`}
                        >
                          ⭐{" "}
                          {vendor.rating > 0 ? vendor.rating.toFixed(1) : "New"}
                        </span>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginTop: "4px",
                          }}
                        >
                          Rev: ₹{vendor.totalRevenue || vendor.revenue || 0}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${isApproved ? "success" : isPending ? "warning" : "secondary"}`}
                        >
                          {isApproved
                            ? "Approved"
                            : isPending
                              ? "Pending"
                              : vendor.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleViewDetails(vendor)}
                          >
                            Details
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleEditVendor(vendor)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Vendor Modal */}
        {showEditModal && selectedVendor && (
          <div className="modal-overlay" onClick={() => {
            setShowEditModal(false);
            setSelectedVendor(null);
          }}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "500px" }}
            >
              <div className="modal-header">
                <h2>Edit Vendor</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVendor(null);
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateVendor}>
                <div
                  className="modal-body"
                  style={{ display: "grid", gap: "15px" }}
                >
                  <div>
                    <label>Vendor Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorFormData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter vendor/brand name"
                    />
                  </div>
                  <div>
                    <label>Slug</label>
                    <input
                      type="text"
                      value={vendorFormData.slug}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          slug: e.target.value,
                        })
                      }
                      placeholder="Vendor slug"
                    />
                  </div>
                  <div>
                    <label>Owner Name</label>
                    <input
                      type="text"
                      value={vendorFormData.ownerName}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          ownerName: e.target.value,
                        })
                      }
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={vendorFormData.email}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={vendorFormData.phone}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label>Address</label>
                    <textarea
                      value={vendorFormData.address}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          address: e.target.value,
                        })
                      }
                      placeholder="Enter vendor address"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label>Commission (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={vendorFormData.commission}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          commission: Number(e.target.value),
                        })
                      }
                      placeholder="Commission percentage"
                    />
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedVendor(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Vendor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vendor Details Modal */}
        {showDetailsModal && selectedVendor && (
          <div className="modal-overlay" onClick={() => {
            setShowDetailsModal(false);
            setSelectedVendor(null);
            setVendorDetails(null);
          }}>
            <div
              className="modal-content vendor-details-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="modal-header">
                <h2>Vendor Details: {selectedVendor.name}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedVendor(null);
                    setVendorDetails(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {loadingDetails ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p>Loading vendor details...</p>
                  </div>
                ) : vendorDetails ? (
                  <>
                    {/* Vendor Info */}
                    <div className="details-section">
                      <h3>Vendor Information</h3>
                      <div className="details-grid">
                        <div><strong>Name:</strong> {vendorDetails.vendor.name}</div>
                        <div><strong>Email:</strong> {vendorDetails.vendor.email || "N/A"}</div>
                        <div><strong>Phone:</strong> {vendorDetails.vendor.phone || "N/A"}</div>
                        <div><strong>Owner:</strong> {vendorDetails.vendor.ownerName || vendorDetails.vendor.owner || "N/A"}</div>
                        <div><strong>Status:</strong> {vendorDetails.vendor.status || "N/A"}</div>
                        <div><strong>Commission:</strong> {vendorDetails.vendor.commission || 0}%</div>
                      </div>
                    </div>

                    {/* Sales Statistics */}
                    <div className="details-section">
                      <h3>Sales Statistics</h3>
                      <div className="stats-grid">
                        <div className="stat-box">
                          <div className="stat-value">{formatCurrency(vendorDetails.sales.totalSales)}</div>
                          <div className="stat-label">Total Sales</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{vendorDetails.sales.totalOrders}</div>
                          <div className="stat-label">Total Orders</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{vendorDetails.sales.completedOrders}</div>
                          <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{vendorDetails.sales.pendingOrders}</div>
                          <div className="stat-label">Pending</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{formatCurrency(vendorDetails.sales.totalCommission || 0)}</div>
                          <div className="stat-label">Total Commission</div>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="details-section">
                      <h3>All Products ({vendorDetails.products.total})</h3>
                      {vendorDetails.products.list.length > 0 ? (
                        <div className="products-table-container">
                          <table className="products-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Category</th>
                                <th>Subcategory</th>
                                <th>Rating</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendorDetails.products.list.map((product) => (
                                <tr key={product._id}>
                                  <td className="product-name-cell">{product.name || "N/A"}</td>
                                  <td>₹{product.price || 0}</td>
                                  <td>{product.stock !== undefined ? product.stock : "N/A"}</td>
                                  <td>
                                    <span className={`product-status ${product.isActive !== false ? "active" : "inactive"}`}>
                                      {product.isActive !== false ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                  <td>{product.category || "N/A"}</td>
                                  <td>{product.subcategory || "N/A"}</td>
                                  <td>{product.rating ? `⭐ ${product.rating.toFixed(1)}` : "N/A"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p>No products found for this vendor.</p>
                      )}
                    </div>

                    {/* Orders */}
                    <div className="details-section">
                      <h3>All Orders ({vendorDetails.orders.length})</h3>
                      {vendorDetails.orders.length > 0 ? (
                        <div className="orders-table-container">
                          <table className="orders-table">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Amount</th>
                                <th>Commission</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendorDetails.orders.map((order) => (
                                <tr key={order.orderId}>
                                  <td className="order-id-cell">{order.orderId}</td>
                                  <td>{formatCurrency(order.totalAmount)}</td>
                                  <td className="commission-cell">{formatCurrency(order.commission || 0)}</td>
                                  <td>
                                    <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
                                      {order.orderStatus}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
                                      {order.paymentStatus}
                                    </span>
                                  </td>
                                  <td>{formatDate(order.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p>No orders found for this vendor.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p>Failed to load vendor details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onboard Vendor Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "500px" }}
            >
              <div className="modal-header">
                <h2>Onboard New Vendor</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateVendor}>
                <div
                  className="modal-body"
                  style={{ display: "grid", gap: "15px" }}
                >
                  <div>
                    <label>Vendor Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorFormData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter vendor/brand name"
                    />
                  </div>
                  <div>
                    <label>Slug (Optional)</label>
                    <input
                      type="text"
                      value={vendorFormData.slug}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          slug: e.target.value,
                        })
                      }
                      placeholder="Auto-generated from name (optional)"
                    />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={vendorFormData.email}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={vendorFormData.phone}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                  <div>
                    <label>Address</label>
                    <textarea
                      value={vendorFormData.address}
                      onChange={(e) =>
                        setVendorFormData({
                          ...vendorFormData,
                          address: e.target.value,
                        })
                      }
                      placeholder="Enter vendor address (optional)"
                      rows="3"
                    />
                  </div>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Onboard Vendor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default VendorsList;
