import {Game} from '../models/game';
import {GameObject} from '../models/game-object';
import {Artifact} from '../models/artifact';
import {Room} from '../models/room';
import {RoomExit} from '../models/room';

/**
 * Monster class. Represents all properties of a single monster
 */
export class Monster extends GameObject {

  // constants
  static PLAYER:number = 0;
  static FRIEND_ALWAYS: string = 'friend';
  static FRIEND_NEUTRAL: string = 'neutral';
  static FRIEND_NEVER: string = 'hostile';
  static FRIEND_RANDOM: string = 'random';
  // reaction to player
  static RX_UNKNOWN: string = 'unknown';
  static RX_FRIEND: string = 'friend';
  static RX_NEUTRAL: string = 'neutral';
  static RX_HOSTILE: string = 'hostile';
  // status
  static STATUS_ALIVE: number = 1;
  static STATUS_DEAD: number = 2;

  // data properties for all monsters
  // don't use default values here because they won't be overwritten when loading the data object.
  id: number;
  name: string;
  description: string;
  room_id: number;
  gender:string;
  hardiness: number;
  agility: number;
  friendliness: string;
  friend_odds: number;
  courage: number;
  gold:number;
  weapon_id: number;
  attack_odds: number;
  weapon_dice: number;
  weapon_sides: number;
  defense_bonus: number; // makes monster harder to hit
  armor_strength: number;

  // data properties for player only
  charisma: number;
  spell_abilities:any;
  spell_abilities_original:any;
  weapon_abilities:{ [key:number]:number; };
  armor_expertise: number;

  // game-state properties
  seen: boolean = false;
  reaction: string = Monster.RX_UNKNOWN;
  status: number = Monster.STATUS_ALIVE;
  damage: number = 0;
  weight_carried: number = 0;
  armor_worn: Artifact[];
  weapon: Artifact;
  inventory: Artifact[];
  speed_time: number = 0; // time remaining on speed spell
  speed_multiplier: number = 1; // multiplier for to hit: 2 when speed spell is active; 1 otherwise
  dead_body_id: number; // the ID of the auto-generated dead body artifact for non-player monsters

  /**
   * Moves the monster to a specific room.
   */
  moveToRoom(room_id) {
    this.room_id = room_id;

    // when the player moves, set the current room reference
    if (this.id == Monster.PLAYER) {
      var game = Game.getInstance();
      game.rooms.current_room = game.rooms.getRoomById(room_id);
    }
  }

  /**
   * Monster flees out a random exit
   */
  chooseRandomExit():Room {
    var game = Game.getInstance();

    // choose a random exit
    var exits:RoomExit[] = game.rooms.current_room.exits;
    var good_exits:RoomExit[] = [];
    // exclude any locked exit and the game exit
    for (var i in exits) {
      // FIXME: NPCs will be able to flee through locked doors if the PLAYER is holding the key.
      if (exits[i].room_to != RoomExit.EXIT && !exits[i].isLocked()) {
        good_exits.push(exits[i]);
      }
    }
    if (good_exits.length == 0) {
      return null;
    } else {
      var random_exit = good_exits[Math.floor(Math.random() * good_exits.length)];

      var room_to = game.rooms.getRoomById(random_exit.room_to);
      return room_to;
    }
  }

  /**
   * Checks the monster's reaction to the player
   */
  checkReaction() {
    switch (this.friendliness) {
      case Monster.FRIEND_ALWAYS:
        this.reaction = Monster.RX_FRIEND;
        break;
      case Monster.FRIEND_NEUTRAL:
        this.reaction = Monster.RX_NEUTRAL;
        break;
      case Monster.FRIEND_NEVER:
        this.reaction = Monster.RX_HOSTILE;
        break;
      case Monster.FRIEND_RANDOM:
        // calculate reaction based on random odds

        this.reaction = Monster.RX_FRIEND;
        var friend_odds = this.friend_odds + ((Game.getInstance().monsters.player.charisma - 10) * 2)
        // first roll determines a neutral vs. friendly monster
        var roll1 = Game.getInstance().diceRoll(1,100);
        if (roll1 > friend_odds) {
          this.reaction = Monster.RX_NEUTRAL;
          // second roll determines a hostile vs. neutral monster
          var roll2 = Game.getInstance().diceRoll(1,100)
          if (roll2 > friend_odds) {
            this.reaction = Monster.RX_HOSTILE;
          }
        }
        break;
    }
  }

