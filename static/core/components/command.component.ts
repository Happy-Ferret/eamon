import {Component, Input, ViewChild, ElementRef, Renderer} from "@angular/core";

@Component({
  selector: "command-prompt",
  template: `
    <div class="form-inline">
    <div class="command-prompt form-group" *ngIf="game.active">
      <span class="prompt">Your Command: </span>
      <input #cmd (keyup)="onKeyPress($event, cmd.value)"
       type="text" class="form-control"
       [(ngModel)]="command"
       name="command"
       placeholder="{{last_command}}"
       autocomplete="off"
       />
    </div>
    </div>
    <div class="return-button-container" *ngIf="game.won">
      <button class="btn btn-success" id="return" (click)="exit()">Return to Main Hall</button>
    </div>
    <div class="return-button-container" *ngIf="game.died && !restore">
      <button class="btn btn-success" id="start_over" (click)="startOver()">Start Over</button>
      <button class="btn btn-success" id="restore" (click)="showSaves()">Restore a Saved Game</button>
    </div>
    <div class="return-button-container" *ngIf="game.died && restore">
      <span *ngIf="game.saves">
        <button class="btn btn-success" *ngFor="let sv of game?.saves" (click)="restoreSavedGame(sv)">{{sv}}</button>
      </span>
      <span *ngIf="!game.saves">
        You have no saved games.
      </span>
      <button class="btn btn-success" (click)="hideSaves()">Cancel</button>
    </div>
    `,
})
export class CommandPromptComponent {
  @Input() game;
  @ViewChild('cmd') input: ElementRef;

  static KEYCODE_UP: number = 38;
  static KEYCODE_DOWN: number = 40;
  static KEYCODE_ENTER: number = 13;

  public command: string;
  public last_command: string;
  public restore: boolean = false;

  constructor(private renderer: Renderer) {}

  ngAfterViewInit() {
    if (this.input) this.renderer.invokeElementMethod(this.input.nativeElement, 'focus');
  }

  /**
   * Handle keypresses, looking for special keys like enter and arrows.
   * Other keys like letters, numbers, space, etc. will be ignored.
   */
  onKeyPress(event: KeyboardEvent, value: string) {

    switch (event.keyCode) {

      case CommandPromptComponent.KEYCODE_ENTER:  // enter key runs the command
        if (!this.game.ready) return;

        // if the user didn't type a new command, run the last command
        if (value.length === 0) {
          value = this.game.history.getLastCommand();
        }

        // start a new history entry
        this.game.ready = false;

        // run the command
        let result = this.game.command_parser.run(value);

        // clear the input box
        this.command = "";
        this.last_command = value;

        break;

      case CommandPromptComponent.KEYCODE_UP:
        // up arrow moves back through the history
        let prev_command = this.game.history.getOlderCommand();
        if (prev_command !== null) {
          this.command = prev_command;
        }
        break;

      case CommandPromptComponent.KEYCODE_DOWN:
        let next_command = this.game.history.getNewerCommand();
        if (next_command !== null) {
          this.command = next_command;
        }
        break;

      // other keys have no special function.
    }
  }

  exit(): void {
    this.game.player.sellItems();
  }

  startOver(): void {
    window.location.reload();
  }

  showSaves(): void {
    this.restore = true;
  }

  hideSaves(): void {
    this.restore = false;
  }

  restoreSavedGame(save): void {
    let slot = parseInt(save);
    this.game.restore(slot);
    this.game.tick();
    this.restore = false;
  }
}
