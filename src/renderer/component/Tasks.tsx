import React = require('react');
import { Task } from '../../task';
import { TaskItem } from './Task';
import { useCases, tray } from '../remote';

interface Props { }

interface State {
  tempTaskName: string,
  tasks: Task[]
}

export class Tasks extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      tempTaskName: '',
      tasks: [],
    };
  }

  componentDidMount() {
    this.refreshTasks()
  }

  refreshTasks() {
    useCases.getTasks().then((tasks: Task[]) => {
      this.setState({ tasks })
    })
  }

  handleAddTask(element: HTMLElement) {
    this.setState({ tempTaskName: '' })
    useCases.createTask(this.state.tempTaskName)
    tray.updateMenu()
    this.refreshTasks()
  }

  render() {
    return (
      <div>
        <label>Task Name: <input type="text" value={this.state.tempTaskName} onChange={(element) => { this.setState({ tempTaskName: element.target.value }) }} /></label>
        <button onClick={this.handleAddTask.bind(this)}>Add Task</button>
        <ul>
          {
            this.state.tasks.map((task: Task) => {
              return (
                <TaskItem key={task.name} task={task} />
              )
            })
          }
        </ul>
      </div>
    );
  }
}