import React = require('react');
import { Task, compareTask } from '../../../../domain/task';
import { useCases, dialog } from '../../remote';
import { ERROR_TASK_ALREADY_EXISTS } from '../../../../data/task/DbTaskRepository';
import { TaskView } from './TaskView';
import { Subscription } from '../../../../Observable';

interface Props { }

interface State {
  tempTaskName: string,
  tasks: Task[]
}

export class TasksView extends React.Component<Props, State> {

  private tasksSubscription: Subscription

  constructor(props: Props) {
    super(props);
    this.state = {
      tempTaskName: '',
      tasks: [],
    };
  }

  componentDidMount() {
    this.tasksSubscription = useCases.observeTasks((tasks: Task[]) => {
      tasks.sort(compareTask)
      this.setState({ tasks })
    })
  }

  componentWillUnmount() {
    this.tasksSubscription && this.tasksSubscription.unsubscribe()
  }

  handleDeleteTask(target: Task) {
    dialog.showMessageBox({
      message: `Are you sure you want to delete the task \`${target.name}\`?\n\nYou will not be able to undo this action.`,
      buttons: ['Yes, Delete', 'No'],
      cancelId: 1,
    }, response => {
      if (response === 0) {
        useCases.deleteTask(target.id)
      }
    })
  }

  handleEditTask(target: Task) {
    useCases.updateTaskName(target.id, target.name)
  }

  handleAddTask() {
    if (this.state.tempTaskName === '') {
      return
    }
    this.setState({ tempTaskName: '' })
    useCases.createTask(this.state.tempTaskName)
      .catch((err: any) => {
        if (err === ERROR_TASK_ALREADY_EXISTS) {
          dialog.showMessageBox({ message: `The task '${this.state.tempTaskName}' aready exists.` })
        } else {
          dialog.showMessageBox({ message: `Failed to add a task because: ${err}` })
        }
      })
  }

  render() {
    return (
      <div>
        <div className="ui fluid action input">
          <input
            type="text"
            value={this.state.tempTaskName}
            placeholder="Task Name"
            onChange={(element) => { this.setState({ tempTaskName: element.target.value }) }}
            onKeyPress={e => e.key === 'Enter' && this.handleAddTask()}
          />
          <button className="ui blue button" onClick={this.handleAddTask.bind(this)}>Add Task</button>
        </div>
        <div className="ui divided items">
          {
            this.state.tasks.length > 0
              ? this.state.tasks.map((task: Task) => {
                return (
                  <TaskView
                    key={task.id}
                    task={task}
                    onEdit={this.handleEditTask.bind(this)}
                    onDelete={this.handleDeleteTask.bind(this)} />
                )
              })
              : (
                <div className="item">
                  <div className="ui center aligned basic segment">
                    Task list is empty.
                  </div>
                </div>
              )
          }
        </div>
      </div>
    );
  }
}