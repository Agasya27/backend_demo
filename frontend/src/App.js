import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsPanel from './components/StatsPanel';
import api from './services/api';

function App() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        priority: '',
        status: '',
        search: ''
    });

    const fetchTickets = useCallback(async () => {
        try {
            const data = await api.getTickets(filters);
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchTickets(), fetchStats()]);
            setLoading(false);
        };
        loadData();
    }, [fetchTickets, fetchStats]);

    const handleTicketCreated = async () => {
        await fetchTickets();
        await fetchStats();
    };

    const handleTicketUpdated = async () => {
        await fetchTickets();
        await fetchStats();
    };

    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    return (
        <div className="app">
            <div className="shell fade-in">
                <header className="shell-topbar">
                    <div className="brand-wrap">
                        <span className="brand-mark" />
                        <span className="brand-text">Ticket Manager</span>
                    </div>

                    <div className="top-search">
                        <span className="search-glyph">⌕</span>
                        <input
                            type="text"
                            placeholder="Search tickets"
                            value={filters.search}
                            onChange={(e) => handleFilterChange({ search: e.target.value })}
                        />
                    </div>
                </header>

                <main className="shell-content">
                    <section className="surface-card queue-card">
                        <div className="surface-head surface-head-row">
                            <h2>Active Ticket Queue</h2>
                            <span className="queue-counter">{tickets.length} Live</span>
                        </div>
                        <div className="inline-kpis">
                            <div className="inline-kpi">
                                <span>Total</span>
                                <strong>{stats?.total_tickets ?? '—'}</strong>
                            </div>
                            <div className="inline-kpi">
                                <span>Open</span>
                                <strong>{stats?.open_tickets ?? '—'}</strong>
                            </div>
                            <div className="inline-kpi">
                                <span>Avg / Day</span>
                                <strong>{stats ? stats.avg_tickets_per_day.toFixed(1) : '—'}</strong>
                            </div>
                        </div>
                        <TicketList
                            tickets={tickets}
                            loading={loading}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onTicketUpdated={handleTicketUpdated}
                        />
                    </section>

                    <aside className="side-column">
                        <section className="surface-card">
                            <div className="surface-head">
                                <h2>Create Ticket</h2>
                            </div>
                            <TicketForm onTicketCreated={handleTicketCreated} />
                        </section>

                        <section className="surface-card">
                            <div className="surface-head">
                                <h2>Queue Insights</h2>
                            </div>
                            {stats ? <StatsPanel stats={stats} /> : <div className="loading-skeleton" />}
                        </section>
                    </aside>
                </main>
            </div>
        </div>
    );
}

export default App;
