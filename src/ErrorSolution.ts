export function findErrorSolution(e) : string {
    switch(e) {
        case "failed to issue request":
            return "Please ensure Anki with AnkiConnect installed is open in background.\nSee https://github.com/debanjandhar12/Obsidian-Anki-Sync#installation for more information.";
        case "Permission to access anki was denied":
            return "Please give permission to access anki by clicking Yes when promted or ensuring AnkiConnect config is correct. Otherwise see https://github.com/debanjandhar12/Obsidian-Anki-Sync#installation for more information.";
        case "collection is not available":
            return "Please select an Anki Profile.";
        default:
            return "Failed to find solution. Please create an issue at plugin's github reprository.";
    }
}