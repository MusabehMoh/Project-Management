import React from 'react';
import { useMembersTasks } from "@/hooks/useMembersTasks";

export const TasksTest = () => {
  const { tasks, loading, error } = useMembersTasks([]);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Tasks Debug Test</h1>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Error: {error || 'none'}</div>
      <div>Tasks Count: {tasks?.length || 0}</div>
      <div>Tasks: {JSON.stringify(tasks?.slice(0, 2), null, 2)}</div>
    </div>
  );
};
