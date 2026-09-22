export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      !!target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"]',
      ))
  )
}

export class KeyboardShortcutManager {
  constructor(private handler: (event: KeyboardEvent) => void) {}
  attach(): () => void {
    window.addEventListener('keydown', this.handler)
    return () => window.removeEventListener('keydown', this.handler)
  }
}
