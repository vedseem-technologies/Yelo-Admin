import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/Layout/AdminLayout";
import { shopsAPI, campaignsAPI } from "../services/api"; // Added campaignsAPI
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";
import IconButton from "../components/UI/IconButton";
import "./CampaignEventManager.css";

// --- Constants & Config ---
const FONT_OPTIONS = [
  {
    category: "Website Defaults",
    label: "Geist Sans (Main)",
    value: "var(--font-geist-sans), sans-serif",
  },
  {
    category: "Website Defaults",
    label: "Geist Mono",
    value: "var(--font-geist-mono), monospace",
  },
  {
    category: "Website Defaults",
    label: "Arial / Helvetica",
    value: "Arial, Helvetica, sans-serif",
  },
  { category: "System", label: "System Sans", value: "sans-serif" },
  { category: "System", label: "System Serif", value: "serif" },
  { category: "Google Fonts", label: "Inter", value: '"Inter", sans-serif' },
  { category: "Google Fonts", label: "Roboto", value: '"Roboto", sans-serif' },
  {
    category: "Google Fonts",
    label: "Playfair Display",
    value: '"Playfair Display", serif',
  },
  {
    category: "Google Fonts",
    label: "Montserrat",
    value: '"Montserrat", sans-serif',
  },
  {
    category: "Google Fonts",
    label: "Open Sans",
    value: '"Open Sans", sans-serif',
  },
  { category: "Google Fonts", label: "Lato", value: '"Lato", sans-serif' },
  {
    category: "Google Fonts",
    label: "Poppins",
    value: '"Poppins", sans-serif',
  },
];

const PREVIEW_MODES = [
  { id: "mobile", label: "Mobile", width: "375px" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "desktop", label: "Desktop", width: "100%" },
];

// --- Sub-Components ---
// (DragDropImageUploader, ToggleSwitch, SearchableShopSelect, FontSelector, LayoutItemCard remain same)

