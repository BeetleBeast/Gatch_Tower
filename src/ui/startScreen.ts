import type { StartScreenActions, StartScreenPort } from "../interfaces/index";

export class StartScreen implements StartScreenPort {
    private readonly root: HTMLElement;

    constructor(root: HTMLElement) {
        this.root = root;
    }

    public show(actions: StartScreenActions): void {
        const screen = document.createElement("section");
        screen.className = "startParentParent";

        const content = document.createElement("div");
        content.className = "startParent";

        const title = document.createElement("h1");
        title.textContent = "Gatcha Tower";

        const continueButton = this.createButton("Continue", actions.onContinue);
        const newGameButton = this.createButton("Start a new game", actions.onNewGame);

        content.append(title, continueButton, newGameButton);
        screen.append(content);
        this.root.replaceChildren(screen);
    }

    public showMessage(message: string): void {
        let messageElement = this.root.querySelector<HTMLParagraphElement>("[data-start-message]");
        if (!messageElement) {
            messageElement = document.createElement("p");
            messageElement.dataset.startMessage = "true";
            messageElement.setAttribute("role", "status");
            this.root.firstElementChild?.append(messageElement);
        }

        messageElement.textContent = message;
    }

    public hide(): void {
        this.root.replaceChildren();
    }

    private createButton(label: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "startscreen";
        button.textContent = label;
        button.addEventListener("click", onClick);
        return button;
    }
}
