import React, { useState } from 'react';
import './TicketItem.css';
import api from '../services/api';

const TicketItem = ({ ticket, onUpdate, animationDelay = 0 }) => {
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await api.updateTicket(ticket.id, { status: newStatus });
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to update ticket:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            return;
        }
        
        setDeleting(true);
        try {
            await api.deleteTicket(ticket.id);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to delete ticket:', error);
            alert('Failed to delete ticket. Please try again.');
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const getCategoryColor = (category) => {
        const colors = {
            billing: '#ff914d',
            technical: '#27b0ff',
            account: '#32d39a',
            general: '#7aa7ff'
        };
        return colors[category] || colors.general;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: '#3cd08f',
            medium: '#ffca50',
            high: '#ff8a4d',
            critical: '#ff4f64'
        };
        return colors[priority] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            open: '#26c2ff',
            in_progress: '#ffbe44',
            resolved: '#3ddc97',
            closed: '#8da9ce'
        };
        return colors[status] || colors.open;
    };

    return (
        <div className="ticket-item" style={{ animationDelay: `${animationDelay}s` }}>
            <div className="ticket-header">
                <h3 className="ticket-title">{ticket.title}</h3>
                <span className="ticket-id">#{ticket.id}</span>
            </div>

            <p className="ticket-description">{truncateText(ticket.description)}</p>

            <div className="ticket-meta">
                <div className="ticket-badges">
                    <span
                        className="badge badge-category"
                        style={{ backgroundColor: `${getCategoryColor(ticket.category)}1f`, color: getCategoryColor(ticket.category) }}
                    >
                        {ticket.category}
                    </span>
                    <span
                        className="badge badge-priority"
                        style={{ backgroundColor: `${getPriorityColor(ticket.priority)}1f`, color: getPriorityColor(ticket.priority) }}
                    >
                        {ticket.priority}
                    </span>
                </div>
                <span className="ticket-date">{formatDate(ticket.created_at)}</span>
            </div>

            <div className="ticket-actions">
                <div className="status-selector">
                    <label className="status-label">Status:</label>
                    <div className="status-wrap">
                        <span
                            className="status-dot"
                            style={{ backgroundColor: getStatusColor(ticket.status) }}
                            aria-hidden="true"
                        />
                        <select
                            className="status-select"
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={updating || deleting}
                            style={{ borderColor: getStatusColor(ticket.status) }}
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>
                <button
                    className="delete-btn"
                    onClick={handleDelete}
                    disabled={deleting || updating}
                    title="Delete ticket"
                >
                    {deleting ? '...' : '🗑️'}
                </button>
            </div>
        </div>
    );
};

export default TicketItem;
