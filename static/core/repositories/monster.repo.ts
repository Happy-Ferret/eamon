import {Monster} from "../models/monster";
import {Game} from "../models/game";
import {Artifact} from "../models/artifact";

/**
 * Class MonsterRepository.
 * Storage class for all monster data.
 */
export class MonsterRepository {

  /**
   * An array of all the Monster objects
   */
  all: Monster[] = [];

  /**
   * An array of visible Monster objects
   */
  visible: Monster[] = [];

  /**
   * The highest ID in the system
   */
  index: number = 0;

  constructor(monster_data: Array<Object>) {
    for (let i in monster_data) {
      this.add(monster_data[i]);
    }
  }

  /**
   * Adds a monster.
   * @param {Object} monster_data
   */
  public add(monster_data) {
    let m = new Monster();
    // "synonyms" in the back end are called "aliases" here
    if (monster_data.synonyms) {
      monster_data.aliases = monster_data.synonyms.split(",");
    }
    m.init(monster_data);

    // autonumber the ID if not provided
    if (m.id === undefined) {
      m.id = this.index + 1;
    }

    if (this.get(m.id) !== null) {
      console.log(this.get(m.id));
      throw new Error("Tried to create a monster #" + m.id + " but that ID is already taken.");
    }

    m.original_group_size = m.count;

    this.all.push(m);
    m.updateInventory();
    m.readyBestWeapon(); // this initializes the monster.weapon object, to show the correct combat verbs

    // add the dead body artifact
    let body = {
      "name": "Dead " + m.name,
      "description": "You see the dead " + m.name,
      "room": null,
      "weight": 100,
      "value": 0,
      "get_all": false,
    };
    let art: Artifact = Game.getInstance().artifacts.add(body);
    m.dead_body_id = art.id;

    // update the autonumber index
    if (m.id > this.index) {
      this.index = m.id;
    }
    return m;
  }

  /**
   * Adds the player to the game. Player has more data than the regular monsters.
   * @param {Object} player_data
   */
  public addPlayer(player_data: any) {
    let game = Game.getInstance();

    // the player JS model expects spell and weapon abilities to be objects, but they are stored
    // as regular fields on the Player Django model. Convert them to objects here.
    player_data.weapon_abilities = {
      1: player_data.wpn_axe,
      2: player_data.wpn_bow,
      3: player_data.wpn_club,
      4: player_data.wpn_spear,
      5: player_data.wpn_sword
    }
    player_data.spell_abilities = {
      "power": player_data.spl_power,
      "heal": player_data.spl_heal,
      "blast": player_data.spl_blast,
      "speed": player_data.spl_speed
    }

    game.player = new Monster();
    game.player.init(player_data);

    // player is always monster 0
    game.player.id = 0;
    game.player.room_id = 1;
    game.player.count = 1;
    game.player.reaction = Monster.RX_FRIEND;
    game.player.spell_abilities_original = {
      "power": game.player.spell_abilities.power,
      "heal": game.player.spell_abilities.heal,
      "blast": game.player.spell_abilities.blast,
      "speed": game.player.spell_abilities.speed
    };
    this.all.push(game.player);

    // create new artifact objects for the weapons and armor the player brought
    for (let i in player_data.inventory) {
      let a: Artifact = player_data.inventory[i];
      let art = game.artifacts.add(a);
      game.player.pickUp(art);
    }

    // ready the player's best weapon, armor, and shield
    game.player.readyBestWeapon();
    game.player.wearBestArmor();

    return game.player;
  }

  /**
   * Gets a numbered monster.
   * @param {number} id
   * @return Monster
   */
  public get(id) {
    for (let i in this.all) {
      if (this.all[i].id === id) {
        return this.all[i];
      }
    }
    return null;
  }

  /**
   * Gets a monster by name.
   * @param {string} name
   * @return Monster
   */
  public getByName(name: string) {
    for (let i in this.all) {
      if (this.all[i].match(name)) {
        return this.all[i];
      }
    }
  }

  /**
   * Gets an artifact in the local area (current room) by name.
   * @param {string} name
   * @return Monster
   */
  getLocalByName(name: string) {
    for (let i in this.all) {
      let m = this.all[i];
      if (m.isHere() && m.match(name)) {
        return m;
      }
    }
    return null;
  }

  /**
   * Gets a random monster.
   * @param {boolean} include_player
   *   Whether or not to include the player in the random selection (default false)
   * @return Monster
   */
  public getRandom(include_player: boolean = false) {
    let nm = this.all.length;
    if (!include_player) {
      nm--;
    }
    let roll = Game.getInstance().diceRoll(1, nm);
    if (include_player) {
      roll--;
    }
    return this.get(roll);
  }

  /**
   * Updates the list of monsters in the current room, that are visible to the player
   * @return Monster[]
   */
  public updateVisible() {
    let game = Game.getInstance();
    let monsters: Monster[] = [];
    game.in_battle = false;
    for (let i in this.all) {
      if (this.all[i].id !== 0 && this.all[i].room_id === game.rooms.current_room.id) {
        // check monster reactions
        if (this.all[i].reaction === Monster.RX_UNKNOWN) {
          this.all[i].checkReaction();
        }
        if (this.all[i].reaction === Monster.RX_HOSTILE) {
          game.in_battle = true;
        }

        monsters.push(this.all[i]);
      }
    }
    this.visible = monsters;
  }

}
