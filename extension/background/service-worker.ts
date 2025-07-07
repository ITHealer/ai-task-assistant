// extension/background/service-worker.ts
import { apiClient } from '../shared/api';
import { SelectionContext, Task, Project } from '../shared/types';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'create-task',
    title: 'Create AI Task from "%s"',
    contexts: ['selection']
  });

  // Initialize default settings
  chrome.storage.sync.set({
    defaultProjectId: null,
    autoOpenPopup: true,
    enableNotifications: true
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'create-task' && info.selectionText) {
    try {
      // Send message to content script to show selection popup
      chrome.tabs.sendMessage(tab!.id!, {
        action: 'show-selection-popup',
        data: {
          text: info.selectionText,
          pageUrl: tab!.url,
          pageTitle: tab!.title,
          timestamp: new Date().toISOString()
        } as SelectionContext
      });
    } catch (error) {
      console.error('Error handling context menu click:', error);
      // Fallback: create task directly
      await createTaskDirectly(info.selectionText, tab!);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'create-task') {
    handleCreateTask(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'get-projects') {
    handleGetProjects()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'get-tasks') {
    handleGetTasks(request.projectId)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'update-task') {
    handleUpdateTask(request.taskId, request.updates)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'open-dashboard') {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
});

// Helper functions
async function handleCreateTask(data: {
  text: string;
  context?: string;
  projectId?: string;
}) {
  try {
    // Call backend API to create task
    const response = await apiClient.createTaskFromText({
      text: data.text,
      context: data.context
    });

    // Add projectId if provided
    const task = {
      ...response.task,
      projectId: data.projectId
    };

    // Save to local storage
    await saveTaskToStorage(task);

    // Show notification if enabled
    const { enableNotifications } = await chrome.storage.sync.get(['enableNotifications']);
    if (enableNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-128.png',
        title: 'Task Created!',
        message: task.title,
        buttons: [{ title: 'View Tasks' }]
      });
    }

    // Update badge
    await updateBadge();

    return { success: true, task };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

async function handleGetProjects() {
  try {
    // Get from cache first
    const { projects } = await chrome.storage.local.get(['projects']);
    if (projects && projects.length > 0) {
      return { projects };
    }

    // Fetch from API
    const fetchedProjects = await apiClient.getProjects();
    await chrome.storage.local.set({ projects: fetchedProjects });
    return { projects: fetchedProjects };
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
}

async function handleGetTasks(projectId?: string) {
  try {
    const { tasks = [] } = await chrome.storage.local.get(['tasks']);
    
    if (projectId) {
      return { tasks: tasks.filter((t: Task) => t.projectId === projectId) };
    }
    
    return { tasks };
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
  try {
    const { tasks = [] } = await chrome.storage.local.get(['tasks']);
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    // Update task
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    
    // Save to storage
    await chrome.storage.local.set({ tasks });
    
    // Update badge
    await updateBadge();
    
    // Sync with backend
    try {
      await apiClient.updateTask(taskId, updates);
    } catch (error) {
      console.error('Failed to sync task update with backend:', error);
    }

    return { success: true, task: tasks[taskIndex] };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

async function saveTaskToStorage(task: Task) {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  tasks.unshift(task); // Add to beginning
  await chrome.storage.local.set({ tasks });
}

async function updateBadge() {
  const { tasks = [] } = await chrome.storage.local.get(['tasks']);
  const incompleteTasks = tasks.filter((t: Task) => !t.isCompleted);
  
  chrome.action.setBadgeText({
    text: incompleteTasks.length > 0 ? incompleteTasks.length.toString() : ''
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: '#FF6B6B'
  });
}

async function createTaskDirectly(text: string, tab: chrome.tabs.Tab) {
  const context = `Page: ${tab.title} (${tab.url})`;
  await handleCreateTask({ text, context });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    chrome.action.openPopup();
  }
});

// Initialize badge on startup
updateBadge();