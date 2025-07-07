'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Home,
  CheckSquare,
  Folder,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  Plus,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, projects, selectedProject, setSelectedProject } = useStore();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-20",
      sidebarOpen ? "w-64" : "w-16"
    )}>
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {sidebarOpen && (
          <h1 className="text-xl font-bold text-gray-900">AI Tasks</h1>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Projects Section */}
      {sidebarOpen && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  projectsExpanded && "rotate-90"
                )}
              />
              Projects
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {projectsExpanded && (
            <div className="space-y-1">
              <button
                onClick={() => setSelectedProject(null)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded text-sm",
                  !selectedProject
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                All Tasks
              </button>
              
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2",
                    selectedProject?.id === project.id
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  <span className="text-xs text-gray-400">{project.taskCount}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <Settings className="w-5 h-5" />
          {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </div>
  );
}