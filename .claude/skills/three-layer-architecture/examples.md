# Three-Layer Architecture - Examples

## Example 1: Complete Task Domain

This example shows a complete task domain with all three layers.

### Domain Layer (src/lib/task/)

**structures.ts**

```typescript
// Value Objects
export class TaskId {
  private constructor(readonly value: string) {}

  static create(): TaskId {
    return new TaskId(crypto.randomUUID());
  }

  static fromString(value: string): TaskId {
    if (!value) throw new Error('TaskId cannot be empty');
    return new TaskId(value);
  }
}

export class TaskName {
  private constructor(readonly value: string) {}

  static create(value: string): TaskName {
    const trimmed = value?.trim();
    if (!trimmed) throw new Error('TaskName cannot be empty');
    if (trimmed.length > 255) throw new Error('TaskName too long');
    return new TaskName(trimmed);
  }
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export const PriorityUtil = {
  fromString(value: string): Priority {
    const map: Record<string, Priority> = {
      low: Priority.LOW,
      medium: Priority.MEDIUM,
      high: Priority.HIGH,
    };
    return map[value] ?? Priority.MEDIUM;
  },

  toNumber(priority: Priority): number {
    return { low: 1, medium: 2, high: 3 }[priority];
  },

  fromNumber(value: number): Priority {
    return [Priority.LOW, Priority.MEDIUM, Priority.HIGH][value - 1] ?? Priority.MEDIUM;
  },
};

// Entity
export interface Task {
  id: TaskId;
  name: TaskName;
  priority: Priority;
  createdAt: Date;
}

// Input types (what service methods accept)
export interface CreateTaskInput {
  name: TaskName;
  priority: Priority;
}
```

**interfaces.ts**

```typescript
import type { Task, TaskId, CreateTaskInput } from './structures';

export interface ITaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}

export interface ITaskService {
  create(input: CreateTaskInput): Promise<Task>;
  getById(id: TaskId): Promise<Task>;
  list(): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}
```

**service.ts**

```typescript
import type { ITaskRepository, ITaskService } from './interfaces';
import type { Task, TaskId, CreateTaskInput } from './structures';
import { TaskId as TaskIdClass } from './structures';

export class TaskNotFoundError extends Error {
  constructor(id: TaskId) {
    super(`Task not found: ${id.value}`);
    this.name = 'TaskNotFoundError';
  }
}

export class TaskService implements ITaskService {
  constructor(private repo: ITaskRepository) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: TaskIdClass.create(),
      name: input.name,
      priority: input.priority,
      createdAt: new Date(),
    };
    await this.repo.save(task);
    return task;
  }

  async getById(id: TaskId): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }
    return task;
  }

  async list(): Promise<Task[]> {
    return this.repo.findAll();
  }

  async delete(id: TaskId): Promise<void> {
    const task = await this.repo.findById(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }
    await this.repo.delete(id);
  }
}
```

### Mappers (src/lib/task/mappers/)

**controller.mapper.ts**

```typescript
import type { Task, CreateTaskInput } from '../structures';
import { TaskName, Priority, PriorityUtil } from '../structures';

// Controller DTOs
export interface CreateTaskDto {
  name: string;
  priority?: string;
}

export interface TaskResponseDto {
  id: string;
  name: string;
  priority: string;
  createdAt: string;
}

export class TaskControllerMapper {
  toDomainInput(dto: CreateTaskDto): CreateTaskInput {
    return {
      name: TaskName.create(dto.name),
      priority: dto.priority ? PriorityUtil.fromString(dto.priority) : Priority.MEDIUM,
    };
  }

  toDto(task: Task): TaskResponseDto {
    return {
      id: task.id.value,
      name: task.name.value,
      priority: task.priority,
      createdAt: task.createdAt.toISOString(),
    };
  }

  toDtoList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map(t => this.toDto(t));
  }
}
```

**repo.mapper.ts**

