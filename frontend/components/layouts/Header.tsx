'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Search,
  Bell,
  User,
  Plus,
  List,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

export default function Header() {
  const { searchQuery, setSearchQuery, viewMode, setViewMode } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 ml-6">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === 'list'
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === 'board'
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === 'calendar'
                    ? "bg-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Create Task */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}