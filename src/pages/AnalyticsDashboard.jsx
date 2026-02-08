import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { analyticsAPI } from '../services/api';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getAnalytics({ dateRange });
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
    return `₹${Math.round(amount)}`;
  };

  // Format percentage change
  const formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Prepare KPIs
  const kpis = analyticsData ? [
    {
      title: 'Total Revenue',
      value: formatCurrency(analyticsData.kpis.totalRevenue.value),
      change: formatChange(analyticsData.kpis.totalRevenue.change),
      isPositive: analyticsData.kpis.totalRevenue.isPositive
    },
    {
      title: 'Orders',
      value: analyticsData.kpis.orders.display,
      change: formatChange(analyticsData.kpis.orders.change),
      isPositive: analyticsData.kpis.orders.isPositive
    },
    {
      title: 'Avg Order Value',
      value: analyticsData.kpis.avgOrderValue.display,
      change: formatChange(analyticsData.kpis.avgOrderValue.change),
      isPositive: analyticsData.kpis.avgOrderValue.isPositive
    },
    {
      title: 'New Customers',
      value: analyticsData.kpis.newCustomers.display,
      change: formatChange(analyticsData.kpis.newCustomers.change),
      isPositive: analyticsData.kpis.newCustomers.isPositive
    }
  ] : [];

  // Prepare revenue trend data for chart
  const revenueData = analyticsData?.revenueTrend || [];
  
  // Calculate max value for chart scaling
  // Use the maximum value in the dataset, or 1 to avoid division by zero
  const maxRevenue = revenueData.length > 0 
    ? Math.max(...revenueData.map(d => d.value || 0), 1)
    : 1;

  // Prepare category distribution for donut chart
  const categoryData = analyticsData?.categoryDistribution || [];
  const totalCategoryRevenue = categoryData.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  
  // Generate conic gradient for donut chart
  const generateDonutGradient = () => {
    if (categoryData.length === 0) {
      return 'conic-gradient(var(--primary) 0deg 360deg)';
    }

    const colors = [
      'var(--primary)',
      'var(--success)',
      'var(--info)',
      'var(--warning)',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f59e0b'
    ];

    let gradient = '';
    let currentAngle = 0;
    
    categoryData.forEach((cat, index) => {
      const percentage = (cat.revenue / totalCategoryRevenue) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      gradient += `${colors[index % colors.length]} ${startAngle}deg ${endAngle}deg, `;
      currentAngle = endAngle;
    });

    // Remove trailing comma and space
    gradient = gradient.slice(0, -2);
    return `conic-gradient(${gradient})`;
  };

  return (
    <AdminLayout>
      <div className="analytics-container">

        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1>Analytics Overview</h1>
            <p className="text-muted">In-depth insights into platform performance.</p>
          </div>
          <div className="analytics-controls">
            <select 
              className="form-control" 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              disabled={loading}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn btn-outline" disabled={loading}>
              Export Data
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-state">
            <p>Error: {error}</p>
            <button onClick={fetchAnalytics}>Retry</button>
          </div>
        )}

        {/* KPIs */}
        {!loading && !error && analyticsData && (
          <>
            <div className="analytics-kpi-grid">
              {kpis.map((kpi, i) => (
                <div key={i} className="kpi-card">
                  <div className="stat-content">
                    <h3>{kpi.title}</h3>
                    <p className="stat-value">{kpi.value}</p>
                    <span className={`badge ${kpi.isPositive ? 'success' : 'danger'}`}>
                      {kpi.change} vs last period
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">

              {/* Bar Chart - Revenue Trend */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Revenue Trend</h3>
                </div>
                {revenueData.length > 0 ? (
                  <div className="analytics-chart-container">
                    {revenueData.map((d, i) => {
                      // Calculate height percentage based on sale amount
                      // Scale from 0% to 100% based on max revenue
                      const heightPercentage = maxRevenue > 0 
                        ? (d.value / maxRevenue) * 100
                        : 0;
                      return (
                        <div key={i} className="analytics-revenue-bar-group">
                          <div
                            className="analytics-revenue-bar"
                            style={{ 
                              height: `${heightPercentage}%`
                            }}
                            data-value={d.display}
                            title={d.display}
                          ></div>
                          <span className="analytics-revenue-bar-label">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <p>No revenue data available for this period</p>
                  </div>
                )}
              </div>

              {/* Donut Chart - Category Distribution */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Sales by Category</h3>
                </div>
                {categoryData.length > 0 ? (
                  <>
                    <div className="donut-chart-container">
                      <div 
                        className="donut-chart"
                        style={{ background: generateDonutGradient() }}
                      >
                        <div className="donut-center">
                          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                            {categoryData.length}
                          </span>
                          <span className="text-muted">Categories</span>
                        </div>
                      </div>
                    </div>
                    <div className="donut-legend">
                      {categoryData.map((cat, index) => {
                        const percentage = totalCategoryRevenue > 0 
                          ? ((cat.revenue / totalCategoryRevenue) * 100).toFixed(1)
                          : 0;
                        const colors = [
                          'var(--primary)',
                          'var(--success)',
                          'var(--info)',
                          'var(--warning)',
                          '#8b5cf6',
                          '#ec4899',
                          '#14b8a6',
                          '#f59e0b'
                        ];
                        return (
                          <div key={index} className="legend-item">
                            <div 
                              className="legend-color" 
                              style={{ background: colors[index % colors.length] }}
                            ></div>
                            <span>
                              {cat.category || 'Uncategorized'} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="empty-chart">
                    <p>No category data available for this period</p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </AdminLayout>
  );
}

export default AnalyticsDashboard;
