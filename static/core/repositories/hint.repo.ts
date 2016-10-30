import {Hint} from "../models/hint";
import {Game} from "../models/game";

/**
 * Class HintRepository.
 * Storage class for all hint data.
 */
export class HintRepository {

  /**
   * An array of all the Hint objects
   */
  all: Hint[] = [];

  /**
   * The highest ID in the system
   */
  index: number = 0;

  constructor(hint_data: Array<Object>) {
    for (let i in hint_data) {
      this.add(hint_data[i]);
    }
  }

  /**
   * Adds a hint.
   * @param {Object} hint_data
   */
  public add(hint_data) {
    let h = new Hint();

    h.init(hint_data);

    // autonumber the ID if not provided
    if (h.id === undefined) {
      h.id = this.index + 1;
    }

    if (this.get(h.id) !== null) {
      console.log(this.get(h.id));
      throw new Error("Tried to create a monster #" + h.id + " but that ID is already taken.");
    }

    this.all.push(h);

    // update the autonumber index
    if (h.id > this.index) {
      this.index = h.id;
    }
    return h;
  }

  /**
   * Gets a hint by index.
   * @param {number} index
   * @return Monster
   */
  public get(index) {
    for (let i in this.all) {
      if (this.all[i].index === index) {
        return this.all[i];
      }
    }
    return null;
  }

}
