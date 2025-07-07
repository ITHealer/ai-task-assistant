// extension/popup/components/ProjectFilter.tsx
import React from 'react';
import { Project } from '../../shared/types';

interface ProjectFilterProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
}

export default function ProjectFilter({ 
  projects, 
  selectedProject, 
  onProjectChange 
}: ProjectFilterProps) {
  return (
    <div className="project-filter">
      <select 
        value={selectedProject || ''} 
        onChange={(e) => onProjectChange(e.target.value || null)}
        className="project-select"
      >
        <option value="">All Projects</option>
        {projects.map(project => (
          <option 
            key={project.id} 
            value={project.id}
            style={{ color: project.color }}
          >
            {project.icon} {project.name} ({project.taskCount})
          </option>
        ))}
      </select>
    </div>
  );
}

// extension/popup/components/SearchBar.tsx
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button 
          className="clear-btn"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </div>
  );
}

// extension/popup/components/QuickActions.tsx
import React from 'react';

interface QuickActionsProps {
  onRefresh: () => void;
}

export default function QuickActions({ onRefresh }: QuickActionsProps) {
  const handleNewProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;
    
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    try {
      await chrome.runtime.sendMessage({
        action: 'create-project',
        data: { name, color }
      });
      onRefresh();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="quick-actions">
      <button 
        className="action-btn"
        onClick={onRefresh}
        title="Refresh"
      >
        <span className="icon">🔄</span>
      </button>
      <button 
        className="action-btn"
        onClick={handleNewProject}
        title="New Project"
      >
        <span className="icon">📁</span>
      </button>
      <button 
        className="action-btn"
        onClick={handleSettings}
        title="Settings"
      >
        <span className="icon">⚙️</span>
      </button>
    </div>
  );
}

// extension/popup/styles/popup.css
const popupStyles = `
/* Popup Container */
body {
  margin: 0;
  width: 400px;
  min-height: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f9fafb;
}

.popup-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 600px;
}

/* Header */
.popup-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.popup-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.dashboard-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.dashboard-btn:hover {
  background: #2563eb;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}

.stat.high-priority .stat-value {
  color: #ef4444;
}

/* Controls */
.popup-controls {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Search Bar */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
}

/* Project Filter */
.project-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

/* Filter Options */
.filter-options {
  display: flex;
  gap: 8px;
}

.filter-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f3f4f6;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.filter-btn .icon {
  font-size: 14px;
}

/* Quick Actions */
.quick-actions {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.action-btn .icon {
  font-size: 18px;
}

/* Content Area */
.popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Task Item */
.task-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.task-item.completed {
  opacity: 0.7;
}

.task-header {
  padding: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-main {
  display: flex;
  gap: 12px;
  flex: 1;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-top: 2px;
}

.task-info {
  flex: 1;
}

.task-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #6b7280;
}

.task-description {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  text-transform: uppercase;
}

.expand-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

/* Progress Bar */
.task-progress {
  padding: 0 12px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

/* Task Steps */
.task-steps {
  padding: 0 12px 12px;
  border-top: 1px solid #f3f4f6;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
}

.step-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin-top: 2px;
}

.step-text {
  flex: 1;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.step-text.completed {
  text-decoration: line-through;
  color: #9ca3af;
}

/* Task Footer */
.task-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
}

.task-date {
  font-size: 11px;
  color: #9ca3af;
}

/* States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

/* Footer */
.popup-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
  text-align: center;
}

.popup-footer a {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.popup-footer a:hover {
  text-decoration: underline;
}

/* Scrollbar */
.popup-content::-webkit-scrollbar {
  width: 6px;
}

.popup-content::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.popup-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.popup-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
`;