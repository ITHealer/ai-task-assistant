// extension/content/content-script.ts
import { SelectionContext, Project } from '../shared/types';

let selectionPopup: HTMLElement | null = null;
let currentSelection: SelectionContext | null = null;

// Initialize content script
function init() {
  // Create selection popup element
  createSelectionPopup();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'show-selection-popup') {
      showSelectionPopup(request.data);
    }
  });

  // Add text selection listener
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('selectionchange', handleSelectionChange);
}

// Create the selection popup UI
function createSelectionPopup() {
  selectionPopup = document.createElement('div');
  selectionPopup.className = 'ai-task-selection-popup';
  selectionPopup.innerHTML = `
    <div class="popup-header">
      <h3>Create AI Task</h3>
      <button class="close-btn" id="close-popup">×</button>
    </div>
    <div class="popup-content">
      <div class="selected-text" id="selected-text"></div>
      <div class="project-selector">
        <label>Project:</label>
        <select id="project-select">
          <option value="">No Project</option>
        </select>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary" id="create-task-btn">
          <span class="icon">✨</span> Create Task
        </button>
        <button class="btn btn-secondary" id="edit-btn">
          <span class="icon">✏️</span> Edit First
        </button>
      </div>
    </div>
    <div class="loading-overlay" id="loading" style="display: none;">
      <div class="spinner"></div>
      <p>Creating task with AI...</p>
    </div>
  `;
  
  document.body.appendChild(selectionPopup);
  
  // Add event listeners
  document.getElementById('close-popup')?.addEventListener('click', hideSelectionPopup);
  document.getElementById('create-task-btn')?.addEventListener('click', handleCreateTask);
  document.getElementById('edit-btn')?.addEventListener('click', handleEditText);
  
  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!selectionPopup?.contains(e.target as Node)) {
      hideSelectionPopup();
    }
  });
}

// Handle text selection
function handleTextSelection(event: MouseEvent) {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();
  
  if (selectedText && selectedText.length > 10) {
    // Show floating button
    showFloatingButton(event.clientX, event.clientY, selectedText);
  }
}

function handleSelectionChange() {
  const selection = window.getSelection();
  if (!selection || selection.toString().trim().length === 0) {
    hideFloatingButton();
  }
}

// Show floating button for quick action
function showFloatingButton(x: number, y: number, text: string) {
  let floatingBtn = document.getElementById('ai-task-floating-btn');
  
  if (!floatingBtn) {
    floatingBtn = document.createElement('button');
    floatingBtn.id = 'ai-task-floating-btn';
    floatingBtn.className = 'ai-task-floating-btn';
    floatingBtn.innerHTML = '✨';
    floatingBtn.title = 'Create AI Task';
    document.body.appendChild(floatingBtn);
    
    floatingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideFloatingButton();
      showSelectionPopup({
        text,
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // Position the button
  floatingBtn.style.left = `${x + 10}px`;
  floatingBtn.style.top = `${y - 40}px`;
  floatingBtn.style.display = 'block';
}

function hideFloatingButton() {
  const floatingBtn = document.getElementById('ai-task-floating-btn');
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

// Show selection popup
async function showSelectionPopup(context: SelectionContext) {
  if (!selectionPopup) return;
  
  currentSelection = context;
  
  // Update selected text display
  const textDisplay = document.getElementById('selected-text');
  if (textDisplay) {
    textDisplay.textContent = context.text.length > 200 
      ? context.text.substring(0, 200) + '...' 
      : context.text;
  }
  
  // Load projects
  await loadProjects();
  
  // Show popup
  selectionPopup.classList.add('show');
  
  // Position popup in viewport center
  const rect = selectionPopup.getBoundingClientRect();
  selectionPopup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
  selectionPopup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}

function hideSelectionPopup() {
  if (selectionPopup) {
    selectionPopup.classList.remove('show');
    currentSelection = null;
  }
}

// Load projects for selector
async function loadProjects() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'get-projects' });
    const projectSelect = document.getElementById('project-select') as HTMLSelectElement;
    
    if (response.projects && projectSelect) {
      // Clear existing options
      projectSelect.innerHTML = '<option value="">No Project</option>';
      
      // Add project options
      response.projects.forEach((project: Project) => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        option.style.color = project.color;
        projectSelect.appendChild(option);
      });
      
      // Load last selected project
      const { lastProjectId } = await chrome.storage.sync.get(['lastProjectId']);
      if (lastProjectId) {
        projectSelect.value = lastProjectId;
      }
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Handle create task
async function handleCreateTask() {
  if (!currentSelection) return;
  
  const loading = document.getElementById('loading');
  const projectSelect = document.getElementById('project-select') as HTMLSelectElement;
  
  if (loading) loading.style.display = 'flex';
  
  try {
    const projectId = projectSelect?.value || undefined;
    
    // Save last selected project
    if (projectId) {
      await chrome.storage.sync.set({ lastProjectId: projectId });
    }
    
    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'create-task',
      data: {
        text: currentSelection.text,
        context: `Page: ${currentSelection.pageTitle} (${currentSelection.pageUrl})`,
        projectId
      }
    });
    
    if (response.success) {
      // Show success animation
      showSuccessAnimation();
      setTimeout(() => {
        hideSelectionPopup();
      }, 1500);
    } else {
      throw new Error(response.error || 'Failed to create task');
    }
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Failed to create task. Please try again.');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// Handle edit text before creating task
function handleEditText() {
  if (!currentSelection) return;
  
  const textDisplay = document.getElementById('selected-text');
  if (!textDisplay) return;
  
  // Convert to editable textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'edit-textarea';
  textarea.value = currentSelection.text;
  textarea.rows = 5;
  
  textDisplay.replaceWith(textarea);
  textarea.focus();
  textarea.select();
  
  // Update buttons
  const createBtn = document.getElementById('create-task-btn');
  const editBtn = document.getElementById('edit-btn');
  
  if (createBtn && editBtn) {
    editBtn.textContent = 'Cancel';
    editBtn.onclick = () => {
      textarea.replaceWith(textDisplay);
      if (editBtn) {
        editBtn.innerHTML = '<span class="icon">✏️</span> Edit First';
        editBtn.onclick = handleEditText;
      }
    };
    
    // Update current selection on change
    textarea.addEventListener('input', () => {
      if (currentSelection) {
        currentSelection.text = textarea.value;
      }
    });
  }
}

// Show success animation
function showSuccessAnimation() {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-animation';
  successDiv.innerHTML = `
    <div class="success-icon">✅</div>
    <p>Task created successfully!</p>
  `;
  
  selectionPopup?.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 1500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// extension/content/selection-popup.css
/* This CSS will be in styles/content.css */
const popupStyles = `
.ai-task-selection-popup {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 400px;
  max-width: 90vw;
  z-index: 999999;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ai-task-selection-popup.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.popup-content {
  padding: 20px;
}

.selected-text {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  max-height: 120px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.project-selector {
  margin-bottom: 20px;
}

.project-selector label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.project-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn .icon {
  font-size: 16px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
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

.loading-overlay p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.ai-task-floating-btn {
  position: fixed;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  z-index: 999998;
  display: none;
  transition: all 0.2s;
}

.ai-task-floating-btn:hover {
  transform: scale(1.1);
  background: #2563eb;
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
}

.success-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.success-animation p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #059669;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
`;