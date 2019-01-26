import { Tray, nativeImage, Menu, dialog, MenuItem } from "electron"
import * as path from "path"
import { Task, ActiveTask } from "../../domain/task"
import { setActiveTask, getActiveTask, addTimeRecord, clearActiveTask, getTasks, getTimeRecords, existsTask } from "../../domain/useCases";
import { TimeRecord } from "../../domain/timeRecord";
import { Day } from "../../domain/day";

let tray: Tray = null

export function createTray() {
    if (tray != null) {
        return
    }
    const icon = nativeImage.createFromPath(path.join(__dirname, "../../../res/starTemplate.png"))
    tray = new Tray(icon)
    tray.setToolTip('This is my application.')
    update()
}

function mapToMenuItem(task: Task): Electron.MenuItemConstructorOptions {
    return {
        label: task.name,
        type: 'checkbox',
    }
}

async function switchTask(task: Task) {
    const oldActiveTask = await getActiveTask()
    if (oldActiveTask !== null && await existsTask(oldActiveTask.task.id)) {
        // No need to `addTimeRecord` if oldActiveTask already deleted,
        // because it makes no sense to record time for that task
        const now = new Date().getTime()
        await addTimeRecord(oldActiveTask.task, oldActiveTask.startTime, now)
        console.log(`Saved TimeRecord of ${oldActiveTask.task.name}`)
    }
    if (oldActiveTask !== null && oldActiveTask.task.id === task.id) {
        await clearActiveTask()
        console.log('Cleared activeTask')
    } else {
        await setActiveTask(task)
        console.log(`Switch task to '${task ? `${task.name} (${task.id})` : 'none'}'`)
    }
    update()
}

export function createMenu(tasks: Array<Task>, activeTask: ActiveTask = null): Menu {
    console.log('createMenu; tasks: ', tasks, ' activeTask: ', activeTask)
    const taskItems: Electron.MenuItemConstructorOptions[] = tasks.map(task => {
        const checked = activeTask !== null && task.id === activeTask.task.id
        return {
            ...mapToMenuItem(task),
            checked,
            click: () => switchTask(task)
        }
    })
    let template: Electron.MenuItemConstructorOptions[] = []
    template.push({
        type: 'normal',
        label: 'Tasks',
        enabled: false
    })
    template.push(...taskItems)
    template = template.concat([
        { type: 'separator' },
        { label: 'Show Records', click: () => { getTimeRecords(Day.today()).then(records => showTimeRecords(records)) } },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
    ])
    return Menu.buildFromTemplate(template)
}

export async function update() {
    if (tray == null) {
        return
    }
    console.log('update!')
    const tasks = await getTasks()
    console.log('update; tasks: ', tasks)
    const activeTask = await getActiveTask()
    console.log('update; activeTask: ', activeTask)
    const menu = createMenu(tasks, activeTask)
    const activeTaskExists = activeTask && await existsTask(activeTask.task.id)
    tray.setTitle(activeTaskExists ? activeTask.task.name : '')
    tray.setToolTip(activeTaskExists ? activeTask.task.name : 'Owl Time Keeper')
    tray.setContextMenu(menu)
}

function showTimeRecords(records: TimeRecord[]) {
    dialog.showMessageBox({ message: records.map(r => `${r.task.name}\t${stringify(r)}`).join('\n') })
}

function stringify(record: TimeRecord): string {
    return millisToString(record.endTime - record.startTime)
}

function millisToString(millis: number): string {
    const seconds = millis / 1000
    const h = Math.floor(seconds / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    var str = ""
    if (h !== 0) str += `${h}h `
    if (m !== 0) str += `${m}m `
    if (s !== 0) str += `${s}s `
    return str
}
