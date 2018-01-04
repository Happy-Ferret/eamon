import {NgModule, CUSTOM_ELEMENTS_SCHEMA}      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule}    from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CookieModule } from 'ngx-cookie';

import {DividePipe} from "./pipes/divide.pipe";
import {TitleCasePipe} from "./pipes/title-case.pipe";
import {PercentOrNonePipe} from "./pipes/percent-or-none.pipe";

import {MainHallComponent} from "./components/main-hall.component";
import {AdventureListComponent} from "./components/adventure-list.component";
import {PlayerListComponent} from "./components/player-list.component";
import {PlayerAddComponent} from "./components/player-add.component";
import {PlayerDetailComponent} from "./components/player-detail.component";
import {BankComponent} from "./components/bank.component";
import {ShopComponent} from "./components/shop.component";
import {ArtifactTileComponent} from "./components/artifact-tile.component";
import {WizardComponent} from "./components/wizard.component";
import {StatusComponent} from "./components/status.component";

import {PlayerService} from "./services/player.service";
import {AdventureService} from "./services/adventure.service";
import {ShopService} from "./services/shop.service";
import {UuidService} from "./services/uuid.service";
import {routing} from './main-hall.routing';

@NgModule({
  imports: [BrowserModule, BrowserAnimationsModule, FormsModule, HttpClientModule, routing, CookieModule.forRoot()],
  declarations: [
    MainHallComponent,
    AdventureListComponent,
    PlayerListComponent,
    PlayerAddComponent,
    PlayerDetailComponent,
    BankComponent,
    ShopComponent,
    ArtifactTileComponent,
    StatusComponent,
    WizardComponent,
    DividePipe,
    PercentOrNonePipe,
    TitleCasePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [MainHallComponent],
  providers: [PlayerService, AdventureService, ShopService, UuidService]
})
export class MainHallModule {
}
