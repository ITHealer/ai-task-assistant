// extension/popup/App.tsx
import React, { useState, useEffect } from 'react';
import { Task, Project } from '../shared/types';
import TaskList from './components/TaskList';
import ProjectFilter from './components/ProjectFilter';
import QuickActions from './components/QuickActions';
import SearchBar from './components/SearchBar';
import './styles/popup.css';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tasks and projects
      const [tasksResponse, projectsResponse] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'get-tasks' }),
        chrome.runtime.sendMessage({ action: 'get-projects' })
      ]);

      if (tasksResponse.tasks) {
        setTasks(tasksResponse.tasks);
      }
      
      if (projectsResponse.projects) {
        setProjects(projectsResponse.projects);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      // Project filter
      if (selectedProject && task.projectId !== selectedProject) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.steps.some(step => 
            step.descriptions.toLowerCase().includes(query)
          )
        );
      }
      
      // Completed filter
      if (!filterCompleted && task.isCompleted) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    });

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'update-task',
        taskId,
        updates
      });

      if (response.success) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleOpenDashboard = () => {
    chrome.runtime.sendMessage({ action: 'open-dashboard' });
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.isCompleted).length,
    inProgress: tasks.filter(t => !t.isCompleted).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.isCompleted).length
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="header-top">
          <h1>AI Task Assistant</h1>
          <button 
            className="dashboard-btn"
            onClick={handleOpenDashboard}
            title="Open Dashboard"
          >
            <span className="icon">📊</span>
          </button>
        </div>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Done</span>
          </div>
          {stats.highPriority > 0 && (
            <div className="stat high-priority">
              <span className="stat-value">{stats.highPriority}</span>
              <span className="stat-label">High</span>
            </div>
          )}
        </div>
      </header>

      <div className="popup-controls">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tasks..."
        />
        
        <ProjectFilter
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
        />

        <div className="filter-options">
          <button
            className={`filter-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => setSortBy('date')}
          >
            <span className="icon">📅</span> Date
          </button>
          <button
            className={`filter-btn ${sortBy === 'priority' ? 'active' : ''}`}
            onClick={() => setSortBy('priority')}
          >
            <span className="icon">⚡</span> Priority
          </button>
          <button
            className={`filter-btn ${filterCompleted ? 'active' : ''}`}
            onClick={() => setFilterCompleted(!filterCompleted)}
          >
            <span className="icon">✅</span> Show Done
          </button>
        </div>
      </div>

      <QuickActions onRefresh={loadData} />

      <div className="popup-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No tasks found</h3>
            <p>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Select text on any page and create your first AI task!'}
            </p>
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </div>

      <footer className="popup-footer">
        <a href="#" onClick={handleOpenDashboard}>
          View all in Dashboard →
        </a>
      </footer>
    </div>
  );
}

// extension/popup/index.html
const popupHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Task Assistant</title>
  <link rel="stylesheet" href="styles/popup.css">
</head>
<body>
  <div id="root"></div>
  <script src="popup.js"></script>
</body>
</html>`;

// extension/popup/components/TaskList.tsx
import React from 'react';
import { Task } from '../../shared/types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdate={onTaskUpdate}
        />
      ))}
    </div>
  );
}

// extension/popup/components/TaskItem.tsx
import React, { useState } from 'react';
import { Task, TaskStep } from '../../shared/types';

interface TaskItemProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleStepToggle = (stepId: string) => {
    const updatedSteps = task.steps.map(step =>
      step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
    );
    
    const allCompleted = updatedSteps.every(step => step.isCompleted);
    
    onUpdate(task.id, {
      steps: updatedSteps,
      isCompleted: allCompleted,
      completedAt: allCompleted ? new Date().toISOString() : undefined
    });
  };

  const handleTaskToggle = () => {
    const isCompleted = !task.isCompleted;
    const updatedSteps = task.steps.map(step => ({
      ...step,
      isCompleted
    }));
    
    onUpdate(task.id, {
      isCompleted,
      steps: updatedSteps,
      completedAt: isCompleted ? new Date().toISOString() : undefined
    });
  };

  const completedSteps = task.steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / task.steps.length) * 100;

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return (
    <div className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
      <div className="task-header" onClick={() => setExpanded(!expanded)}>
        <div className="task-main">
          <input
            type="checkbox"
            checked={task.isCompleted}
            onChange={handleTaskToggle}
            onClick={(e) => e.stopPropagation()}
            className="task-checkbox"
          />
          <div className="task-info">
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
          </div>
        </div>
        <div className="task-meta">
          <span 
            className="priority-badge"
            style={{ backgroundColor: priorityColors[task.priority] }}
          >
            {task.priority}
          </span>
          <button className="expand-btn">
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {task.steps.length > 0 && (
        <div className="task-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {completedSteps}/{task.steps.length} steps
          </span>
        </div>
      )}

      {expanded && (
        <div className="task-steps">
          {task.steps.map(step => (
            <div key={step.id} className="step-item">
              <input
                type="checkbox"
                checked={step.isCompleted}
                onChange={() => handleStepToggle(step.id)}
                className="step-checkbox"
              />
              <span className={`step-text ${step.isCompleted ? 'completed' : ''}`}>
                {step.descriptions}
              </span>
            </div>
          ))}
          
          <div className="task-footer">
            <span className="task-date">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </span>
            {task.completedAt && (
              <span className="task-date">
                Completed: {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}