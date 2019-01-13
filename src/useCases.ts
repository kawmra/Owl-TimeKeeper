import { Task, ActiveTask, DbTaskRepository, DbActiveTaskRepository } from "./task";
import { TimeRecord, DbTimeRecordRepository } from "./timeRecord";
import { currentDay } from "./day";

const taskRepository = new DbTaskRepository()
const activeTaskRepository = new DbActiveTaskRepository()
const timeRecordRepository = new DbTimeRecordRepository()

export async function createTask(name: string): Promise<Task> {
    const task = { name }
    await taskRepository.add(task)
    return task
}

export async function deleteTask(task: Task): Promise<void> {
    await taskRepository.remove(task)
}

export async function getTasks(): Promise<Task[]> {
    return taskRepository.selectAll()
}

export async function existsTask(taskName: string): Promise<boolean> {
    return taskRepository.exists(taskName)
}

export async function setActiveTask(task: Task): Promise<ActiveTask> {
    return activeTaskRepository.setActiveTask(task)
}

export async function getActiveTask(): Promise<ActiveTask | null> {
    const activeTask = await activeTaskRepository.getActiveTask()
    if (activeTask != null && await existsTask(activeTask.task.name)) {
        return activeTask
    }
    // return null if task of activeTask didn't exist
    return null
}

export async function clearActiveTask(): Promise<void> {
    return activeTaskRepository.clearActiveTask()
}

export async function addTimeRecord(task: Task, startTime: number, endTime: number): Promise<TimeRecord> {
    const timeRecord = { taskName: task.name, startTime, endTime }
    await timeRecordRepository.addTimeRecord(timeRecord)
    return timeRecord
}

export async function getTimeRecords(): Promise<TimeRecord[]> {
    return timeRecordRepository.select(currentDay())
}