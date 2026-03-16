import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider, useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

const meta: Meta = {
  title: 'UI/Toast',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj;

const ToastDemo = ({ type, title, message }: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) => {
  const { addToast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => addToast({ type, title, message })}
    >
      Show {type} toast
    </Button>
  );
};

const AllToastsDemo = () => {
  const { addToast } = useToast();
  return (
    <div className="flex gap-3 flex-wrap">
      <Button onClick={() => addToast({ type: 'success', title: 'Success', message: 'Transaction saved successfully!' })}>
        Success
      </Button>
      <Button variant="danger" onClick={() => addToast({ type: 'error', title: 'Error', message: 'Failed to sync account.' })}>
        Error
      </Button>
      <Button variant="secondary" onClick={() => addToast({ type: 'warning', title: 'Warning', message: 'Budget exceeded for Food & Drink.' })}>
        Warning
      </Button>
      <Button variant="ghost" onClick={() => addToast({ type: 'info', title: 'Info', message: '3 new transactions imported.' })}>
        Info
      </Button>
    </div>
  );
};

export const Success: Story = {
  render: () => <ToastDemo type="success" title="Saved" message="Budget saved!" />,
};

export const Error: Story = {
  render: () => <ToastDemo type="error" title="Error" message="Connection failed." />,
};

export const Warning: Story = {
  render: () => <ToastDemo type="warning" title="Warning" message="Over budget!" />,
};

export const Info: Story = {
  render: () => <ToastDemo type="info" title="Syncing" message="Syncing accounts..." />,
};

export const TitleOnly: Story = {
  render: () => <ToastDemo type="success" title="Changes saved" />,
};

export const AllVariants: Story = {
  render: () => <AllToastsDemo />,
};