// 1. Drag & Drop Image Uploader
const DragDropImageUploader = ({
  value,
  onChange,
  label,
  height = "200px",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleUpload(files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0)
      handleUpload(e.target.files[0]);
  };

  const handleUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      alert("File size exceeds 5MB.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file, { folder: "campaigns" });
      onChange(url);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="form-group">
        <label className="field-label">{label}</label>
        <div className="image-preview-card" style={{ height }}>
          <img src={value} alt="Preview" />
          <div className="image-actions-overlay">
            <button
              type="button"
              className="btn-icon danger"
              onClick={() => onChange("")}
              title="Remove Image"
            >
              🗑️
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          hidden
          accept="image/*"
        />
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="field-label">{label}</label>
      <div
        className={`drag-drop-zone ${isDragging ? "dragging" : ""}`}
        style={{ height }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          hidden
          accept="image/*"
        />
        {uploading ? (
          <div className="upload-spinner">
            <div className="spinner-circle"></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">☁️</span>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">SVG, PNG, JPG or GIF (max. 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Toggle Switch
const ToggleSwitch = ({ checked, onChange, label }) => (
  <div className="form-group toggle-group">
    <div className="toggle-label-content">
      <span className="field-label">{label}</span>
      <span className={`status-badge ${checked ? "active" : "inactive"}`}>
        {checked ? "Live" : "Draft"}
      </span>
    </div>
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="slider"></span>
    </label>
  </div>
);

// 3. Searchable Shop Dropdown
const SearchableShopSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedLabel =
    options.find((o) => o.value === value)?.label || "Select Source Shop";

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div
        className={`select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "selected-text" : "placeholder-text"}>
          {selectedLabel}
        </span>
        <span className="chevron">▼</span>
      </div>
      {isOpen && (
        <div className="select-dropdown">
          <div className="search-box">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`option-item ${value === opt.value ? "selected" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="no-results">No shops found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Font Family Selector
const FontSelector = ({ value, onChange }) => (
  <div className="form-group">
    <label className="field-label">Font Family</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-input font-select"
      style={{ fontFamily: value }}
    >
      {FONT_OPTIONS.map((opt, i) => (
        <option key={i} value={opt.value} style={{ fontFamily: opt.value }}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// 5. Collapsible Layout Card
const LayoutItemCard = ({
  item,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
  shops,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderFields = () => {
    switch (item.type) {
      case "product-row":
      case "product-grid":
        return (
          <>
            <div className="form-row">
              <div className="form-group flex-2">
                <label className="field-label">Section Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.title}
                  onChange={(e) => onUpdate("title", e.target.value)}
                  placeholder="e.g. New Arrivals"
                />
              </div>
              <div className="form-group flex-2">
                <label className="field-label">Subtitle</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.subtitle}
                  onChange={(e) => onUpdate("subtitle", e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group flex-3">
                <label className="field-label">Source Shop</label>
                <SearchableShopSelect
                  value={item.shopSlug}
                  onChange={(val) => onUpdate("shopSlug", val)}
                  options={shops}
                />
              </div>
              <div className="form-group flex-1">
                <label className="field-label">Limit</label>
                <input
                  type="number"
                  className="form-input"
                  value={item.limit}
                  onChange={(e) => onUpdate("limit", parseInt(e.target.value))}
                />
              </div>
              {item.type === "product-grid" && (
                <div className="form-group flex-1">
                  <label className="field-label">Columns</label>
                  <select
                    className="form-input"
                    value={item.cols}
                    onChange={(e) => onUpdate("cols", parseInt(e.target.value))}
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              )}
            </div>
          </>
        );
      case "banner-marquee":
        return (
          <>
            <div className="form-group">
              <label className="field-label">Marquee Text</label>
              <input
                type="text"
                className="form-input"
                value={item.text}
                onChange={(e) => onUpdate("text", e.target.value)}
                placeholder="Scrolling text message..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Background Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={item.bgColor}
                    onChange={(e) => onUpdate("bgColor", e.target.value)}
                  />
                  <span>{item.bgColor}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="field-label">Text Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={item.textColor}
                    onChange={(e) => onUpdate("textColor", e.target.value)}
                  />
                  <span>{item.textColor}</span>
                </div>
              </div>
            </div>
          </>
        );
      case "image-banner":
        return (
          <div className="form-row">
            <div className="flex-1">
              <DragDropImageUploader
                label="Banner Image"
                value={item.image}
                onChange={(url) => onUpdate("image", url)}
                height="120px"
              />
            </div>
            <div className="flex-1">
              <div className="form-group">
                <label className="field-label">Link URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.link}
                  onChange={(e) => onUpdate("link", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label className="field-label">Height</label>
                <select
                  className="form-input"
                  value={item.height}
                  onChange={(e) => onUpdate("height", e.target.value)}
                >
                  <option value="300px">Small (300px)</option>
                  <option value="450px">Medium (450px)</option>
                  <option value="600px">Large (600px)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case "countdown":
        return (
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="field-label">Title</label>
              <input
                type="text"
                className="form-input"
                value={item.title}
                onChange={(e) => onUpdate("title", e.target.value)}
                placeholder="Ends In..."
              />
            </div>
            <div className="form-group flex-1">
              <label className="field-label">Background</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={item.bgColor}
                  onChange={(e) => onUpdate("bgColor", e.target.value)}
                />
                <span>{item.bgColor}</span>
              </div>
            </div>
          </div>
        );
      case "spacer":
        return (
          <div className="form-group">
            <label className="field-label">Height</label>
            <select
              className="form-input"
              value={item.height}
              onChange={(e) => onUpdate("height", e.target.value)}
            >
              <option value="20px">Extra Small (20px)</option>
              <option value="40px">Small (40px)</option>
              <option value="80px">Medium (80px)</option>
              <option value="120px">Large (120px)</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`layout-card ${isExpanded ? "expanded" : "collapsed"}`}>
      <div
        className="layout-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-left">
          <span className="drag-handle" title="Drag to reorder">
            ⋮⋮
          </span>
          <span className={`type-badge type-${item.type}`}>
            {item.type.replace("-", " ")}
          </span>
          <span className="header-title">
            {item.title || item.text || "Untitled Section"}
          </span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onMove("up");
            }}
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onMove("down");
            }}
            disabled={index === total - 1}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn-icon danger"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            🗑️
          </button>
          <span className="chevron">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {isExpanded && <div className="layout-card-body">{renderFields()}</div>}
    </div>
  );
};

// --- Main Page Component ---

function CampaignEventManager() {
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'edit'
  const [campaigns, setCampaigns] = useState([]);
  const [shops, setShops] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState("mobile");
  const [loading, setLoading] = useState(false);

  // Editor State
  const initialFormState = {
    name: "",
    slug: "",
    active: false,
    startDate: "",
    endDate: "",
    themeColor: "#FF3366",
    accentColor: "#FFD700",
    fontFamily: '"Inter", sans-serif',
    heroTitle: "",
    heroSubtitle: "",
    heroBannerImage: "",
    heroOverlayOpacity: 0.3,
    heroTitleAlignment: "center",
    layout: [],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  // Fetch Initial Data
  useEffect(() => {
    fetchCampaigns();
    fetchShops();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await campaignsAPI.getAll();
      const list = response.data || (Array.isArray(response) ? response : []);
      setCampaigns(list);
    } catch (err) {
      console.error("Fetch campaigns error", err);
      // Fallback to empty list or show error
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const data = await shopsAPI.getAll();
      const list = Array.isArray(data) ? data : data.shops || data.data || [];
      setShops(list.map((s) => ({ label: s.name, value: s.slug })));
    } catch (err) {
      console.error("Shop fetch error:", err);
    }
  };

  // --- List View Actions ---
  const handleCreateNew = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setViewMode("edit");
  };

  const handleEdit = (campaign) => {
    setEditingId(campaign._id || campaign.id);
    // Use existing data from list, plus merge defaults for missing fields
    setFormData({
      ...initialFormState, // Defaults
      ...campaign, // Overwrite with campaign data
      layout: campaign.layout || [], // Ensure layout is array
    });
    setViewMode("edit");
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this campaign? This cannot be undone.",
      )
    ) {
      try {
        await campaignsAPI.delete(id);
        setCampaigns((prev) => prev.filter((c) => c._id !== id && c.id !== id));
        alert("Campaign deleted.");
      } catch (err) {
        console.error("Delete error", err);
        alert("Failed to delete.");
      }
    }
  };

  // --- Editor Actions ---
  const handleSave = async () => {
    setLoading(true);
    try {
      let savedCampaign;

      if (editingId) {
        const response = await campaignsAPI.update(editingId, formData);
        savedCampaign = response.data || response;

        // Update local state
        setCampaigns((prev) =>
          prev.map((c) =>
            c._id === editingId || c.id === editingId ? savedCampaign : c,
          ),
        );
      } else {
        const response = await campaignsAPI.create(formData);
        savedCampaign = response.data || response;

        // Add to local state
        setCampaigns((prev) => [savedCampaign, ...prev]);
      }

      alert("Campaign Saved Successfully!");
      setViewMode("list");
      setShowPreview(false);
      setEditingId(null); // Clear editing ID
    } catch (err) {
      console.error("Save error", err);
      alert(err.message || "Failed to save campaign.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Layout Builders
  const addLayoutItem = (type) => {
    const defaultData = {
      "product-row": {
        title: "New Collection",
        subtitle: "",
        shopSlug: "",
        limit: 10,
      },
      "product-grid": {
        title: "Trending",
        subtitle: "",
        shopSlug: "",
        limit: 20,
        cols: 4,
      },
      "banner-marquee": {
        text: "BREAKING NEWS • SALE IS LIVE",
        bgColor: "#000000",
        textColor: "#ffffff",
      },
      "image-banner": { image: "", link: "", height: "400px" },
      countdown: { title: "Limited Time Offer", bgColor: "#f8f8f8" },
      spacer: { height: "40px" },
    };
    const newItem = { id: Date.now(), type, ...defaultData[type] };
    setFormData((prev) => ({ ...prev, layout: [...prev.layout, newItem] }));
  };

  const updateLayoutItem = (index, field, value) => {
    setFormData((prev) => {
      const newLayout = [...prev.layout];
      newLayout[index] = { ...newLayout[index], [field]: value };
      return { ...prev, layout: newLayout };
    });
  };

  const removeLayoutItem = (index) => {
    if (window.confirm("Delete this section?")) {
      setFormData((prev) => ({
        ...prev,
        layout: prev.layout.filter((_, i) => i !== index),
      }));
    }
  };

  const moveLayoutItem = (index, direction) => {
    setFormData((prev) => {
      const newLayout = [...prev.layout];
      if (direction === "up" && index > 0) {
        [newLayout[index], newLayout[index - 1]] = [
          newLayout[index - 1],
          newLayout[index],
        ];
      } else if (direction === "down" && index < newLayout.length - 1) {
        [newLayout[index], newLayout[index + 1]] = [
          newLayout[index + 1],
          newLayout[index],
        ];
      }
      return { ...prev, layout: newLayout };
    });
  };

  // Preview Renderer
  const renderDevicePreview = () => {
    const width = PREVIEW_MODES.find((m) => m.id === previewMode)?.width;
    return (
      <div className="device-frame" style={{ width }}>
        <div
          className="device-screen"
          style={{ fontFamily: formData.fontFamily }}
        >
          <div
            className="p-hero"
            style={{
              backgroundImage: `url(${formData.heroBannerImage || "https://via.placeholder.com/800x400?text=No+Image"})`,
            }}
          >
            <div
              className="p-hero-overlay"
              style={{ opacity: formData.heroOverlayOpacity }}
            ></div>
            <div className={`p-hero-content ${formData.heroTitleAlignment}`}>
              <h1>{formData.heroTitle || "Campaign Title"}</h1>
              <p>{formData.heroSubtitle || "Subtitle area"}</p>
            </div>
          </div>
          <div className="p-content">
            {formData.layout.map((item, i) => (
              <div key={i} className="p-section">
                {(item.type === "product-row" ||
                  item.type === "product-grid") && (
                  <div className="p-prod-section">
                    <h3 style={{ color: formData.themeColor }}>{item.title}</h3>
                    <div
                      className={`p-products ${item.type === "product-grid" ? "grid" : "row"}`}
                      style={{ "--cols": item.cols }}
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="p-card-skeleton"></div>
                      ))}
                    </div>
                  </div>
                )}
                {item.type === "banner-marquee" && (
                  <div
                    className="p-marquee"
                    style={{ background: item.bgColor, color: item.textColor }}
                  >
                    {item.text} {item.text}
                  </div>
                )}
                {item.type === "image-banner" && (
                  <div
                    className="p-banner"
                    style={{
                      height: item.height || "300px",
                      backgroundImage: `url(${item.image})`,
                    }}
                  ></div>
                )}
                {item.type === "spacer" && (
                  <div style={{ height: item.height }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER ---
  if (viewMode === "list") {
    return (
      <AdminLayout>
        <div className="campaign-manager-container">
          <div className="page-header">
            <div>
              <h1>Campaigns</h1>
              <p>Manage all your marketing landing pages.</p>
            </div>
            <button className="btn-primary" onClick={handleCreateNew}>
              + Create New Campaign
            </button>
          </div>

          <div className="campaign-list-card panel-card">
            <div className="panel-body p-0">
              {campaigns.length === 0 ? (
                <div className="empty-state">
                  <p>No campaigns found. Create your first one!</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Dates</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => (
                      <tr key={camp.id}>
                        <td>
                          <span
                            className={`status-badge ${camp.active ? "active" : "inactive"}`}
                          >
                            {camp.active ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="fw-bold">{camp.name}</td>
                        <td className="text-muted">/{camp.slug}</td>
                        <td className="text-sm">
                          {camp.startDate
                            ? new Date(camp.startDate).toLocaleDateString()
                            : "-"}
                          {" → "}
                          {camp.endDate
                            ? new Date(camp.endDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="text-right">
                          <IconButton
                            icon="edit"
                            onClick={() => handleEdit(camp)}
                            title="Edit Campaign"
                            ariaLabel={`Edit ${camp.name}`}
                          />
                          <IconButton
                            icon="delete"
                            onClick={() => handleDelete(camp.id)}
                            title="Delete Campaign"
                            ariaLabel={`Delete ${camp.name}`}
                            variant="danger"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Edit Mode
  return (
    <AdminLayout>
      <div className="campaign-manager-container">
        <header className="page-header">
          <div className="header-text">
            <div className="breadcrumb">
              <span onClick={() => setViewMode("list")} className="link-span">
                Campaigns
              </span>{" "}
              / {editingId ? "Edit" : "New"}
            </div>
            <h1>{editingId ? "Edit Campaign" : "Create Campaign"}</h1>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowPreview(true)}
            >
              Review Layout
            </button>
            <button className="btn-primary" onClick={handleSave}>
              Save Campaign
            </button>
          </div>
        </header>

        <div className="main-content-grid">
          {/* Settings Column */}
          <div className="settings-column">
            <div className="panel-card">
              <h3>General Info</h3>
              <div className="panel-body">
                <ToggleSwitch
                  label="Campaign Status"
                  checked={formData.active}
                  onChange={(e) => handleMetaChange("active", e.target.checked)}
                />
                <div className="form-group">
                  <label className="field-label">Campaign Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleMetaChange("name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Slug (URL)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.slug}
                    onChange={(e) => handleMetaChange("slug", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Period</label>
                  <div className="form-row">
                    <input
                      type="date"
                      className="form-input"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleMetaChange("startDate", e.target.value)
                      }
                    />
                    <input
                      type="date"
                      className="form-input"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleMetaChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <h3>Theming</h3>
              <div className="panel-body">
                <FontSelector
                  value={formData.fontFamily}
                  onChange={(val) => handleMetaChange("fontFamily", val)}
                />
                <div className="form-row">
                  <div className="form-group">
                    <label className="field-label">Primary Color</label>
                    <div className="color-picker-wrapper">
                      <input
                        type="color"
                        value={formData.themeColor}
                        onChange={(e) =>
                          handleMetaChange("themeColor", e.target.value)
                        }
                      />
                      <span>{formData.themeColor}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="field-label">Accent Color</label>
                    <div className="color-picker-wrapper">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) =>
                          handleMetaChange("accentColor", e.target.value)
                        }
                      />
                      <span>{formData.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <h3>Hero Configuration</h3>
              <div className="panel-body">
                <DragDropImageUploader
                  label="Hero Banner"
                  value={formData.heroBannerImage}
                  onChange={(url) => handleMetaChange("heroBannerImage", url)}
                />
                <div className="form-group">
                  <label className="field-label">Main Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.heroTitle}
                    onChange={(e) =>
                      handleMetaChange("heroTitle", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Subtitle</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.heroSubtitle}
                    onChange={(e) =>
                      handleMetaChange("heroSubtitle", e.target.value)
                    }
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="field-label">Align</label>
                    <select
                      className="form-input"
                      value={formData.heroTitleAlignment}
                      onChange={(e) =>
                        handleMetaChange("heroTitleAlignment", e.target.value)
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="field-label">
                      Overlay: {formData.heroOverlayOpacity}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.heroOverlayOpacity}
                      onChange={(e) =>
                        handleMetaChange(
                          "heroOverlayOpacity",
                          parseFloat(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Builder Column */}
          <div className="builder-column">
            <div className="builder-header">
              <h2>Page Layout</h2>
              <p className="text-muted">
                Construct your page by stacking sections.
              </p>
            </div>
            <div className="component-toolbox">
              <button onClick={() => addLayoutItem("product-row")}>
                🛍️ Row
              </button>
              <button onClick={() => addLayoutItem("product-grid")}>
                ▦ Grid
              </button>
              <button onClick={() => addLayoutItem("banner-marquee")}>
                📢 Marquee
              </button>
              <button onClick={() => addLayoutItem("image-banner")}>
                🖼️ Banner
              </button>
              <button onClick={() => addLayoutItem("countdown")}>
                ⏳ Timer
              </button>
              <button onClick={() => addLayoutItem("spacer")}>⬍ Spacer</button>
            </div>
            <div className="layout-canvas">
              {formData.layout.length === 0 ? (
                <div className="empty-canvas">
                  <div className="empty-icon">🎨</div>
                  <h3>Start Building</h3>
                  <p>Click a button above to add your first section.</p>
                </div>
              ) : (
                formData.layout.map((item, index) => (
                  <LayoutItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    total={formData.layout.length}
                    onUpdate={(field, val) =>
                      updateLayoutItem(index, field, val)
                    }
                    onRemove={() => removeLayoutItem(index)}
                    onMove={(dir) => moveLayoutItem(index, dir)}
                    shops={shops}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="modal-overlay">
            <div className="preview-modal-content">
              <div className="preview-header-bar">
                <h3>Live Preview</h3>
                <div className="device-toggles">
                  {PREVIEW_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      className={previewMode === mode.id ? "active" : ""}
                      onClick={() => setPreviewMode(mode.id)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <div className="preview-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </button>
                  <button className="btn-primary" onClick={handleSave}>
                    Confirm & Save
                  </button>
                </div>
              </div>
              <div className="preview-viewport">{renderDevicePreview()}</div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default CampaignEventManager;