  /**
   * Recheck monster's reaction when the player attacks it or otherwise
   * does something nasty.
   */
  hurtFeelings() {

    // this logic is only meaningful for neutral and friendly monsters
    if (this.reaction != Monster.RX_HOSTILE) {

      // clear the automatic reactions and set a default percentage
      switch (this.friendliness) {
        case Monster.FRIEND_ALWAYS:
          this.friend_odds = 100;
          break;
        case Monster.FRIEND_NEUTRAL:
          this.friend_odds = 50;
          break;
        case Monster.FRIEND_NEVER:
          this.friend_odds = 50;
          break;
      }
      this.friendliness = Monster.FRIEND_RANDOM;

      // decrease friend odds by half, then recheck
      this.friend_odds /= 2;

      var old_reaction = this.reaction;
      this.checkReaction();
      // attacking a neutral monster can never make it become friendly
      if (old_reaction == Monster.RX_NEUTRAL && this.reaction == Monster.RX_FRIEND) {
        this.reaction = Monster.RX_NEUTRAL;
      }
    }
  }

  /**
   * Calculates the maximum weight the monster can carry
   * @return number
   */
  maxWeight() {
    return this.hardiness * 10;
  }

  /**
   * The monster picks up an artifact
   * @param Artifact artifact
   */
  pickUp(artifact:Artifact) {
    artifact.room_id = null;
    artifact.monster_id = this.id;
    this.updateInventory();
  }

  /**
   * The monster drops an artifact
   * @param Artifact artifact
   */
  drop(artifact:Artifact) {
    artifact.room_id = this.room_id;
    artifact.monster_id = null;
    artifact.is_worn = false;

    // if dropping the ready weapon, set weapon to none
    if (artifact.id == this.weapon_id) {
      this.weapon_id = null;
      this.weapon = null;
    }

    this.updateInventory();
  }

  /**
   * Refreshes the inventory of artifacts carried by the monster
   */
  updateInventory() {
    this.inventory = [];
    if (this.id == Monster.PLAYER) { // armor handling currently only applies to the player
      this.armor_worn = [];
      this.armor_strength = 0;
    }
    this.weight_carried = 0;
    for (var i in Game.getInstance().artifacts.all) {
      var a = Game.getInstance().artifacts.all[i];
      if (a.monster_id == this.id) {
        this.inventory.push(a);
        this.weight_carried += a.weight;
        if (this.id == Monster.PLAYER) {
          if (a.is_worn && (a.is_armor || a.is_shield)) {
            this.armor_worn.push(a);
            this.armor_strength += a.armor_strength;
          }
        }
      }
    }
  }

  /**
   * Determines whether a monster is carrying an artifact.
   * @param number artifact_id The ID of an artifact
   * @return boolean
   */
  hasArtifact(artifact_id:number):boolean {
    var has = false;
    for(var i in this.inventory) {
      if (this.inventory[i].id == artifact_id) {
        has = true;
      }
    }
    return has;
  }

  /**
   * Finds an item in a monster's inventory by name
   * @param string artifact_name
   * @returns Artifact
   */
  findInInventory(artifact_name) {
    for (var i in this.inventory) {
      if (artifact_name.toLowerCase() == this.inventory[i].name.toLowerCase()) {
        return this.inventory[i];
      }
    }
    return null;
  }

