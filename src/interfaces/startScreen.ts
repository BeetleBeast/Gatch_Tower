export interface StartScreenActions {
    onContinue: () => void;
    onNewGame: () => void;
}

export interface StartScreenPort {
    show(actions: StartScreenActions): void;
    showMessage(message: string): void;
    hide(): void;
}
