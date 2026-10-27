import type { QteViewPort, StoryViewPort, StoryViewRenderOptions, TextRenderRequest, TextRendererPort } from "../interfaces";
import type { QteSequenceResult, StoryScene } from "../types";
import { StoryContentView } from "./storyContentView";

export class StoryView implements StoryViewPort {
    private readonly root: HTMLElement;
    private readonly textRenderer: TextRendererPort;
    private readonly qteView: QteViewPort;
    private readonly contentView: StoryContentView;
    private currentTextElements: HTMLElement[] = [];
    private currentSceneController: AbortController | null = null;

    constructor(root: HTMLElement, textRenderer: TextRendererPort, qteView: QteViewPort) {
        this.root = root;
        this.textRenderer = textRenderer;
        this.qteView = qteView;
        this.contentView = new StoryContentView(textRenderer);
    }

    public render(scene: StoryScene, options: StoryViewRenderOptions): void {
        this.cancelCurrentScene();

        const content = this.contentView.create(
            scene,
            options.events,
            options.activeEffects,
            options.onChoice,
            options.onEventChoice,
        );
        this.currentTextElements = content.textRequests.map(({ target }) => target);
        this.root.replaceChildren(content.element);

        this.renderText(content.textRequests);
        if (scene.qte && content.qteContainer) {
            this.playQte(scene, content.qteContainer, content.choiceButtons, options.onQteResult);
        }
    }

    private cancelCurrentScene(): void {
        this.currentSceneController?.abort();
        this.currentSceneController = null;
        this.currentTextElements.forEach((element) => this.textRenderer.skip(element));
        this.currentTextElements = [];
    }

    private renderText(requests: readonly TextRenderRequest[]): void {
        for (const request of requests) {
            void this.textRenderer.render(request).catch((error: unknown) => {
                this.showError(`Could not render story text: ${String(error)}`);
            });
        }
    }

    private playQte(
        scene: StoryScene,
        container: HTMLElement,
        choiceButtons: readonly HTMLButtonElement[],
        onQteResult: (result: QteSequenceResult) => void,
    ): void {
        if (!scene.qte) return;

        const controller = new AbortController();
        this.currentSceneController = controller;
        void this.qteView.play(container, scene.qte, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                this.showQteResult(container, result);
                choiceButtons.forEach((button) => {
                    button.disabled = false;
                });
                onQteResult(result);
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                this.showError(`Could not run the quick-time event: ${String(error)}`);
                choiceButtons.forEach((button) => {
                    button.disabled = false;
                });
            });
    }

    private showQteResult(container: HTMLElement, result: QteSequenceResult): void {
        const summary = document.createElement("p");
        summary.className = `qte-summary qte-summary--${result.result}`;
        summary.setAttribute("role", "status");
        summary.textContent = `QTE ${result.result}: ${result.score} points`
            + ` (${result.perfectCount} perfect, ${result.successCount} success, ${result.failCount} missed).`;
        container.append(summary);
    }

    public showError(message: string): void {
        let errorElement = this.root.querySelector<HTMLParagraphElement>("[data-story-error]");
        if (!errorElement) {
            errorElement = document.createElement("p");
            errorElement.dataset.storyError = "true";
            errorElement.setAttribute("role", "alert");
            this.root.append(errorElement);
        }

        errorElement.textContent = message;
    }
}
