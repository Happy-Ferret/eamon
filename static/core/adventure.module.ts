import {NgModule, CUSTOM_ELEMENTS_SCHEMA}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule}    from '@angular/forms';
import {HttpModule} from '@angular/http';

import {Nl2brPipe} from "./pipes/nl2br.pipe";

import {AdventureComponent} from "./components/adventure.component";

import {GameLoaderService} from "./services/game-loader.service";
import {CommandPromptComponent} from "./components/command.component";
import {HistoryComponent} from "./components/history.component";
import {ArtifactComponent} from "./components/artifact.component";
import {SellItemsComponent} from "./components/sell-items.component";
import {HintsComponent} from "./components/hints.component";
import {CommandListComponent} from "./components/command-list.component";
import {StatusComponent} from "./components/status.component";

@NgModule({
  imports: [BrowserModule, FormsModule, HttpModule],
  declarations: [
    Nl2brPipe,
    AdventureComponent,
    ArtifactComponent,
    CommandPromptComponent,
    HistoryComponent,
    SellItemsComponent,
    HintsComponent,
    CommandListComponent,
    StatusComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AdventureComponent],
  providers: [GameLoaderService]
})
export class AdventureModule {
}
