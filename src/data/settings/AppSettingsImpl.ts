import { MenuBarRestriction, StoragePath, AppSettings } from "../../domain/settings";
import * as path from "path";
import { app } from "electron";
import fs = require('fs-extra');
import { Observable } from "../../Observable";
import { EventEmitter } from "events";

const FILE_PATH = path.join(app.getPath('userData'), 'settings.json')

const DEFAULT_SETTINGS_JSON: SettingsJson = {
    storagePath: {
        absolutePath: path.join(app.getPath('userData')),
        pendingAbsolutePath: null,
    },
    menuBarRestriction: {
        restricted: false,
        maxCharacters: 10
    },
    isDockIconVisible: false
}

const EVENT_ON_MENU_BAR_RESTRICTION_CHANGED = 'onMenuBarRestrictionChanged'
const EVENT_ON_DOCK_ICON_VISIBILITY_CHANGED = 'onDockIconVisibilityChanged'

interface SettingsJson {
    storagePath: StoragePath
    menuBarRestriction: MenuBarRestriction
    isDockIconVisible: boolean
}

export class AppSettingsImpl implements AppSettings {

    private emitter = new EventEmitter()
    private settingsFilePath: string
    // The file paths to be copied to new storage path.
    private dbFilePaths: string[]

    constructor(settingsFilePath?: string, dbFilePaths?: string[]) {
        this.settingsFilePath = settingsFilePath || FILE_PATH
        this.dbFilePaths = dbFilePaths || []
    }

    getStoragePathSync(): StoragePath {
        return this.getSettingsSync().storagePath
    }

    async setStoragePath(absolutePath: string, needMigration: boolean): Promise<void> {
        const settings = await this.loadJsonOrThrow().catch(() => DEFAULT_SETTINGS_JSON)
        const pending: StoragePath = {
            absolutePath: settings.storagePath.absolutePath,
            pendingAbsolutePath: absolutePath,
        }
        await this.saveJson({ ...settings, storagePath: pending })
        // TODO: Implements migration.
        // If the new absolute path already has db files,
        // it probably should confirm to the user to overwrite those files or not.
        const completed: StoragePath = {
            absolutePath,
            pendingAbsolutePath: null,
        }
        await this.saveJson({ ...settings, storagePath: completed })
    }

    async getMenuBarRestriction(): Promise<MenuBarRestriction> {
        const settings = await this.loadJsonOrThrow().catch(() => DEFAULT_SETTINGS_JSON)
        return settings.menuBarRestriction
    }

    observeMenuBarRestriction(): Observable<MenuBarRestriction> {
        return new MenuBarRestrictionObservable(this.emitter, this.getMenuBarRestriction())
    }

    async setMenuBarRestriction(restriction: MenuBarRestriction): Promise<void> {
        const settings = await this.loadJsonOrThrow().catch(() => DEFAULT_SETTINGS_JSON)
        await this.saveJson({ ...settings, menuBarRestriction: restriction })
        this.emitMenuBarRestrictionChanged(restriction)
    }

    async isDockIconVisible(): Promise<boolean> {
        const settings = await this.loadJsonOrThrow().catch(() => DEFAULT_SETTINGS_JSON)
        return settings.isDockIconVisible
    }

    observeDockIconVisibility(): Observable<boolean> {
        return new DockIconVisibilityObservable(this.emitter, this.isDockIconVisible())
    }

    async setDockIconVisibility(visible: boolean): Promise<void> {
        const settings = await this.loadJsonOrThrow().catch(() => DEFAULT_SETTINGS_JSON)
        await this.saveJson({ ...settings, isDockIconVisible: visible })
        this.emitDockIconVisibilityChanged(visible)
    }

    private async loadJsonOrThrow(): Promise<SettingsJson> {
        return convertToSettings(await fs.readJson(this.settingsFilePath))
    }

    private async saveJson(settings: SettingsJson): Promise<void> {
        return fs.writeFile(this.settingsFilePath, JSON.stringify(settings))
    }

    private emitMenuBarRestrictionChanged(restriction: MenuBarRestriction) {
        this.emitter.emit(EVENT_ON_MENU_BAR_RESTRICTION_CHANGED, restriction)
    }

    private emitDockIconVisibilityChanged(visible: boolean) {
        this.emitter.emit(EVENT_ON_DOCK_ICON_VISIBILITY_CHANGED, visible)
    }

    private getSettingsSync(): SettingsJson {
        try {
            return convertToSettings(fs.readJsonSync(FILE_PATH))
        } catch {
            return { ...DEFAULT_SETTINGS_JSON }
        }
    }
}

function convertToSettings(json: any): SettingsJson {
    console.log(`load: ${JSON.stringify(json)}`)
    if (!json.storagePath)
        throw new Error("The key `storagePath` is missing.")
    if (json.storagePath.absolutePath === undefined || json.storagePath.absolutePath === null)
        throw new Error("The key `storagePath.absolutePath` is migging.")
    if (json.storagePath.pendingAbsolutePath === undefined)
        throw new Error("The key `storagePath.pendingAbsolutePath` is missing.")
    if (!json.menuBarRestriction)
        throw new Error("The key `menuBarRestriction` is missing.")
    if (json.menuBarRestriction.restricted === undefined)
        throw new Error("The key `menuBarRestriction.restricted` is missing.")
    if (json.menuBarRestriction.maxCharacters === undefined)
        throw new Error("The key `menuBarRestriction.maxCharacters` is missing.")
    if (json.isDockIconVisible === undefined)
        throw new Error("The key `isDockIconVisible` is missing.")
    return {
        storagePath: {
            absolutePath: json.storagePath.absolutePath,
            pendingAbsolutePath: json.storagePath.pendingAbsolutePath
        },
        menuBarRestriction: {
            restricted: json.menuBarRestriction.restricted,
            maxCharacters: json.menuBarRestriction.maxCharacters
        },
        isDockIconVisible: json.isDockIconVisible
    }
}

class MenuBarRestrictionObservable extends Observable<MenuBarRestriction> {

    protected subscribe(source: EventEmitter, listener: (payload: MenuBarRestriction) => void): void {
        source.on(EVENT_ON_MENU_BAR_RESTRICTION_CHANGED, listener)
    }

    protected unsubscribe(source: EventEmitter, listener: (payload: MenuBarRestriction) => void): void {
        source.off(EVENT_ON_MENU_BAR_RESTRICTION_CHANGED, listener)
    }
}

class DockIconVisibilityObservable extends Observable<boolean> {

    protected subscribe(source: EventEmitter, listener: (payload: boolean) => void): void {
        source.on(EVENT_ON_DOCK_ICON_VISIBILITY_CHANGED, listener)
    }

    protected unsubscribe(source: EventEmitter, listener: (payload: boolean) => void): void {
        source.off(EVENT_ON_DOCK_ICON_VISIBILITY_CHANGED, listener)
    }
}
