import React, { useState, useEffect, useCallback } from 'react';
import './TicketForm.css';
import api from '../services/api';

const MIN_AI_LENGTH = 12;

const TicketForm = ({ onTicketCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
    });

    const [classifying, setClassifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(false);
    const [classifyError, setClassifyError] = useState('');

    const classifyDescription = useCallback(async () => {
        if (formData.description.trim().length < MIN_AI_LENGTH) return;

        setClassifying(true);
        setAiSuggested(false);
        setClassifyError('');

        try {
            const result = await api.classifyTicket(formData.description);
            setFormData((prev) => ({
                ...prev,
                category: result.suggested_category,
                priority: result.suggested_priority,
            }));
            setAiSuggested(true);
        } catch (err) {
            console.error('Classification failed:', err);
            setClassifyError('AI suggestion unavailable. Check backend LLM API key/provider settings.');
        } finally {
            setClassifying(false);
        }
    }, [formData.description]);

    useEffect(() => {
        if (formData.description.trim().length < MIN_AI_LENGTH) {
            setAiSuggested(false);
            setClassifyError('');
            return;
        }

        const timer = setTimeout(async () => {
            await classifyDescription();
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData.description, classifyDescription]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');

        if (name === 'category' || name === 'priority') {
            setAiSuggested(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        if (formData.title.length > 200) {
            setError('Title cannot exceed 200 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await api.createTicket(formData);
            setSuccess(true);
            setFormData({
                title: '',
                description: '',
                category: 'general',
                priority: 'medium',
            });
            setAiSuggested(false);
            setClassifyError('');

            if (onTicketCreated) {
                onTicketCreated();
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="ticket-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="title" className="form-label">
                    Title <span className="required">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of your issue"
                    maxLength={200}
                    required
                />
                <div className="char-count">{formData.title.length}/200</div>
            </div>

            <div className="form-group">
                <label htmlFor="description" className="form-label">
                    Description <span className="required">*</span>
                </label>
                <textarea
                    id="description"
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe issue details for accurate classification"
                    rows={5}
                    required
                />
                <div className="ai-actions">
                    <button
                        type="button"
                        className="ai-action-btn"
                        onClick={classifyDescription}
                        disabled={classifying || formData.description.trim().length < MIN_AI_LENGTH}
                    >
                        Analyze with AI
                    </button>
                    <span className="ai-hint">Minimum {MIN_AI_LENGTH} characters</span>
                </div>
                {classifying && (
                    <div className="ai-indicator">
                        <span className="ai-icon">●</span>
                        Analyzing description...
                    </div>
                )}
                {aiSuggested && !classifying && (
                    <div className="ai-indicator ai-success">
                        <span className="ai-icon">●</span>
                        Suggested: {formData.category} / {formData.priority}
                    </div>
                )}
                {classifyError && <div className="ai-error">{classifyError}</div>}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="category" className="form-label">
                        Category <span className="required">*</span>
                        {aiSuggested && <span className="ai-badge">AI</span>}
                    </label>
                    <select
                        id="category"
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="billing">Billing</option>
                        <option value="technical">Technical</option>
                        <option value="account">Account</option>
                        <option value="general">General</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="priority" className="form-label">
                        Priority <span className="required">*</span>
                        {aiSuggested && <span className="ai-badge">AI</span>}
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        className="form-select"
                        value={formData.priority}
                        onChange={handleChange}
                        required
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">Ticket created successfully.</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting || classifying}>
                {submitting ? (
                    <>
                        <span className="spinner" />
                        Creating...
                    </>
                ) : (
                    <>
                        <span>Create Ticket</span>
                        <span className="btn-icon">→</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default TicketForm;
