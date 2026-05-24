export class InputManager {
  private readonly input: Record<string, boolean>;
  private readonly keydownHandler: (event: KeyboardEvent) => void;
  private readonly keyupHandler: (event: KeyboardEvent) => void;
  private readonly blurHandler: () => void;
  private readonly preventedCodes = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

  constructor(input: Record<string, boolean>) {
    this.input = input;
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
    this.blurHandler = () => {
      Object.keys(this.input).forEach((code) => {
        this.input[code] = false;
      });
    };
  }

  attach(): void {
    window.addEventListener('keydown', this.keydownHandler, { passive: false });
    window.addEventListener('keyup', this.keyupHandler, { passive: false });
    window.addEventListener('blur', this.blurHandler);
  }

  detach(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    window.removeEventListener('blur', this.blurHandler);
  }
}
