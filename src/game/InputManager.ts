import { HEIGHT, WIDTH } from '../config/constants';
import type { PointerInput } from './GameState';

export class InputManager {
  private readonly input: Record<string, boolean>;
  private readonly pointer: PointerInput;
  private readonly target: HTMLElement;
  private readonly keydownHandler: (event: KeyboardEvent) => void;
  private readonly keyupHandler: (event: KeyboardEvent) => void;
  private readonly pointerMoveHandler: (event: PointerEvent) => void;
  private readonly pointerDownHandler: (event: PointerEvent) => void;
  private readonly pointerLeaveHandler: () => void;
  private readonly blurHandler: () => void;
  private readonly preventedCodes = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

  constructor(input: Record<string, boolean>, pointer: PointerInput, target: HTMLElement) {
    this.input = input;
    this.pointer = pointer;
    this.target = target;
    this.keydownHandler = (event) => {
      this.input[event.code] = true;
      if (this.preventedCodes.has(event.code)) {
        event.preventDefault();
      }
    };
    this.keyupHandler = (event) => {
      this.input[event.code] = false;
      if (this.preventedCodes.has(event.code)) {
        event.preventDefault();
      }
    };
    this.pointerMoveHandler = (event) => {
      this.updatePointer(event);
    };
    this.pointerDownHandler = (event) => {
      this.updatePointer(event);
      this.input.Space = true;
      this.target.setPointerCapture?.(event.pointerId);
    };
    this.pointerLeaveHandler = () => {
      this.pointer.active = false;
      this.input.Space = false;
    };
    this.blurHandler = () => {
      Object.keys(this.input).forEach((code) => {
        this.input[code] = false;
      });
      this.pointer.active = false;
    };
  }

  attach(): void {
    window.addEventListener('keydown', this.keydownHandler, { passive: false });
    window.addEventListener('keyup', this.keyupHandler, { passive: false });
    this.target.addEventListener('pointermove', this.pointerMoveHandler);
    this.target.addEventListener('pointerdown', this.pointerDownHandler);
    this.target.addEventListener('pointerup', this.pointerLeaveHandler);
    this.target.addEventListener('pointercancel', this.pointerLeaveHandler);
    this.target.addEventListener('pointerleave', this.pointerLeaveHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  detach(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.target.removeEventListener('pointermove', this.pointerMoveHandler);
    this.target.removeEventListener('pointerdown', this.pointerDownHandler);
    this.target.removeEventListener('pointerup', this.pointerLeaveHandler);
    this.target.removeEventListener('pointercancel', this.pointerLeaveHandler);
    this.target.removeEventListener('pointerleave', this.pointerLeaveHandler);
    window.removeEventListener('blur', this.blurHandler);
  }

  private updatePointer(event: PointerEvent): void {
    const bounds = this.target.getBoundingClientRect();
    const scaleX = WIDTH / Math.max(1, bounds.width);
    const scaleY = HEIGHT / Math.max(1, bounds.height);

    this.pointer.x = (event.clientX - bounds.left) * scaleX;
    this.pointer.y = (event.clientY - bounds.top) * scaleY;
    this.pointer.active = true;
  }
}
