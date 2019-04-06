# Eamon Remastered - Porting an adventure from Classic Eamon

This file contains instructions for porting an Eamon adventure from the Classic Eamon Apple II disk images. This is an advanced procedure. If an adventure is available in Eamon Deluxe, [it's almost always easier to port it from that system instead](PORTING-EDX-ADVENTURES.md).

Note: The instructions in this file have only been tested on Windows 10 and include references to Windows-only software (e.g., AppleWin, CiderPress). If you are using macOS or Linux, you will need to adjust the file paths and find alternate software.

## What you'll need

* The emulator disk image of your adventure (usually in a format like .DSK)
* A diff tool like WinMerge or Meld
* A program that can read Apple II disk images and copy files from them (e.g., CiderPress)
* A program that can extract the data from the Apple II files into JSON
* Some familiarity with AppleSoft BASIC

## A note about DOS 3.3 vs. ProDOS

This procedure has only been tested with DOS 3.3 adventures and not with ProDOS adventures. Many ProDOS adventures were ported to Eamon Deluxe, so assess if they can be ported from there first.

## Porting the Adventure Data

1. Determine the version of the MAIN PGM your adventure used (usually 4, 5, 6.0, 6.1, 6.2, 7.0, or 7.1)
    1. Adventures using MAIN PGM v4-6 had a file on the original disk named "EAMON.ROOM NAMES"
    1. If not sure, you can find this information on the [EAG Adventure List page](http://www.eamonag.org/lists/list-master.htm)
1. Create a folder on your computer to store all the adventure files.
    1. I name mine something like 'd:\eamon-classic\001-beginners-cave' but feel free to do as you wish
1. Use CiderPress (or other Apple II file export program) to export all the files from the disk image into the folder
1. Run the JSON conversion program (not documented here, yet) to convert the data files to JSON
    1. You should have four files: rooms.json, artifacts.json, effects.json, and monsters.json
    1. If the adventure has no effects, you may omit effects.json. The import program will still work without it.
1. Run the "json" import script
    1. `pipenv shell` (if not already activated)
    1. `python manage.py import_json {folder} {adventure_id}`
    1. e.g., `python manage.py import_json D:\eamon-clasic\213-demongate 213`
    1. If you want to convert the names and descriptions to sentence case, there is an additional `-c` option:
    1. e.g., `python manage.py import_json D:\eamon-clasic\213-demongate 213 -c`
    1. Otherwise, the text will be kept exactly as it is in the JSON files
    
## Inspecting and cleaning up your adventure data

Once the data import has finished, you can open the Django admin or your favorite database GUI tool. Inspect the data for your adventure to see if things look legit. You might need to clean up a few things after the import:

* Depending on the MAIN PGM version, there may need to be tweaks to the import script - if you get errors or things look inaccurate, contact Keith for assistance
* Some editing of descriptions may be necessary (e.g., to correctly capitalize the people or place names, or remove extraneous hyphens)
* Some adventures used custom special codes for artifact locations, weights, and capacities. The import script can't handle all of these. Here are a few clues to locate things that need to be manually fixed:
    * Artifacts with a room_id higher than the number of rooms. Numbers like 499 or 899, etc. were often used to implement custom logic
    * Artifacts with a negative weight - these are often containers that allow the player to carry more stuff. The best practice in this case is to change the weight to something small, like 3, and put the absolute value of the old weight into the "quantity" field on the artifact.
    * Room Exits with negative room numbers (e.g., going north from room #1 goes to room #-2). These are usually secret doors, booby traps, or doors that won't open until the player solves a specific puzzle.
    * MAIN PGM version 4.0 and 5.0 adventures will need some artifact types reassigned. Look for things like doors, potions, food, and dead bodies, and assign them to the correct artifact type. (You can't open a door if its artifact entry is flagged as a "treasure.")

## Reverse-Engineering the MAIN PGM code   

The next step is to examine the adventure's MAIN PGM and find all the custom logic within. This may be easy or difficult, depending on the MAIN PGM version of the original adventure, and how heavily customized it is.

Since viewing and editing the code directly in the emulator is inconvenient, it's helpful to copy the MAIN PGM file to your native OS. On Windows, this can be done using a program called [CiderPress](https://a2ciderpress.com/). (Equivalent programs should be available for other systems like Mac and Linux.) Once you have the file copied to your regular OS, you should be able to open and view it in a text editor.

To find the custom code, it's often useful to find the base MAIN PGM from the Dungeon Designer Disk and compare against that. You will be able to spot the custom code by ignoring the matching lines and focusing on the ones that are different.

For example:

* Export the base MAIN PGM 7.1 from the DDD v7.1
  * In CiderPress, it's helpful to use the "configure for Windows access" setting in the export, to make the BASIC code easier to read 
* Export the MAIN PGM from the disk image for adventure #215, Treasure Island
  * Not to be confused with #13, Caves of Treasure Island
* Compare the two MAIN PGM files in your diff tool
* You should see a few dozen lines that are different, out of a total of ~600 lines in the files
* Some of the differences will be insignificant, e.g., changes in spacing
* Others will be an actual customization, like Apple II line 3210, "you can't climb over the dragon"

If you can't locate the base MAIN PGM for the version of your adventure, you can compare against a different adventure that uses a similar MAIN PGM version.

* For adventure using MAIN PGM 7.x, compare against the MAIN PGM from the "Eamon 7.0 Demo Adventure", which contains no customizations and is very similar to the one on the DDD
* For any adventures using MAIN PGM 4.0 or 5.0, try comparing against the MAIN PGM from an adventure with few customizations, like "Escape from the Orc Lair"
* Do not use the MAIN PGM from "The Beginner's Cave", "Cave of the Mind", or "Dragon of Aldaar" as a basis for comparison. These used a pre-4.0 version of the MAIN PGM and are not really comparable to anything else.
* Many of the adventures using MAIN PGM v6.x are heavily customized and it seems like each copy of MAIN PGM v6.x is very different. It's difficult to find a good comparison between these adventures. These are probably the hardest adventures to port.

Once you have found a similar adventure, scan through the differences and locate as much custom code as you can. You may even spot some things you didn't find while playing through the adventure!

## Getting the intro text

Many adventures have intro text which sets up the plot, explaining the plot, or how the player got to the starting point of the adventure. This text isn't stored in the MAIN PGM. It's usually stored in a different file on the disk image, one with the same name as the adventure. For example, the disk image for "The Temple of Ngurct" (#23) contains a file named "THE TEMPLE OF NGURCT" which has the intro text in it. If you use CiderPress (or equivalent) to export this file from the disk image to your computer, you can then copy and paste the text (though it will be all caps).

Tip: I usually paste the intro text into Microsoft Word and use the "Change Case" feature to convert it to sentence case,
 then I paste the text from Word into the database. 

If exporting the files from the disk image isn't possible, you may be able to open the disk image in your emulator and print the file to a text file from there. Consult your emulator's documentation for how to configure the printer. 

## Creating the adventure in Eamon Remastered

1. Inside the Eamon Remastered project, create the adventure folder with commands.ts and event-handlers.ts as shown in [the adventure design instructions](ADVENTURE-DESIGN.md)
1. Rebuild the adventure code using the new event handler system
