import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  PencilIcon,
  TrashIcon,
  FlagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { GET_GOALS } from '@/graphql/queries';
import { CREATE_GOAL, UPDATE_GOAL, DELETE_GOAL } from '@/graphql/mutations';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  isActive: boolean;
  isAchieved: boolean;
  progressPercentage: number;
  amountRemaining: number;
  daysRemaining: number;
  isOverdue: boolean;
  isOnTrack: boolean;
  monthlyTarget: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const GOAL_TYPES = [
  { value: 'savings', label: 'Savings (increasing)' },
  { value: 'debt_payoff', label: 'Debt Payoff (decreasing)' },
];

const getProgressColor = (pct: number, overdue: boolean, achieved: boolean) => {
  if (achieved) return 'bg-green-500';
  if (overdue) return 'bg-red-500';
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-blue-500';
  if (pct >= 25) return 'bg-yellow-500';
  return 'bg-orange-500';
};

const getProgressBg = (pct: number, overdue: boolean, achieved: boolean) => {
  if (achieved) return 'bg-green-100';
  if (overdue) return 'bg-red-100';
  if (pct >= 75) return 'bg-green-100';
  if (pct >= 50) return 'bg-blue-100';
  if (pct >= 25) return 'bg-yellow-100';
  return 'bg-orange-100';
};

interface FormData {
  name: string;
  description: string;
  goalType: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
}

const emptyForm: FormData = {
  name: '',
  description: '',
  goalType: 'savings',
  targetAmount: '',
  currentAmount: '0',
  targetDate: '',
};

const GoalsPage: React.FC = () => {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);

  const { data, loading, refetch } = useQuery(GET_GOALS);
  const [createGoal, { loading: creating }] = useMutation(CREATE_GOAL);
  const [updateGoal, { loading: updating }] = useMutation(UPDATE_GOAL);
  const [deleteGoal, { loading: deleting }] = useMutation(DELETE_GOAL);

  const goals: Goal[] = data?.goals || [];
  const activeGoals = goals.filter(g => !g.isAchieved);
  const achievedGoals = goals.filter(g => g.isAchieved);
  const displayGoals = showCompleted ? goals : activeGoals;

  const openCreate = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      description: goal.description || '',
      goalType: goal.goalType,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vars = {
        name: form.name,
        description: form.description || null,
        goalType: form.goalType,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        targetDate: form.targetDate || null,
      };

      if (editingGoal) {
        await updateGoal({ variables: { id: editingGoal.id, ...vars } });
        addToast({ title: 'Goal updated', type: 'success' });
      } else {
        await createGoal({ variables: vars });
        addToast({ title: 'Goal created', type: 'success' });
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      addToast({ title: err.message || 'Error saving goal', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal({ variables: { id } });
      addToast({ title: 'Goal deleted', type: 'success' });
      setDeleteConfirm(null);
      refetch();
    } catch (err: any) {
      addToast({ title: err.message || 'Error deleting goal', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Track your financial goals and milestones"
        actions={<Button onClick={openCreate}>New Goal</Button>}
      />

      {activeGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Active Goals</div>
            <div className="text-2xl font-bold text-gray-900">{activeGoals.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Target</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(activeGoals.reduce((s, g) => s + g.targetAmount, 0))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Progress</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(activeGoals.reduce((s, g) => s + g.currentAmount, 0))}
            </div>
          </Card>
        </div>
      )}

      {achievedGoals.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show achieved goals ({achievedGoals.length})
          </label>
        </div>
      )}

      {displayGoals.length === 0 ? (
        <EmptyState
          icon={<FlagIcon className="h-12 w-12" />}
          title="No goals yet"
          description="Create your first financial goal to start tracking progress"
          actionLabel="Create Goal"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGoals.map((goal) => (
            <Card key={goal.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">
                    {goal.goalType === 'debt_payoff' ? 'Debt Payoff' : 'Savings'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(goal)} className="p-1 text-gray-400 hover:text-gray-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(goal.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {goal.description && <p className="text-sm text-gray-500 mb-3">{goal.description}</p>}

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{formatCurrency(goal.currentAmount)}</span>
                  <span className="text-gray-500">{formatCurrency(goal.targetAmount)}</span>
                </div>
                <div className={`w-full h-3 rounded-full ${getProgressBg(goal.progressPercentage, goal.isOverdue, goal.isAchieved)}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(goal.progressPercentage, goal.isOverdue, goal.isAchieved)}`}
                    style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">{goal.progressPercentage.toFixed(1)}%</span>
                  <span className="text-gray-500">{formatCurrency(goal.amountRemaining)} remaining</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {goal.isAchieved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="h-3 w-3" /> Achieved
                  </span>
                )}
                {goal.isOverdue && !goal.isAchieved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ExclamationTriangleIcon className="h-3 w-3" /> Overdue
                  </span>
                )}
                {goal.isOnTrack && !goal.isAchieved && !goal.isOverdue && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">On Track</span>
                )}
                {!goal.isOnTrack && !goal.isAchieved && !goal.isOverdue && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Behind</span>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                {goal.targetDate && <div>Target: {formatDate(goal.targetDate)} ({goal.daysRemaining} days left)</div>}
                {goal.monthlyTarget > 0 && !goal.isAchieved && (
                  <div>Need {formatCurrency(goal.monthlyTarget)}/month to reach goal</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingGoal ? 'Edit Goal' : 'Create Goal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Emergency Fund" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
            <select value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
              <input type="number" required min="0.01" step="0.01" value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="10000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
              <input type="number" min="0" step="0.01" value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="What are you saving for?" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={creating || updating}>{editingGoal ? 'Update' : 'Create'} Goal</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Goal">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this goal? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsPage;
