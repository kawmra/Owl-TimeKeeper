import { TimeRecordRepository, TimeRecord } from "../../domain/timeRecord";
import { Day } from "../../domain/day";
import Nedb = require("nedb");
import * as path from "path"
import { app } from "electron";

export class DbTimeRecordRepository implements TimeRecordRepository {

    private db = new Nedb({
        filename: path.join(app.getPath('userData'), 'timeRecords.db'),
        autoload: true
    })

    addTimeRecord(timeRecord: TimeRecord): Promise<void> {
        this.db.insert(timeRecord)
        return Promise.resolve()
    }

    update(timeRecord: TimeRecord): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.update({ id: timeRecord.id }, timeRecord, {}, err => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }

    updateTaskName(taskId: string, newName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.update({ "task.id": taskId }, { $set: { "task.name": newName } }, { multi: true }, err => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }

    select(day: Day): Promise<TimeRecord[]> {
        return new Promise((resolve, reject) => {
            const dayStart = day.toMillis()
            const dayEnd = dayStart + 86400000 // 24 hours later
            this.db.find({ $and: [{ startTime: { $gte: dayStart } }, { startTime: { $lt: dayEnd } }] }).exec((err, docs: TimeRecord[]) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(docs)
            })
        })
    }

    selectAll(): Promise<TimeRecord[]> {
        return new Promise((resolve, reject) => {
            this.db.find({}).exec((err, docs: TimeRecord[]) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(docs)
            })
        })
    }

    delete(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.remove({ id }, err => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }
}
