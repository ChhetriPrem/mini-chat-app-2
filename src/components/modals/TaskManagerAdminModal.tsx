import React, { useEffect, useState } from 'react';
import {
  Task,
  DurationType,
  TargetGender,
  TaskStatus,
  adminListTasks,
  adminCreateTask,
  adminUpdateTask,
  adminDeleteTask,
  formatRemainingTime,
} from '../../lib/tasksApi';

interface TaskManagerAdminModalProps {
  onClose: () => void;
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  iconUrl: string;
  rewardCoins: string;
  targetGender: TargetGender;
  durationType: DurationType;
  expiryDate: string;
  targetCount: string;
  status: TaskStatus;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  iconUrl: '',
  rewardCoins: '0',
  targetGender: 'all',
  durationType: '24h',
  expiryDate: '',
  targetCount: '1',
  status: 'active',
};

export default function TaskManagerAdminModal({ onClose }: TaskManagerAdminModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListTasks();
      setTasks(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      iconUrl: task.icon_url ?? '',
      rewardCoins: String(task.reward_coins),
      targetGender: task.target_gender,
      durationType: task.duration_type,
      expiryDate: task.expiry_date ? toLocalInput(task.expiry_date) : '',
      targetCount: String(task.target_count),
      status: task.status,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const rewardCoins = Number(form.rewardCoins);
      if (Number.isNaN(rewardCoins) || rewardCoins < 0) {
        throw new Error('Reward coins cannot be negative');
      }
      const targetCount = Math.max(1, Number(form.targetCount) || 1);
      const expiryIso =
        form.durationType === 'custom' && form.expiryDate
          ? new Date(form.expiryDate).toISOString()
          : null;

      if (editingId) {
        await adminUpdateTask({
          id: editingId,
          title: form.title,
          description: form.description,
          iconUrl: form.iconUrl,
          rewardCoins,
          targetGender: form.targetGender,
          durationType: form.durationType,
          expiryDate: expiryIso,
          targetCount,
          status: form.status,
        });
      } else {
        await adminCreateTask({
          title: form.title,
          description: form.description,
          iconUrl: form.iconUrl,
          rewardCoins,
          targetGender: form.targetGender,
          durationType: form.durationType,
          expiryDate: expiryIso,
          targetCount,
        });
      }
      resetForm();
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this task? Existing user progress will also be removed.')) return;
    setError(null);
    try {
      await adminDeleteTask(id);
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete task');
    }
  }

  async function toggleStatus(task: Task) {
    setError(null);
    try {
      await adminUpdateTask({
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        iconUrl: task.icon_url ?? '',
        rewardCoins: task.reward_coins,
        targetGender: task.target_gender,
        durationType: task.duration_type,
        expiryDate: task.expiry_date,
        targetCount: task.target_count,
        status: task.status === 'active' ? 'inactive' : 'active',
      });
      await loadTasks();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update status');
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content task-manager-admin">
        <div className="modal-header">
          <h2>Task Manager</h2>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Reward Coins
              <input
                type="number"
                min={0}
                required
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: e.target.value })}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label>
            Icon / Image URL (optional)
            <input
              value={form.iconUrl}
              onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label>
              Target Gender
              <select
                value={form.targetGender}
                onChange={(e) => setForm({ ...form, targetGender: e.target.value as TargetGender })}
              >
                <option value="all">All Users</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label>
              Duration Type
              <select
                value={form.durationType}
                onChange={(e) => setForm({ ...form, durationType: e.target.value as DurationType })}
              >
                <option value="24h">24 Hours</option>
                <option value="custom">Custom Expiry Date &amp; Time</option>
                <option value="weekly">Weekly Reset</option>
                <option value="permanent">No Expiry (Permanent)</option>
              </select>
            </label>
          </div>

          {form.durationType === 'custom' && (
            <label>
              Expiry Date &amp; Time
              <input
                type="datetime-local"
                required
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </label>
          )}

          <div className="form-row">
            <label>
              Target Count (e.g. "watch 5 streams" = 5)
              <input
                type="number"
                min={1}
                value={form.targetCount}
                onChange={(e) => setForm({ ...form, targetCount: e.target.value })}
              />
            </label>

            {editingId && (
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <hr />

        <h3>Existing Tasks</h3>
        {loading ? (
          <p>Loading tasks...</p>
        ) : (
          <table className="task-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Reward</th>
                <th>Gender</th>
                <th>Duration</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.reward_coins} coins</td>
                  <td>{task.target_gender}</td>
                  <td>{task.duration_type}</td>
                  <td>{formatRemainingTime(task.expiry_date)}</td>
                  <td>
                    <button className={`status-pill ${task.status}`} onClick={() => toggleStatus(task)}>
                      {task.status}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => startEdit(task)}>Edit</button>
                    <button onClick={() => handleDelete(task.id)} className="btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7}>No tasks yet. Create one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
