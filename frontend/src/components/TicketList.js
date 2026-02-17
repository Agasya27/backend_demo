import React from 'react';
import './TicketList.css';
import TicketItem from './TicketItem';

const TicketList = ({ tickets, loading, filters, onFilterChange, onTicketUpdated }) => {
    const handleSearchChange = (e) => {
        onFilterChange({ search: e.target.value });
    };

    const handleFilterChange = (filterType, value) => {
        onFilterChange({ [filterType]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            category: '',
            priority: '',
            status: '',
            search: ''
        });
    };

    const hasActiveFilters = filters.category || filters.priority || filters.status || filters.search;

    return (
        <div className="ticket-list">
            <div className="filters-section">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tickets..."
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="filters-grid">
                    <select
                        className="filter-select"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="billing">Billing</option>
                        <option value="technical">Technical</option>
                        <option value="account">Account</option>
                        <option value="general">General</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="ticket-list-meta">
                    <span className="results-chip">Results: {tickets.length}</span>
                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="tickets-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner-large" />
                        <p>Loading tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No tickets found</h3>
                        <p>
                            {hasActiveFilters
                                ? 'Try adjusting your filters'
                                : 'Create your first ticket to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="tickets-grid">
                        {tickets.map((ticket, index) => (
                            <TicketItem
                                key={ticket.id}
                                ticket={ticket}
                                onUpdate={onTicketUpdated}
                                animationDelay={index * 0.04}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketList;