```typescript
import type { Task } from '../structures';
import { TaskId, TaskName, PriorityUtil } from '../structures';

// Data Model (for file persistence)
export interface TaskRecord {
  id: string;
  name: string;
  priority: number;
  created_at: number;
}

export class TaskRepoMapper {
  toData(task: Task): TaskRecord {
    return {
      id: task.id.value,
      name: task.name.value,
      priority: PriorityUtil.toNumber(task.priority),
      created_at: task.createdAt.getTime(),
    };
  }

  toDomain(record: TaskRecord): Task {
    return {
      id: TaskId.fromString(record.id),
      name: TaskName.create(record.name),
      priority: PriorityUtil.fromNumber(record.priority),
      createdAt: new Date(record.created_at),
    };
  }

  toDomainList(records: TaskRecord[]): Task[] {
    return records.map(r => this.toDomain(r));
  }
}
```

### Controller Layer (src/adapters/controllers/)

**cli/task.cli.ts**

```typescript
import type { ITaskService } from '../../../lib/task/interfaces';
import type { TaskId } from '../../../lib/task/structures';
import { TaskId as TaskIdClass } from '../../../lib/task/structures';
import { TaskControllerMapper, CreateTaskDto, TaskResponseDto } from '../../../lib/task/mappers/controller.mapper';
import { TaskNotFoundError } from '../../../lib/task/service';

export interface IOutputAdapter {
  text(message: string): void;
  json(data: unknown): void;
  error(message: string): void;
}

export interface CliCreateArgs {
  name: string;
  priority?: string;
  '--json'?: boolean;
}

export interface CliGetArgs {
  id: string;
  '--json'?: boolean;
}

export class TaskCliController {
  constructor(
    private service: ITaskService,
    private mapper: TaskControllerMapper,
    private output: IOutputAdapter,
  ) {}

  async create(args: CliCreateArgs): Promise<number> {
    try {
      const dto: CreateTaskDto = {
        name: args.name,
        priority: args.priority,
      };
      const input = this.mapper.toDomainInput(dto);
      const task = await this.service.create(input);
      const response = this.mapper.toDto(task);

      if (args['--json']) {
        this.output.json(response);
      } else {
        this.output.text(`Created task: ${response.id}`);
      }
      return 0;
    } catch (error) {
      this.output.error((error as Error).message);
      return 1;
    }
  }

  async get(args: CliGetArgs): Promise<number> {
    try {
      const id = TaskIdClass.fromString(args.id);
      const task = await this.service.getById(id);
      const response = this.mapper.toDto(task);

      if (args['--json']) {
        this.output.json(response);
      } else {
        this.output.text(`${response.name} (${response.priority})`);
      }
      return 0;
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        this.output.error(`Task not found: ${args.id}`);
        return 2;
      }
      this.output.error((error as Error).message);
      return 1;
    }
  }

  async list(args: { '--json'?: boolean }): Promise<number> {
    const tasks = await this.service.list();
    const response = this.mapper.toDtoList(tasks);

    if (args['--json']) {
      this.output.json(response);
    } else {
      response.forEach(t => this.output.text(`${t.id}: ${t.name}`));
    }
    return 0;
  }
}
```

**socket/task.socket.ts**

```typescript
import type { ITaskService } from '../../../lib/task/interfaces';
import { TaskId } from '../../../lib/task/structures';
import { TaskControllerMapper, CreateTaskDto } from '../../../lib/task/mappers/controller.mapper';
import { TaskNotFoundError } from '../../../lib/task/service';

export interface SocketMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

export interface SocketResponse {
  type: string;
  payload?: unknown;
  error?: string;
  requestId?: string;
}

export class TaskSocketController {
  constructor(
    private service: ITaskService,
    private mapper: TaskControllerMapper,
  ) {}

  async handle(message: SocketMessage): Promise<SocketResponse> {
    const { requestId } = message;

    try {
      switch (message.type) {
        case 'task.create': {
          const dto = message.payload as CreateTaskDto;
          const input = this.mapper.toDomainInput(dto);
          const task = await this.service.create(input);
          return {
            type: 'task.created',
            payload: this.mapper.toDto(task),
            requestId,
          };
        }

        case 'task.get': {
          const { id } = message.payload as { id: string };
          const task = await this.service.getById(TaskId.fromString(id));
          return {
            type: 'task.result',
            payload: this.mapper.toDto(task),
            requestId,
          };
        }

        case 'task.list': {
          const tasks = await this.service.list();
          return {
            type: 'task.list.result',
            payload: this.mapper.toDtoList(tasks),
            requestId,
          };
        }

        case 'task.delete': {
          const { id } = message.payload as { id: string };
          await this.service.delete(TaskId.fromString(id));
          return {
            type: 'task.deleted',
            payload: { id },
            requestId,
          };
        }

        default:
          return {
            type: 'error',
            error: `Unknown message type: ${message.type}`,
            requestId,
          };
      }
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        return {
          type: 'error',
          error: error.message,
          requestId,
        };
      }
      return {
        type: 'error',
        error: (error as Error).message,
        requestId,
      };
    }
  }
}
```

