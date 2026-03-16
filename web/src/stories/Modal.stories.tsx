import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Modal>;

const ModalDemo = ({ size, title = 'Modal Title' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; title?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        <p className="text-gray-600 dark:text-gray-400">
          This is the modal content. It can contain any React elements.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </>
  );
};

const FormModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add Transaction</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Transaction" size="lg">
        <div className="space-y-4">
          <Input label="Description" placeholder="Coffee shop" />
          <Input label="Amount" type="number" placeholder="0.00" />
          <Input label="Date" type="date" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsOpen(false)}>Add Transaction</Button>
        </div>
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const SmallModal: Story = {
  render: () => <ModalDemo size="sm" title="Confirm Delete" />,
};

export const LargeModal: Story = {
  render: () => <ModalDemo size="lg" title="Account Details" />,
};

export const ExtraLargeModal: Story = {
  render: () => <ModalDemo size="xl" title="Transaction History" />,
};

export const FormModal: Story = {
  render: () => <FormModalDemo />,
};
