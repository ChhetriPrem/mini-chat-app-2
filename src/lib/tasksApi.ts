import { supabase } from './supabase';

export type DurationType = '24h' | 'custom' | 'weekly' | 'permanent';
export type TargetGender = 'male' | 'female' | 'all';
export type TaskStatus = 'active' | 'inactive';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  reward_coins: number;
  target_gender: TargetGender;
  duration_type: DurationType;
  expiry_date: string | null;
  target_count: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientTask {
  task_id: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  reward_coins: number;
  duration_type: DurationType;
  expiry_date: string | null;
  target_count: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export async function getClientTasks(userId: string): Promise<ClientTask[]> {
  const { data, error } = await supabase.rpc('get_client_tasks', { p_user_id: userId });
  if (error) throw error;
  return data ?? [];
}

export async function incrementTaskProgress(userId: string, taskId: string, amount = 1) {
  const { data, error } = await supabase.rpc('increment_task_progress', {
    p_user_id: userId,
    p_task_id: taskId,
    p_amount: amount,
  });
  if (error) throw error;
  return data;
}

export async function claimTaskReward(userId: string, taskId: string): Promise<number> {
  const { data, error } = await supabase.rpc('claim_task_reward', {
    p_user_id: userId,
    p_task_id: taskId,
  });
  if (error) throw error;
  return data as number;
}

export async function adminListTasks(): Promise<Task[]> {
  const { data, error } = await supabase.rpc('admin_list_tasks');
  if (error) throw error;
  return data ?? [];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  iconUrl?: string;
  rewardCoins: number;
  targetGender: TargetGender;
  durationType: DurationType;
  expiryDate?: string | null;
  targetCount?: number;
}

export async function adminCreateTask(input: CreateTaskInput): Promise<Task> {
  validateTaskInput(input);
  const { data, error } = await supabase.rpc('admin_create_task', {
    p_title: input.title,
    p_description: input.description ?? null,
    p_icon_url: input.iconUrl ?? null,
    p_reward_coins: input.rewardCoins,
    p_target_gender: input.targetGender,
    p_duration_type: input.durationType,
    p_expiry_date: input.durationType === 'custom' ? input.expiryDate : null,
    p_target_count: input.targetCount ?? 1,
  });
  if (error) throw error;
  return data as Task;
}

export interface UpdateTaskInput extends CreateTaskInput {
  id: string;
  status: TaskStatus;
}

export async function adminUpdateTask(input: UpdateTaskInput): Promise<Task> {
  validateTaskInput(input);
  const { data, error } = await supabase.rpc('admin_update_task', {
    p_task_id: input.id,
    p_title: input.title,
    p_description: input.description ?? null,
    p_icon_url: input.iconUrl ?? null,
    p_reward_coins: input.rewardCoins,
    p_target_gender: input.targetGender,
    p_duration_type: input.durationType,
    p_expiry_date: input.durationType === 'custom' ? input.expiryDate : null,
    p_status: input.status,
    p_target_count: input.targetCount ?? 1,
  });
  if (error) throw error;
  return data as Task;
}

export async function adminDeleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_task', { p_task_id: taskId });
  if (error) throw error;
}

function validateTaskInput(input: CreateTaskInput) {
  if (!input.title?.trim()) throw new Error('Task title is required');
  if (input.rewardCoins == null || input.rewardCoins < 0) throw new Error('Reward coins cannot be negative');
  if (!input.durationType) throw new Error('Duration type is required');
  if (!input.targetGender) throw new Error('Gender selection is required');
  if (input.durationType === 'custom') {
    if (!input.expiryDate) throw new Error('Custom duration requires an expiry date');
    if (new Date(input.expiryDate).getTime() < Date.now()) throw new Error('Expiry date cannot be in the past');
  }
}

export function formatRemainingTime(expiryDate: string | null): string {
  if (!expiryDate) return 'Permanent';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 2) return `${diffDays} Days remaining`;
  if (diffDays === 1) return 'Expires Tomorrow';
  if (diffHours >= 1) return `${diffHours}h ${diffMinutes % 60}m remaining`;
  return `${diffMinutes}m remaining`;
}

export function isTaskExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() <= Date.now();
}
