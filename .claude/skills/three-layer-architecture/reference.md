# Three-Layer Architecture - Reference

## Model Types

### DTO (Data Transfer Object)

DTOs are used at the **controller boundary**. They are:

- Simple, serializable objects
- Validation-focused
- Transport-format specific (JSON, CLI args, etc.)
- Different for each controller type if needed

```typescript
// CLI DTO (from command line args)
interface CliCreateTaskArgs {
  name: string;
  priority?: string;
  '--verbose'?: boolean;
}

// Socket DTO (from network)
interface SocketCreateTaskDto {
  name: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

// TUI DTO (from interactive prompts)
interface TuiCreateTaskInput {
  name: string;
  priority: string;
  confirmed: boolean;
}
```

### Domain Model

Domain models represent **business concepts**. They are:

- Rich with behavior (value objects, entities)
- Validation built-in
- No persistence concerns
- The source of truth

```typescript
// Value Objects (immutable, validated)
class TaskId {
  private constructor(readonly value: string) {}

  static create(): TaskId {
    return new TaskId(crypto.randomUUID());
  }

  static fromString(value: string): TaskId {
    if (!value || value.length === 0) {
      throw new Error('TaskId cannot be empty');
    }
    return new TaskId(value);
  }
}

class TaskName {
  private constructor(readonly value: string) {}

  static create(value: string): TaskName {
    if (!value || value.trim().length === 0) {
      throw new Error('TaskName cannot be empty');
    }
    if (value.length > 255) {
      throw new Error('TaskName too long');
    }
    return new TaskName(value.trim());
  }
}

// Entity
interface Task {
  id: TaskId;
  name: TaskName;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
}
```

### Data Model

Data models are **persistence-specific**. They are:

- Flat, serializable structures
- Match the storage format
- May have DB-specific fields
- Different for each repo type

```typescript
// File repo data model (JSON)
interface TaskFileRecord {
  id: string;
  name: string;
  priority: string;
  status: string;
  createdAt: string; // ISO date string
}

// SQLite repo data model
interface TaskSqliteRow {
  id: string;
  name: string;
  priority: number; // INT
  status: string;
  created_at: number; // Unix timestamp
  updated_at: number;
}

// API repo data model (external service)
interface TaskApiResponse {
  taskId: string; // Different field name
  taskName: string;
  priorityLevel: number;
  currentStatus: string;
  timestamps: {
    created: string;
    modified: string;
  };
}
```

## Mapper Patterns

### Input Mapper (Controller → Domain)

```typescript
class TaskControllerMapper {
  // Validates and transforms DTO to domain input
  toDomainInput(dto: CreateTaskDto): CreateTaskInput {
    // Validation happens here or in value objects
    return {
      name: TaskName.create(dto.name),
      priority: dto.priority ? Priority.fromString(dto.priority) : Priority.DEFAULT,
    };
  }
}
```

### Output Mapper (Domain → Controller)

```typescript
class TaskControllerMapper {
  // Transforms domain to DTO for response
  toDto(task: Task): TaskResponseDto {
    return {
      id: task.id.value,
      name: task.name.value,
      priority: task.priority.toString(),
      createdAt: task.createdAt.toISOString(),
    };
  }
}
```

### Save Mapper (Domain → Data)

```typescript
class TaskRepoMapper {
  // Transforms domain to persistence format
  toData(task: Task): TaskRecord {
    return {
      id: task.id.value,
      name: task.name.value,
      priority: task.priority.toNumber(),
      status: task.status.value,
      created_at: task.createdAt.getTime(),
      updated_at: Date.now(),
    };
  }
}
```

### Load Mapper (Data → Domain)

```typescript
class TaskRepoMapper {
  // Transforms persistence format to domain
  toDomain(record: TaskRecord): Task {
    return {
      id: TaskId.fromString(record.id),
      name: TaskName.create(record.name),
      priority: Priority.fromNumber(record.priority),
      status: TaskStatus.fromString(record.status),
      createdAt: new Date(record.created_at),
    };
  }
}
```

