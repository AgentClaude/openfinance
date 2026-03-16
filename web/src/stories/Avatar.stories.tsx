import type { Meta, StoryObj } from '@storybook/react-vite';
import Avatar from '../components/ui/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = { args: { name: 'James Watling' } };
export const SingleName: Story = { args: { name: 'James' } };
export const WithImage: Story = {
  args: {
    name: 'James Watling',
    src: 'https://i.pravatar.cc/150?u=james',
  },
};
export const ExtraSmall: Story = { args: { name: 'JW', size: 'xs' } };
export const Small: Story = { args: { name: 'JW', size: 'sm' } };
export const Medium: Story = { args: { name: 'JW', size: 'md' } };
export const Large: Story = { args: { name: 'JW', size: 'lg' } };
export const ExtraLarge: Story = { args: { name: 'JW', size: 'xl' } };