### Repository Layer (src/adapters/repos/)

**file/task.file-repo.ts**

```typescript
import type { ITaskRepository } from '../../../lib/task/interfaces';
import type { Task, TaskId } from '../../../lib/task/structures';
import { TaskRepoMapper, TaskRecord } from '../../../lib/task/mappers/repo.mapper';

export interface IFilesystemAdapter {
  exists(path: string): Promise<boolean>;
  readJson<T>(path: string): Promise<T>;
  writeJson(path: string, data: unknown): Promise<void>;
}

export class TaskFileRepo implements ITaskRepository {
  constructor(
    private fs: IFilesystemAdapter,
    private mapper: TaskRepoMapper,
    private filePath: string,
  ) {}

  async save(task: Task): Promise<void> {
    const records = await this.loadRecords();
    records[task.id.value] = this.mapper.toData(task);
    await this.fs.writeJson(this.filePath, records);
  }

  async findById(id: TaskId): Promise<Task | null> {
    const records = await this.loadRecords();
    const record = records[id.value];
    return record ? this.mapper.toDomain(record) : null;
  }

  async findAll(): Promise<Task[]> {
    const records = await this.loadRecords();
    return this.mapper.toDomainList(Object.values(records));
  }

  async delete(id: TaskId): Promise<void> {
    const records = await this.loadRecords();
    delete records[id.value];
    await this.fs.writeJson(this.filePath, records);
  }

  private async loadRecords(): Promise<Record<string, TaskRecord>> {
    if (!(await this.fs.exists(this.filePath))) {
      return {};
    }
    return this.fs.readJson(this.filePath);
  }
}
```

**memory/task.memory-repo.ts**

```typescript
import type { ITaskRepository } from '../../../lib/task/interfaces';
import type { Task, TaskId } from '../../../lib/task/structures';

export class TaskMemoryRepo implements ITaskRepository {
  private tasks = new Map<string, Task>();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id.value, task);
  }

  async findById(id: TaskId): Promise<Task | null> {
    return this.tasks.get(id.value) ?? null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async delete(id: TaskId): Promise<void> {
    this.tasks.delete(id.value);
  }

  // Test helper
  clear(): void {
    this.tasks.clear();
  }
}
```

### Entry Point (src/cli.ts)

```typescript
import { program } from 'commander';
import { FilesystemAdapter } from './adapters/filesystem.adapter';
import { ConsoleAdapter } from './adapters/console.adapter';
import { TaskService } from './lib/task/service';
import { TaskControllerMapper } from './lib/task/mappers/controller.mapper';
import { TaskRepoMapper } from './lib/task/mappers/repo.mapper';
import { TaskFileRepo } from './adapters/repos/file/task.file-repo';
import { TaskCliController } from './adapters/controllers/cli/task.cli';
import { TaskSocketController } from './adapters/controllers/socket/task.socket';

async function main() {
  // 1. Adapters (IO)
  const fs = new FilesystemAdapter();
  const console = new ConsoleAdapter();

  // 2. Mappers
  const taskControllerMapper = new TaskControllerMapper();
  const taskRepoMapper = new TaskRepoMapper();

  // 3. Repository
  const taskRepo = new TaskFileRepo(fs, taskRepoMapper, '.kagent/tasks.json');

  // 4. Service (Domain)
  const taskService = new TaskService(taskRepo);

  // 5. Controllers
  const taskCliController = new TaskCliController(taskService, taskControllerMapper, console);
  const taskSocketController = new TaskSocketController(taskService, taskControllerMapper);

  // 6. CLI commands
  program
    .command('task:create <name>')
    .option('-p, --priority <priority>', 'Priority (low, medium, high)')
    .option('--json', 'Output as JSON')
    .action(async (name, options) => {
      const code = await taskCliController.create({
        name,
        priority: options.priority,
        '--json': options.json,
      });
      process.exit(code);
    });

  program
    .command('task:get <id>')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const code = await taskCliController.get({
        id,
        '--json': options.json,
      });
      process.exit(code);
    });

  program
    .command('task:list')
    .option('--json', 'Output as JSON')
    .action(async options => {
      const code = await taskCliController.list({ '--json': options.json });
      process.exit(code);
    });

  await program.parseAsync();
}

main();
```