## Controller Type Reference

### TUI Controller

For interactive terminal interfaces:

```typescript
interface ITuiAdapter {
  prompt(message: string): Promise<string>;
  select(message: string, options: string[]): Promise<string>;
  confirm(message: string): Promise<boolean>;
  render(component: TuiComponent): void;
  clear(): void;
}

class TaskTuiController {
  constructor(
    private service: ITaskService,
    private mapper: TaskControllerMapper,
    private tui: ITuiAdapter,
  ) {}

  async createTask(): Promise<void> {
    const name = await this.tui.prompt('Task name:');
    const priority = await this.tui.select('Priority:', ['low', 'medium', 'high']);
    const confirmed = await this.tui.confirm('Create task?');

    if (!confirmed) return;

    const input = this.mapper.toDomainInput({ name, priority });
    const task = await this.service.create(input);
    this.tui.render(this.mapper.toDto(task));
  }
}
```

### CLI Controller

For non-interactive command-line:

```typescript
interface IOutputAdapter {
  text(message: string): void;
  json(data: unknown): void;
  error(message: string): void;
  table(rows: unknown[]): void;
}

class TaskCliController {
  constructor(
    private service: ITaskService,
    private mapper: TaskControllerMapper,
    private output: IOutputAdapter,
  ) {}

  async createTask(args: CliCreateTaskArgs): Promise<number> {
    try {
      const input = this.mapper.toDomainInput({
        name: args.name,
        priority: args.priority,
      });
      const task = await this.service.create(input);

      if (args['--json']) {
        this.output.json(this.mapper.toDto(task));
      } else {
        this.output.text(`Created task: ${task.id.value}`);
      }
      return 0;
    } catch (error) {
      this.output.error(error.message);
      return 1;
    }
  }
}
```

### Socket Controller

For network/data-plane communication:

```typescript
interface SocketMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

interface SocketResponse {
  type: string;
  payload: unknown;
  requestId?: string;
  error?: string;
}

class TaskSocketController {
  constructor(
    private service: ITaskService,
    private mapper: TaskControllerMapper,
  ) {}

  async handle(message: SocketMessage): Promise<SocketResponse> {
    const requestId = message.requestId;

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

        case 'task.list': {
          const tasks = await this.service.list();
          return {
            type: 'task.list.result',
            payload: this.mapper.toDtoList(tasks),
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
      return {
        type: 'error',
        error: error.message,
        requestId,
      };
    }
  }
}
```

## Repository Type Reference

### File Repository

```typescript
class TaskFileRepo implements ITaskRepository {
  constructor(
    private fs: IFilesystemAdapter,
    private mapper: TaskRepoMapper,
    private filePath: string,
  ) {}

  async save(task: Task): Promise<void> {
    const records = await this.loadAll();
    records[task.id.value] = this.mapper.toData(task);
    await this.fs.writeJson(this.filePath, records);
  }

  async findById(id: TaskId): Promise<Task | null> {
    const records = await this.loadAll();
    const record = records[id.value];
    return record ? this.mapper.toDomain(record) : null;
  }

  private async loadAll(): Promise<Record<string, TaskRecord>> {
    if (!(await this.fs.exists(this.filePath))) {
      return {};
    }
    return this.fs.readJson(this.filePath);
  }
}
```

### SQLite Repository

```typescript
class TaskSqliteRepo implements ITaskRepository {
  constructor(
    private db: Database,
    private mapper: TaskRepoMapper,
  ) {}

  async save(task: Task): Promise<void> {
    const data = this.mapper.toData(task);
    this.db.run(
      `
      INSERT OR REPLACE INTO tasks (id, name, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [data.id, data.name, data.priority, data.status, data.created_at, data.updated_at],
    );
  }

  async findById(id: TaskId): Promise<Task | null> {
    const row = this.db.query('SELECT * FROM tasks WHERE id = ?').get(id.value);
    return row ? this.mapper.toDomain(row as TaskSqliteRow) : null;
  }
}
```

### Memory Repository (Testing)

```typescript
class TaskMemoryRepo implements ITaskRepository {
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

