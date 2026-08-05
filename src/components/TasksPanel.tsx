import React, { useEffect, useState, useCallback } from 'react';
import {
  ClientTask,
  getClientTasks,
  claimTaskReward,
  formatRemainingTime,
  isTaskExpired,
} from '../lib/tasksApi';

interface TasksPanelProps {
  userId: string;
  onCoinsUpdated?: (newBalance: number) => void;
}

export default function TasksPanel({ userId, onCoinsUpdated }: TasksPanelProps) {
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const loadTasks = useCallback(async () => {
    setError(null);
    try {
      const data = await getClientTasks(userId);
      setTasks(data.filter((t) => !isTaskExpired(t.expiry_date)));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTasks();
    const refreshInterval = setInterval(loadTasks, 60000);
    const tickInterval = setInterval(() => setTick((n) => n + 1), 30000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [loadTasks]);

  async function handleClaim(taskId: string) {
    setClaimingId(taskId);
    setError(null);
    try {
      const newBalance = await claimTaskReward(userId, taskId);
      onCoinsUpdated?.(newBalance);
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  }

  if (loading) return <div className="tasks-panel"><p>Loading tasks...</p></div>;

  return (
    <div className="tasks-panel">
      <h2>Tasks</h2>
      {error && <div className="alert alert-error">{error}</div>}

      {tasks.length === 0 && <p className="tasks-empty">No tasks available right now. Check back later!</p>}

      <div className="task-list">
        {tasks.map((task) => {
          const pct = Math.min(100, Math.round((task.progress / task.target_count) * 100));
          return (
            <div key={task.task_id} className={`task-card ${task.completed ? 'completed' : ''}`}>
              {task.icon_url && <img src={task.icon_url} alt="" className="task-icon" />}
              <div className="task-body">
                <div className="task-title-row">
                  <span className="task-title">{task.title}</span>
                  <span className="task-reward">🪙 {task.reward_coins}</span>
                </div>
                {task.description && <p className="task-description">{task.description}</p>}

                <div className="task-progress-bar">
                  <div className="task-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="task-meta-row">
                  <span className="task-progress-label">
                    {task.progress}/{task.target_count}
                  </span>
                  <span className="task-remaining">{formatRemainingTime(task.expiry_date)}</span>
                </div>

                <div className="task-actions">
                  {task.claimed ? (
                    <button disabled className="btn-claimed">Claimed ✓</button>
                  ) : task.completed ? (
                    <button
                      onClick={() => handleClaim(task.task_id)}
                      disabled={claimingId === task.task_id}
                      className="btn-claim"
                    >
                      {claimingId === task.task_id ? 'Claiming...' : 'Claim'}
                    </button>
                  ) : (
                    <button disabled className="btn-in-progress">In Progress</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
