import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Search, Filter, CheckCircle2, Circle, X,
    Download, TrendingUp, AlertTriangle, SpellCheck, Volume2,
    Type, ChevronDown, RotateCcw, Trash2,
} from 'lucide-react';
import Button from './Button';
import { StaggerContainer, StaggerItem } from './Motion';
import {
    ErrorEntry, ErrorCategory, ErrorStats,
    getErrors, getErrorStats, markAsMastered,
    incrementReview, deleteError, exportJournal,
} from '../services/errorJournal';
import { useUserProfile } from '../hooks/useUserProfile';

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES: { key: ErrorCategory | 'all' | 'mastered'; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'all', label: 'All', icon: Filter, color: 'var(--text-secondary)' },
    { key: 'grammar', label: 'Grammar', icon: AlertTriangle, color: '#f59e0b' },
    { key: 'vocabulary', label: 'Vocab', icon: BookOpen, color: '#6366f1' },
    { key: 'pronunciation', label: 'Pronunciation', icon: Volume2, color: '#ec4899' },
    { key: 'spelling', label: 'Spelling', icon: Type, color: '#14b8a6' },
    { key: 'mastered', label: 'Mastered', icon: CheckCircle2, color: '#10b981' },
];

const CATEGORY_BADGE_STYLES: Record<ErrorCategory, { bg: string; text: string }> = {
    grammar:       { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
    vocabulary:    { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
    pronunciation: { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899' },
    spelling:      { bg: 'rgba(20, 184, 166, 0.15)', text: '#14b8a6' },
};

// ─── Component ───────────────────────────────────────────────────────────────

const ErrorJournal: React.FC = () => {
    const { profile } = useUserProfile();
    const username = profile?.username || 'default';

    const [activeTab, setActiveTab] = useState<ErrorCategory | 'all' | 'mastered'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const entries = useMemo(() => getErrors(username), [username]);
    const stats = useMemo(() => getErrorStats(username), [username]);

    const filtered = useMemo(() => {
        let list = entries;

        if (activeTab === 'mastered') {
            list = list.filter(e => e.mastered);
        } else if (activeTab !== 'all') {
            list = list.filter(e => e.category === activeTab);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                e =>
                    e.original.toLowerCase().includes(q) ||
                    e.correction.toLowerCase().includes(q) ||
                    e.explanation.toLowerCase().includes(q),
            );
        }

        return list;
    }, [entries, activeTab, searchQuery]);

    const handleMarkMastered = useCallback((id: string) => {
        markAsMastered(username, id);
        // Force re-render by incrementing — React will pick up the localStorage change on next render
    }, [username]);

    const handleReview = useCallback((id: string) => {
        incrementReview(username, id);
    }, [username]);

    const handleDelete = useCallback((id: string) => {
        deleteError(username, id);
    }, [username]);

    const handleExport = useCallback(() => {
        const text = exportJournal(username);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profesoria-error-journal-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [username]);

    // Force re-render on mutation by using a counter key
    const [, setForceUpdate] = useState(0);
    const mutate = () => setForceUpdate(n => n + 1);

    const onMarkMastered = (id: string) => { handleMarkMastered(id); mutate(); };
    const onReview = (id: string) => { handleReview(id); mutate(); };
    const onDelete = (id: string) => { handleDelete(id); mutate(); };

    // ─── Stats Bar ───────────────────────────────────────────────────────────

    const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
        <div
            className="flex flex-col items-center px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
        >
            <span className="text-2xl font-black" style={{ color: accent }}>{value}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>{label}</span>
        </div>
    );

    // ─── Error Card ───────────────────────────────────────────────────────────

    const ErrorCard = ({ entry }: { entry: ErrorEntry }) => {
        const isExpanded = expandedId === entry.id;
        const badge = CATEGORY_BADGE_STYLES[entry.category];
        const dateStr = new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        return (
            <StaggerItem>
                <motion.div
                    layout
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${entry.mastered ? 'rgba(16,185,129,0.3)' : 'var(--border-default)'}`,
                    }}
                >
                    {/* Card header — always visible */}
                    <div
                        className="p-4 cursor-pointer select-none"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {/* Category badge */}
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                        style={{ background: badge.bg, color: badge.text }}
                                    >
                                        {entry.category}
                                    </span>
                                    {entry.mastered && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                              style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                                            <CheckCircle2 className="w-3 h-3" /> Mastered
                                        </span>
                                    )}
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
                                </div>

                                {/* Original → Correction */}
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="line-through text-sm" style={{ color: '#ef4444', textDecorationColor: '#ef4444' }}>
                                        {entry.original}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                                        {entry.correction}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                {entry.reviewCount > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                                          style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}>
                                        <RotateCcw className="w-3 h-3 inline mr-0.5" />{entry.reviewCount}
                                    </span>
                                )}
                                <ChevronDown
                                    className="w-4 h-4 transition-transform duration-200"
                                    style={{
                                        color: 'var(--text-muted)',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 pt-0 space-y-3"
                                     style={{ borderTop: '1px solid var(--border-default)' }}>
                                    {/* Explanation */}
                                    <div className="pt-3">
                                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                                            Explanation
                                        </p>
                                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            {entry.explanation}
                                        </p>
                                    </div>

                                    {/* Meta info */}
                                    <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        <span>Level: {entry.level}</span>
                                        {entry.lastReviewed && (
                                            <span>Last reviewed: {new Date(entry.lastReviewed).toLocaleDateString()}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {!entry.mastered && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); onMarkMastered(entry.id); }}
                                                className="text-xs gap-1"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Mark Mastered
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); onReview(entry.id); }}
                                            className="text-xs gap-1"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Review
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                            className="text-xs gap-1"
                                            style={{ color: 'var(--error)' }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </StaggerItem>
        );
    };

    // ─── Empty State ──────────────────────────────────────────────────────────

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--accent-primary-muted)' }}>
                    <BookOpen className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No mistakes yet</h2>
                <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                    Your error journal will fill up as you practice. Every mistake is a chance to learn!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Mistakes" value={stats.total} accent="var(--accent-primary)" />
                <StatCard label="Mastered" value={stats.mastered} accent="var(--success)" />
                <StatCard label="Grammar" value={stats.byCategory.grammar} accent="#f59e0b" />
                <StatCard label="Vocabulary" value={stats.byCategory.vocabulary} accent="#818cf8" />
            </div>

            {/* Most common patterns (if any) */}
            {stats.mostCommonPatterns.length > 0 && stats.mostCommonPatterns[0].count > 1 && (
                <div className="rounded-xl p-4" style={{ background: 'var(--warning-muted)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                            Recurring Patterns
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.mostCommonPatterns
                            .filter(p => p.count > 1)
                            .map(p => (
                                <span
                                    key={p.pattern}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}
                                >
                                    &ldquo;{p.pattern}&rdquo; &times;{p.count}
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* ── Search + Export ── */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search mistakes..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                        style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 shrink-0">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex overflow-x-auto gap-2 hide-scrollbar pb-1">
                {CATEGORIES.map(cat => {
                    const isActive = activeTab === cat.key;
                    const Icon = cat.icon;
                    const count =
                        cat.key === 'all'
                            ? stats.total
                            : cat.key === 'mastered'
                                ? stats.mastered
                                : stats.byCategory[cat.key];
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setActiveTab(cat.key)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0"
                            style={{
                                background: isActive ? cat.color : 'var(--bg-card)',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                border: `1px solid ${isActive ? cat.color : 'var(--border-default)'}`,
                            }}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {cat.label}
                            <span className="ml-0.5 opacity-70">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Error Cards ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-12">
                    <Circle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {searchQuery ? 'No matches found.' : 'No errors in this category.'}
                    </p>
                </div>
            ) : (
                <StaggerContainer className="space-y-3">
                    {filtered.map(entry => (
                        <ErrorCard key={entry.id} entry={entry} />
                    ))}
                </StaggerContainer>
            )}
        </div>
    );
};

export default ErrorJournal;