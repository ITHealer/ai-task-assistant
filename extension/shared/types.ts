// extension/shared/types.ts
export interface TaskStep {
  id: string;
  descriptions: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
  sourceText: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  taskCount: number;
  createdAt: string;
}

export interface TextInput {
  text: string;
  context?: string;
}

export interface TaskResponse {
  task: Task;
  confidence: number;
}

export interface SelectionContext {
  text: string;
  pageUrl: string;
  pageTitle: string;
  timestamp: string;
}

// extension/shared/api.ts
import { Task, TextInput, TaskResponse, Project } from './types';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';

class APIClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadApiKey();
  }

  private async loadApiKey() {
    const result = await chrome.storage.sync.get(['apiKey']);
    this.apiKey = result.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Task APIs
  async createTaskFromText(input: TextInput): Promise<TaskResponse> {
    return this.request<TaskResponse>('/api/v1/tasks/from-text', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getTasks(projectId?: string): Promise<Task[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request<Task[]>(`/api/v1/tasks${query}`);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request(`/api/v1/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Project APIs
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/v1/projects');
  }

  async createProject(name: string, color: string): Promise<Project> {
    return this.request<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  }
}

export const apiClient = new APIClient();