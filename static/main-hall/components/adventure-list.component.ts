import {Component, OnInit}  from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';

import {Player} from '../models/player';
import {AdventureService} from '../services/adventure.service';
import {StatusComponent} from "../components/status.component";
import {PlayerService} from "../services/player.service";

@Component({
  template: `
  <h4>Go on an adventure</h4>
  <p class="adventure"
    *ngFor="let adv of _adventureService.adventures"><a href="/adventure/{{adv.slug}}">{{adv.name}}</a></p>
  <button class="btn"><a (click)="gotoDetail()">Go back to Main Hall</a></button>
  `,
  directives: [StatusComponent]
})
export class AdventureListComponent implements OnInit {
  player: Player;

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _adventureService: AdventureService,
              private _playerService: PlayerService) {
  }

  ngOnInit() {
    this._adventureService.getList();

    let id = Number(this._route.snapshot.params['id']);
    this._playerService.getPlayer(id).subscribe(
      data => {
        this.player = new Player();
        this.player.init(data);
        this.player.update();
      }
    );

  }

  gotoDetail() {
    this._router.navigate(['/player', this.player.id]);
  }
}
