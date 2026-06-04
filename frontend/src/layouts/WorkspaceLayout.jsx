import React from 'react';
import { Outlet } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../contexts/WorkspaceContext';

function WorkspaceHeader() {
  const { workspaceId, workspaceName } = useWorkspace();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow">
          <span className="text-white font-bold">WS</span>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Workspace</div>
          <div className="text-2xl font-semibold">{workspaceName || `Workspace #${workspaceId ?? '-'}`}</div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <WorkspaceHeader />
      <Outlet />
    </WorkspaceProvider>
  );
}

