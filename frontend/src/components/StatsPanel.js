import React from 'react';
import './StatsPanel.css';

const StatsPanel = ({ stats }) => {
    const StatCard = ({ label, value, gradient, icon }) => (
        <div className="stat-card" style={{ background: gradient }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );

    const BreakdownItem = ({ label, value, color }) => (
        <div className="breakdown-item">
            <div className="breakdown-header">
                <span className="breakdown-label">{label}</span>
                <span className="breakdown-value">{value}</span>
            </div>
            <div className="breakdown-bar">
                <div
                    className="breakdown-fill"
                    style={{
                        width: `${stats.total_tickets > 0 ? (value / stats.total_tickets) * 100 : 0}%`,
                        background: color
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="stats-panel">
            <div className="stats-grid">
                <StatCard
                    label="Total Tickets"
                    value={stats.total_tickets}
                    gradient="linear-gradient(130deg, #2962de 0%, #3f81ff 100%)"
                    icon="T"
                />
                <StatCard
                    label="Open Tickets"
                    value={stats.open_tickets}
                    gradient="linear-gradient(130deg, #0f9f88 0%, #1cc3a8 100%)"
                    icon="O"
                />
                <StatCard
                    label="Avg per Day"
                    value={stats.avg_tickets_per_day.toFixed(1)}
                    gradient="linear-gradient(130deg, #d0741f 0%, #f09a44 100%)"
                    icon="A"
                />
            </div>

            <div className="breakdowns">
                <div className="breakdown-section">
                    <h4 className="breakdown-title">Priority Breakdown</h4>
                    <div className="breakdown-list">
                        <BreakdownItem label="Critical" value={stats.priority_breakdown.critical} color="linear-gradient(90deg, #dc3e5d, #f15673)" />
                        <BreakdownItem label="High" value={stats.priority_breakdown.high} color="linear-gradient(90deg, #df6e2f, #ef8948)" />
                        <BreakdownItem label="Medium" value={stats.priority_breakdown.medium} color="linear-gradient(90deg, #c79a27, #ddb744)" />
                        <BreakdownItem label="Low" value={stats.priority_breakdown.low} color="linear-gradient(90deg, #27977c, #30b492)" />
                    </div>
                </div>

                <div className="breakdown-section">
                    <h4 className="breakdown-title">Category Breakdown</h4>
                    <div className="breakdown-list">
                        <BreakdownItem label="Technical" value={stats.category_breakdown.technical} color="linear-gradient(90deg, #2a76e7, #4c93ff)" />
                        <BreakdownItem label="Billing" value={stats.category_breakdown.billing} color="linear-gradient(90deg, #d27726, #ec9344)" />
                        <BreakdownItem label="Account" value={stats.category_breakdown.account} color="linear-gradient(90deg, #2f9f87, #39bf9f)" />
                        <BreakdownItem label="General" value={stats.category_breakdown.general} color="linear-gradient(90deg, #5f73d1, #7b90f1)" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
