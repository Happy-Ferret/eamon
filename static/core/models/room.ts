import {Loadable} from "./loadable";
import {Game} from "./game";

export class RoomExit extends Loadable {

  static EXIT: number = -999;

  public direction: string;
  public room_to: number;
  public door_id: number;
  public open: number;
  public message: string;

  /**
   * Check for locked exits.
   * @returns boolean
   *   True if the exit has no door, or if the door is visible and open.
   *   False if there is a closed door or a hidden embedded door like an undiscovered secret door.
   */
  public isOpen(): boolean {
    if (this.door_id) {
      let door = Game.getInstance().artifacts.get(this.door_id);
      return door.is_open;
    } else {
      // no door
      return true;
    }
  }

}

export class Room extends Loadable {

  public id: number;
  public name: string;
  public description: string;
  public exits: RoomExit[] = [];
  public seen: boolean = false;
  public is_dark: boolean;

  /**
   * Loads data from JSON source into the object properties.
   * Override of parent method to handle RoomExit objects.
   * @param Object source an object, e.g., from JSON.
   */
  public init(source): void {
    for (let prop in source) {
      if (prop === "exits") {
        for (let i in source[prop]) {
          let ex = new RoomExit();
          ex.init(source[prop][i]);
          this.exits.push(ex);
        }
      } else {
        this[prop] = source[prop];
      }
    }
  }

  /**
   * Gets the exit from the room in a given direction
   */
  public getExit(direction: string): RoomExit {
    for (let i in this.exits) {
      if (this.exits[i].direction === direction) {
        return this.exits[i];
      }
    }
    return null;
  }

}