## Example 2: Testing with Three Layers

### Service Test (Domain)

```typescript
import { describe, it, beforeEach } from 'bun:test';
import should from 'should';
import { TaskService, TaskNotFoundError } from '../src/lib/task/service';
import { TaskMemoryRepo } from '../src/adapters/repos/memory/task.memory-repo';
import { TaskName, Priority, TaskId } from '../src/lib/task/structures';

describe('TaskService', () => {
  let repo: TaskMemoryRepo;
  let subject: TaskService;

  beforeEach(() => {
    repo = new TaskMemoryRepo();
    subject = new TaskService(repo);
  });

  describe('create', () => {
    it('should create task with valid input', async () => {
      // Arrange
      const input = {
        name: TaskName.create('Test Task'),
        priority: Priority.HIGH,
      };

      // Act
      const actual = await subject.create(input);

      // Assert
      actual.name.value.should.equal('Test Task');
      actual.priority.should.equal(Priority.HIGH);
    });

    it('should persist task to repository', async () => {
      // Arrange
      const input = {
        name: TaskName.create('Test Task'),
        priority: Priority.MEDIUM,
      };

      // Act
      const task = await subject.create(input);

      // Assert
      const saved = await repo.findById(task.id);
      should(saved).not.be.null();
      saved!.name.value.should.equal('Test Task');
    });
  });

  describe('getById', () => {
    it('should throw TaskNotFoundError for missing task', async () => {
      // Arrange
      const id = TaskId.fromString('non-existent');

      // Act & Assert
      await subject.getById(id).should.be.rejectedWith(TaskNotFoundError);
    });
  });
});
```

### Controller Test

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { TaskCliController } from '../src/adapters/controllers/cli/task.cli';
import { TaskControllerMapper } from '../src/lib/task/mappers/controller.mapper';
import { TaskService } from '../src/lib/task/service';
import { TaskMemoryRepo } from '../src/adapters/repos/memory/task.memory-repo';

describe('TaskCliController', () => {
  describe('create', () => {
    it('should output JSON when --json flag is set', async () => {
      // Arrange
      const outputLines: string[] = [];
      const mockOutput = {
        json: (data: unknown) => outputLines.push(JSON.stringify(data)),
        text: () => {},
        error: () => {},
      };
      const repo = new TaskMemoryRepo();
      const service = new TaskService(repo);
      const mapper = new TaskControllerMapper();
      const subject = new TaskCliController(service, mapper, mockOutput);

      // Act
      const exitCode = await subject.create({
        name: 'Test',
        '--json': true,
      });

      // Assert
      exitCode.should.equal(0);
      outputLines.length.should.equal(1);
      const output = JSON.parse(outputLines[0]);
      output.should.have.property('id');
      output.should.have.property('name', 'Test');
    });
  });
});
```

### Mapper Test

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { TaskControllerMapper } from '../src/lib/task/mappers/controller.mapper';
import { Priority } from '../src/lib/task/structures';

describe('TaskControllerMapper', () => {
  describe('toDomainInput', () => {
    const cases = [
      { dto: { name: 'Test' }, expectedPriority: Priority.MEDIUM },
      { dto: { name: 'Test', priority: 'high' }, expectedPriority: Priority.HIGH },
      { dto: { name: 'Test', priority: 'low' }, expectedPriority: Priority.LOW },
    ];

    cases.forEach((testCase, index) => {
      it(`should map priority correctly (${index + 1})`, () => {
        // Arrange
        const subject = new TaskControllerMapper();

        // Act
        const actual = subject.toDomainInput(testCase.dto);

        // Assert
        actual.priority.should.equal(testCase.expectedPriority);
      });
    });
  });
});
```