  /**
   * Readies a weapon
   */
  ready(weapon:Artifact) {
    this.weapon = weapon;
    this.weapon_id = weapon.id;
    this.weapon_dice = weapon.dice;
    this.weapon_sides = weapon.sides;
  }

  /**
   * Readies the best weapon the monster is carrying
   */
  readyBestWeapon() {
    for (var a in this.inventory) {
      if (this.inventory[a].is_weapon) {
        if (this.weapon === undefined ||
            this.inventory[a].maxDamage() > this.weapon.maxDamage()) {
          this.ready(this.inventory[a]);
        }
      }
    }
  }

  /**
   * Wears an armor, shield, or article of clothing
   */
  wear(artifact:Artifact) {
    artifact.is_worn = true;
    // need to update inventory to set the monster's armor value
    this.updateInventory();
  }

  /**
   * Wears an armor, shield, or article of clothing
   */
  remove(artifact:Artifact) {
    artifact.is_worn = false;
    // need to update inventory to set the monster's armor value
    this.updateInventory();
  }

  /**
   * Determines if the player is wearing armor
   */
  public isWearingArmor():boolean {
    for (var i in this.inventory) {
      if (this.inventory[i].is_armor && this.inventory[i].is_worn) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if the player is using a shield
   */
  public isUsingShield():boolean {
    for (var i in this.inventory) {
      if (this.inventory[i].is_shield && this.inventory[i].is_worn) {
        return true;
      }
    }
    return false;
  }

  /**
   * Battle actions the monster can do (attack, flee, pick up weapon)
   */
  doBattleActions() {
    var game = Game.getInstance();

    // if the monster managed to die or somehow disappear before its turn, do nothing
    if (this.status == Monster.STATUS_DEAD || this.room_id != game.rooms.current_room.id) return;

    // check if the monster should flee
    var fear = 40 * this.damage / this.hardiness + game.diceRoll(1,41) - 21;
    if (fear > this.courage) {
      var room_to = this.chooseRandomExit();
      if (room_to) {
        game.history.write(this.name + " flees out an exit");
        this.moveToRoom(room_to.id);
        return;
      }
      // if there are no valid exits, the monster has to stay and fight.
    }

    // pick up weapon
    if (this.reaction != Monster.RX_NEUTRAL && this.weapon_id == null) {
      for (var i in game.artifacts.visible) {
        if (game.artifacts.visible[i].is_weapon) {
          game.history.write(this.name + " picks up " + game.artifacts.visible[i].name + ".");
          this.pickUp(game.artifacts.visible[i]);
          this.ready(game.artifacts.visible[i]);
          return;
        }
      }
    }

    // attack!
    if (this.weapon_id != null) {
      var target = this.chooseTarget();
      if (target) {
        this.attack(target);
      }
    }
  }

  /**
   * Attacks another monster
   * @param Monster target
   */
  attack(target:Monster) {
    var game = Game.getInstance();
    game.history.write(this.name + " attacks " + target.name);

    var wpn = Game.getInstance().artifacts.get(this.weapon_id);
    var odds = this.getBaseToHit();
    if (target.defense_bonus) odds -= target.defense_bonus;

    var hit_roll = game.diceRoll(1, 100);

    if (hit_roll <= odds || hit_roll <= 5) {
      // hit
      var damage = game.diceRoll(this.weapon_dice, this.weapon_sides);
      var multiplier = 1;
      var ignore_armor = false;
      // regular or critical hit
      if (hit_roll <= 5) {
        game.history.write('--a critical hit!', 'success');
        // roll another die to determine the effect of the critical hit
        var critical_roll = game.diceRoll(1,100);
        if (critical_roll <= 50) {
          ignore_armor = true
        } else if (critical_roll <= 85) {
          multiplier = 1.5;		// half again damage
        } else if (critical_roll <= 95) {
          multiplier = 2;		// double damage
        } else if (critical_roll <= 99) {
          multiplier = 3;		// triple damage
        } else {
          multiplier = 1000;	// instant kill
        }
      } else {
        game.history.write('--a hit!', 'success');
      }
      // deal the damage
      target.injure(Math.floor(damage * multiplier), ignore_armor);

      // check for weapon ability increase
      if (this.id == Monster.PLAYER) {
        var inc_roll = game.diceRoll(1, 100);
        if (inc_roll > odds) {
          if (this.weapon_abilities[wpn.weapon_type] < 50) {
            this.weapon_abilities[wpn.weapon_type] += 2;
          } else {
            // new feature (not in original) - slower ability increase above 50%
            this.weapon_abilities[wpn.weapon_type] += 1;
          }
          game.history.write("Your " + wpn.getWeaponTypeName() + " ability increased!", "success");
        }
        // check for armor expertise increase
        var af = this.getArmorFactor();
        if (af > 0) {
          var inc_roll = game.diceRoll(1, 100);
          // always a 5% chance to increase. this was not present in the original.
          if (Math.max(af, 5) < inc_roll) {
            this.armor_expertise += Math.min(af, 2); // can sometimes increase by only 1
            game.history.write('Your armor expertise increased!', 'success');
          }
        }
      }

    } else {

      // miss or fumble
      if (hit_roll < 97) {
        game.history.write('--a miss!');
      } else {
        game.history.write('--a fumble!', 'warning');
        // see whether the player recovers, drops, or breaks their weapon
        var fumble_roll = game.diceRoll(1,100);
        if (fumble_roll <= 35 || (this.weapon_id == 0 && fumble_roll <= 75)) {

          game.history.write('--fumble recovered!');

        } else if (fumble_roll <= 75) {

          game.history.write('--weapon dropped!', 'warning');
          this.drop(wpn);

        } else if (fumble_roll <= 95) {

          game.history.write('--weapon broken!', 'danger');
          this.weapon_id = null;
          wpn.monster_id = null;
          this.courage /= 2;
          // broken weapon can hurt user
          if (fumble_roll > 95) {
            game.history.write('--broken weapon hurts user!', 'danger');
            var dice = wpn.dice;
            if (fumble_roll == 100) dice++;  // worst case - extra damage
            this.injure(game.diceRoll(dice, wpn.sides));
          }

        }

      }

    }

  }

  /**
   * Gets the base "to hit" percentage for a monster
   */
  getBaseToHit(): number {
    var wpn = Game.getInstance().artifacts.get(this.weapon_id);
    var to_hit:number;
    if (this.id == Monster.PLAYER) {
      // for player, calculate chance to hit based on weapon type, ability, and weapon odds
      var to_hit = this.weapon_abilities[wpn.weapon_type] + wpn.weapon_odds + 2 * this.agility * this.speed_multiplier;
      // calculate the effect of the armor penalty
      to_hit -= this.getArmorFactor();
    } else {
      // other monsters have the same weapon ability for all weapon types
      var to_hit = this.attack_odds + 2 * this.agility;
      if (this.weapon_id != 0) {
        to_hit += wpn.weapon_odds;
      }
    }
    return to_hit;
  }

  /**
   * Gets the armor penalty for the armor items the player is wearing, adjusted
   * by the player's armor expertise
   * @returns number
   */
  getArmorFactor(): number {
    var ae_max = 0;
    for (var i in this.inventory) {
      if (this.inventory[i].is_worn) {
        ae_max += this.inventory[i].armor_penalty;
      }
    }
    ae_max -= this.armor_expertise;
    if (ae_max < 0) ae_max = 0;
    return ae_max;
  }

  /**
   * Finds someone for the monster to attack
   * @returns Monster
   */
  chooseTarget() {
    var game = Game.getInstance();
    var monsters = [game.monsters.player].concat(game.monsters.visible);
    var targets:Monster[] = [];
    for (var i in monsters) {
      if (this.reaction == Monster.RX_FRIEND && monsters[i].reaction == Monster.RX_HOSTILE) {
        targets.push(monsters[i]);
      } else if (this.reaction == Monster.RX_HOSTILE && monsters[i].reaction == Monster.RX_FRIEND) {
        targets.push(monsters[i]);
      }
    }
    if (targets.length) {
      return targets[Math.floor(Math.random() * targets.length)];
    }
    return null;
  }

  /**
   * Deals damage to a monster
   * @param number amount The amount of damage to do.
   * @param boolean ignore_armor Whether to ignore the effect of armor
   * @returns number The amount of actual damage done
   */
  injure(damage:number, ignore_armor:boolean = false) {
    var game = Game.getInstance();
    if (this.armor_strength && !ignore_armor) {
      damage -= this.armor_strength;
      if (damage <= 0) {
        game.history.write('--blow bounces off armor!');
        return 0; // no need to show health here.
      }
    }
    this.damage += damage;
    this.showHealth();

    // handle death
    if (this.damage >= this.hardiness) {
      if (this.weapon_id > 0) {
        var wpn = game.artifacts.get(this.weapon_id);
        wpn.room_id = this.room_id;
      }

      if (this.dead_body_id) {
        game.artifacts.get(this.dead_body_id).room_id = this.room_id;
      }
      this.status = Monster.STATUS_DEAD;
      this.room_id = null;

    }
    return damage;
  }

  /**
   * Heals a monster
   * @param number The amount of hit points to heal
   */
  heal(amount) {
    this.damage -= amount;
    if (this.damage < 0) {
      this.damage = 0;
    }
    this.showHealth();
  }

  /**
   * Shows monster health status
   */
  showHealth() {
    var game = Game.getInstance();
    var status = (this.hardiness - this.damage) / this.hardiness;
    if (status > .99) {
      game.history.write(this.name + " is in perfect health.")
    } else if (status > .8) {
      game.history.write(this.name + " is in good shape.")
    } else if (status > .6) {
      game.history.write(this.name + " is hurting.")
    } else if (status > .4) {
      game.history.write(this.name + " is in pain.")
    } else if (status > .2) {
      game.history.write(this.name + " is badly injured.", "warning")
    } else if (status > 0) {
      game.history.write(this.name + " is at death's door.", "warning")
    } else {
      game.history.write(this.name + " is dead!", "danger")
    }
  }

  /**
   * When player casts a spell, this method determines if it was successful
   * @param string spell_name
   * @returns boolean
   */
  spellCast(spell_name:string) {
    var game = Game.getInstance();

    if (!game.monsters.player.spell_abilities[spell_name]) {
      game.history.write("You don't know that spell!")
      return;
    }

    // temporarily decrease spell ability
    this.spell_abilities[spell_name] = Math.round(this.spell_abilities[spell_name] / 2);

    // roll to see if the spell succeeded
    var roll = game.diceRoll(1, 100);
    if (roll == 100) {

      game.history.write("The strain of attempting to cast POWER overloads your brain and you forget it completely for the rest of this adventure.")
      game.monsters.player.spell_abilities.power = 0;

    // always a 5% chance to work and a 5% chance to fail
    } else if (roll <= game.monsters.player.spell_abilities.power || roll <= 5 && roll <= 95) {
      // success!

      // check for ability increase
      var inc_roll = game.diceRoll(1, 100);
      if (inc_roll > this.spell_abilities_original[spell_name]) {
        this.spell_abilities_original[spell_name] += 2;
        game.history.write('Spell ability increased!', 'success');
      }

      return true;
    } else {
      game.history.write("Nothing happens.")
    }
  }

  /**
   * Recharges the player's spell abilities. Called on game tick.
   */
  rechargeSpellAbilities() {
    for (var spell_name in this.spell_abilities) {
      if (this.spell_abilities[spell_name] < this.spell_abilities_original[spell_name]) {
        this.spell_abilities[spell_name]++;
      }
    }
  }
}
