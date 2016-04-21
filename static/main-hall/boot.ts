import {bootstrap}    from "angular2/platform/browser";
import {HTTP_PROVIDERS} from "angular2/http";
import {ROUTER_PROVIDERS} from 'angular2/router';
import "rxjs/add/operator/map";
import {MainHallComponent} from "./components/main-hall.component";

import {PlayerService} from "./services/player.service";

bootstrap(MainHallComponent, [
  HTTP_PROVIDERS,
  ROUTER_PROVIDERS,
  PlayerService
]);
