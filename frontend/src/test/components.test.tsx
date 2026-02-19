import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RatingStars from '../components/RatingStars';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { CardSkeleton, GridSkeleton } from '../components/LoadingSkeleton';
import { Camera } from 'lucide-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('RatingStars', () => {
  it('renders 5 stars', () => {
    const { container } = render(<RatingStars rating={3} />, { wrapper: Wrapper });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });

  it('calls onChange when interactive', () => {
    const onChange = vi.fn();
    const { container } = render(<RatingStars rating={2} onChange={onChange} />, { wrapper: Wrapper });
    const buttons = container.querySelectorAll('button');
    buttons[3]!.click();
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState icon={Camera} title="No items" description="Nothing here yet" />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState icon={Camera} title="Empty" description="Test" action={{ label: 'Add', onClick }} />,
      { wrapper: Wrapper },
    );
    const btn = screen.getByText('Add');
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Modal', () => {
  it('renders when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden Modal">
        <p>Hidden content</p>
      </Modal>,
      { wrapper: Wrapper },
    );
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
  });
});

describe('Loading Skeletons', () => {
  it('CardSkeleton renders', () => {
    const { container } = render(<CardSkeleton />, { wrapper: Wrapper });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('GridSkeleton renders correct count', () => {
    const { container } = render(<GridSkeleton count={3} />, { wrapper: Wrapper });
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });
});
