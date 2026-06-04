import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }) {
  const params = useParams();
  const workspaceIdFromRoute = params?.workspaceId;

  const [workspaceId, setWorkspaceId] = useState(workspaceIdFromRoute ?? null);
  const [workspaceName, setWorkspaceName] = useState(null);

  useEffect(() => {
    setWorkspaceId(workspaceIdFromRoute ?? null);
    
    setWorkspaceName(workspaceIdFromRoute ? `Workspace #${workspaceIdFromRoute}` : null);
  }, [workspaceIdFromRoute]);

  const value = useMemo(
    () => ({
      workspaceId,
      workspaceName,
      setWorkspaceId,
    }),
    [workspaceId, workspaceName]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

