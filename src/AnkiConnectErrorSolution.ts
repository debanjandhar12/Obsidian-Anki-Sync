export function findAnkiConnectErrorSolution(action, e) : string {
    if(e == "failed to issue request") {
        return "Please ensure Anki with AnkiConnect installed is open in background.\n   See https://github.com/debanjandhar12/Obsidian-Anki-Sync#installation for more information."
    }
    if(e == "Permission to access anki was denied") {
        return "Please ensure AnkiConnect config is correct.\n   See https://github.com/debanjandhar12/Obsidian-Anki-Sync#installation for more information."
    }

    return "Failed to find solution. Create an issue at https://github.com/debanjandhar12/Obsidian-Anki-Sync/issues";
}