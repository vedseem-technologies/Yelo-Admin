import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { shopsAPI } from '../services/api';
import './CampaignEventManager.css';

function CampaignEventManager() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <AdminLayout>
      <div className="campaign-container">
        <div className="page-header">
          <div>
            <h1>Campaign & Event Manager</h1>
            <p className="text-muted">Manage promotional events and curated campaign shops.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Create Campaign
          </button>
        </div>

        <div className="coming-soon-wrapper">
          <div className="coming-soon-card card">
            <div className="coming-soon-icon">🚀</div>
            <h2>Module Under Development</h2>
            <p>Advanced campaign scheduling and automated event management features are coming soon. You can start by setting up the campaign structure using the button above.</p>
            <div className="coming-soon-badge">Phase 1: Setup</div>
          </div>
        </div>

        {/* Modal for future fields */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Campaign</h2>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="placeholder-form-msg">
                  <p>Modal fields will be added here as per your requirements.</p>
                  <div className="form-group">
                    <label>Campaign Name (Placeholder)</label>
                    <input type="text" placeholder="Entering campaign name..." disabled />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled>Save Campaign</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default CampaignEventManager;