  // Test helper
  clear(): void {
    this.tasks.clear();
  }
}
```

## Error Handling Across Layers

### Domain Errors

```typescript
// Domain-specific errors
class TaskNotFoundError extends Error {
  constructor(id: TaskId) {
    super(`Task not found: ${id.value}`);
    this.name = 'TaskNotFoundError';
  }
}

class InvalidTaskNameError extends Error {
  constructor(reason: string) {
    super(`Invalid task name: ${reason}`);
    this.name = 'InvalidTaskNameError';
  }
}
```

### Controller Error Mapping

```typescript
class TaskCliController {
  async createTask(args: CliArgs): Promise<number> {
    try {
      // ... create task
      return 0;
    } catch (error) {
      if (error instanceof InvalidTaskNameError) {
        this.output.error(`Invalid name: ${error.message}`);
        return 1;
      }
      if (error instanceof TaskNotFoundError) {
        this.output.error(`Not found: ${error.message}`);
        return 2;
      }
      // Unknown error
      this.output.error(`Error: ${error.message}`);
      return 255;
    }
  }
}
```

### Socket Error Response

```typescript
class TaskSocketController {
  async handle(message: SocketMessage): Promise<SocketResponse> {
    try {
      // ... handle message
    } catch (error) {
      return {
        type: 'error',
        error: error.message,
        errorType: error.name, // 'TaskNotFoundError', etc.
        requestId: message.requestId,
      };
    }
  }
}
```

## Testing Strategy

### Domain Tests (Unit)

```typescript
describe('TaskService', () => {
  it('should create task with valid input', async () => {
    // Arrange
    const mockRepo = new TaskMemoryRepo();
    const subject = new TaskService(mockRepo);
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
});
```

### Controller Tests (Unit)

```typescript
describe('TaskCliController', () => {
  it('should output JSON when --json flag is set', async () => {
    // Arrange
    const outputLines: string[] = [];
    const mockOutput: IOutputAdapter = {
      json: data => outputLines.push(JSON.stringify(data)),
      text: () => {},
      error: () => {},
    };
    const mockService = new MockTaskService();
    const subject = new TaskCliController(mockService, new TaskControllerMapper(), mockOutput);

    // Act
    await subject.createTask({ name: 'Test', '--json': true });

    // Assert
    outputLines.length.should.equal(1);
    JSON.parse(outputLines[0]).should.have.property('id');
  });
});
```

### Mapper Tests (Unit)

```typescript
describe('TaskControllerMapper', () => {
  describe('toDomainInput', () => {
    it('should map DTO to domain input', () => {
      // Arrange
      const subject = new TaskControllerMapper();
      const input: CreateTaskDto = { name: 'Test', priority: 'high' };

      // Act
      const actual = subject.toDomainInput(input);

      // Assert
      actual.name.value.should.equal('Test');
      actual.priority.should.equal(Priority.HIGH);
    });
  });
});
```

### Integration Tests

```typescript
describe('Task Creation (Integration)', () => {
  it('should create task end-to-end', async () => {
    // Arrange - real components, memory repo
    const repo = new TaskMemoryRepo();
    const service = new TaskService(repo);
    const mapper = new TaskControllerMapper();
    const output = new TestOutputAdapter();
    const controller = new TaskCliController(service, mapper, output);

    // Act
    const exitCode = await controller.createTask({ name: 'Test Task' });

    // Assert
    exitCode.should.equal(0);
    const tasks = await repo.findAll();
    tasks.length.should.equal(1);
    tasks[0].name.value.should.equal('Test Task');
  });
});
```
