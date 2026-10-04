import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

let previousOverflow: string;
let extras: HTMLElement[];
beforeEach(() => { previousOverflow = document.body.style.overflow; extras = []; });
afterEach(() => {
  cleanup();
  for (const element of extras) element.remove();
  document.body.style.overflow = previousOverflow;
});

function externalButton(label: string, inert = false) {
  const button = document.createElement('button');
  button.textContent = label;
  button.inert = inert;
  document.body.append(button);
  extras.push(button);
  return button;
}

function NestedModal() {
  const [open, setOpen] = useState(true);
  return <div data-testid="app-root">
    <main data-testid="background-main"><button>Read the story</button></main>
    <section data-testid="modal-ancestor">
      <aside data-testid="background-aside"><button>Background navigation</button></aside>
      <div>{open && <Modal title="Reading settings" onClose={() => setOpen(false)}>
        <p>Settings remain available while the story is suspended.</p><button>Inside the sheet</button>
      </Modal>}</div>
    </section>
  </div>;
}

describe('Modal interaction boundaries', () => {
  it('contains every ancestor sibling, including a late update notification, and restores inert/focus/scroll on close', async () => {
    const launcher = externalButton('Open settings');
    const alreadyInert = externalButton('Previously unavailable', true);
    launcher.focus();
    document.body.style.overflow = 'scroll';
    render(<NestedModal />);

    const dialog = screen.getByRole('dialog', { name: 'Reading settings' });
    expect(dialog).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    expect(launcher.inert).toBe(true);
    expect(alreadyInert.inert).toBe(true);
    expect(screen.getByTestId('background-main').inert).toBe(true);
    expect(screen.getByTestId('background-aside').inert).toBe(true);
    expect(screen.getByTestId('modal-ancestor').inert).not.toBe(true);
    expect(dialog.inert).not.toBe(true);

    const update = document.createElement('button');
    update.textContent = 'Update available';
    update.inert = false;
    let outside!: HTMLButtonElement;
    act(() => {
      screen.getByTestId('app-root').append(update);
      outside = externalButton('Late background action');
    });
    await waitFor(() => {
      expect(update.inert).toBe(true);
      expect(outside.inert).toBe(true);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
    expect(launcher.inert).toBe(false);
    expect(outside.inert).toBe(false);
    expect(update.inert).toBe(false);
    expect(alreadyInert.inert).toBe(true);
    expect(screen.getByTestId('background-main').inert).not.toBe(true);
    expect(screen.getByTestId('background-aside').inert).not.toBe(true);
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('keeps the scrollable body keyboard reachable and traps both tab directions', () => {
    const onClose = vi.fn();
    render(<Modal title="Long reading sheet" onClose={onClose}>
      <p data-testid="long-copy">Long content that may require keyboard scrolling.</p>
      <button disabled>Unavailable action</button><a href="#last">Last action</a>
    </Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Long reading sheet' });
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('link', { name: 'Last action' });
    const body = screen.getByTestId('long-copy').parentElement!;
    expect(body.tabIndex).toBe(0);
    body.focus();
    expect(body).toHaveFocus();
    dialog.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disconnects background observation when the sheet unmounts', async () => {
    const launcher = externalButton('Launch reading sheet');
    launcher.focus();
    const view = render(<Modal title="Temporary sheet"><p>Reading information.</p></Modal>);
    expect(launcher.inert).toBe(true);
    view.unmount();
    const later = externalButton('Available after close');
    await act(async () => { await Promise.resolve(); });
    expect(later.inert).toBe(false);
    expect(launcher.inert).toBe(false);
    expect(launcher).toHaveFocus();
    expect(document.body.style.overflow).toBe(previousOverflow);
  });
});
