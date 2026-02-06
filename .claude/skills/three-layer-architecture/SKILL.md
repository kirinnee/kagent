---
name: three-layer-architecture
description: Three-layer architecture with mappers (Controller → Domain → Repo). Use when designing application architecture, adding new endpoints, or implementing data persistence. Works with stateless-oop-di skill.
invocation:
  - architecture
  - layers
  - three-layer
---

# Three-Layer Architecture

## Overview

Organize applications into three layers with mappers between them:

1. **Controller** (adapter) - IO from user/client (TUI, CLI, Socket)
2. **Domain** (lib) - Pure business logic, testable, source of truth
3. **Repository** (adapter) - IO to external systems (DB, API, files)

Mappers translate between layer-specific models, allowing layers to be swapped without breaking core logic.

## When to Use

- Designing new application architecture
- Adding new controller types (TUI, CLI, Socket)
- Implementing data persistence
- Ensuring testability of business logic
- Supporting multiple IO interfaces (terminal, network, etc.)

## The Three Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER (Adapter)                   │
│                                                                 │
│  Purpose: Handle IO from user/client                            │
│  Location: src/adapters/controllers/                            │
│  Models: DTOs (Data Transfer Objects)                           │
│                                                                 │
│  Types:                                                         │
│  • TUI Controller (interactive terminal)                        │
│  • CLI Controller (non-interactive args)                        │
│  • Socket Controller (network/data-plane)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Controller Mapper │
                    │   DTO ↔ Domain    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER (Lib)                         │
│                                                                 │
│  Purpose: Pure business logic, SOURCE OF TRUTH                  │
│  Location: src/lib/{domain}/                                    │
│  Models: Domain Models (rich, behavioral)                       │
│                                                                 │
│  Rules:                                                         │
│  • NO IO operations (no fetch, no fs, no console)               │
│  • NO knowledge of controllers or repos                         │
│  • 100% testable with mocks                                     │
│  • Uses interfaces for external dependencies                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Repo Mapper     │
                    │ Domain ↔ Data     │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER (Adapter)                   │
│                                                                 │
│  Purpose: IO to external systems (DB, files, APIs)              │
│  Location: src/adapters/repos/                                  │
│  Models: Data Models (persistence-specific)                     │
│                                                                 │
│  Types:                                                         │
│  • FileRepo (JSON/YAML files)                                   │
│  • SqliteRepo (database)                                        │
│  • ApiRepo (external services)                                  │
│  • MemoryRepo (testing)                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Models

Each layer has its own model type:

| Layer      | Model Type   | Purpose                 | Example                            |
| ---------- | ------------ | ----------------------- | ---------------------------------- |
| Controller | DTO          | Wire format, validation | `CreateTaskDto`, `TaskResponseDto` |
| Domain     | Domain Model | Business logic, rules   | `Task`, `TaskStatus`               |
| Repository | Data Model   | Persistence format      | `TaskRecord`, `TaskRow`            |

### Why Separate Models?

```typescript
// ❌ BAD - Same model everywhere (coupling)
interface Task {
  id: string;
  name: string;
  created_at: string; // DB format leaking to UI
  _rev: string; // DB-specific field
}

// ✅ GOOD - Layer-specific models

// Controller DTO (what client sends/receives)
interface CreateTaskDto {
  name: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskResponseDto {
  id: string;
  name: string;
  priority: string;
  createdAt: string; // ISO format for API
}

// Domain Model (business logic)
interface Task {
  id: TaskId;
  name: TaskName;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
}

// Data Model (persistence)
interface TaskRecord {
  id: string;
  name: string;
  priority: number; // Stored as int
  status: string;
  created_at: number; // Unix timestamp
  updated_at: number;
}
```

## Mappers

Mappers translate between layer models:

### Controller Mapper (DTO ↔ Domain)

```typescript
// src/lib/{domain}/mappers/controller.mapper.ts

export class TaskControllerMapper {
  // DTO → Domain (input)
  toDomain(dto: CreateTaskDto): CreateTaskInput {
    return {
      name: TaskName.create(dto.name),
      priority: dto.priority ? Priority.fromString(dto.priority) : Priority.DEFAULT,
    };
  }

  // Domain → DTO (output)
  toDto(task: Task): TaskResponseDto {
    return {
      id: task.id.value,
      name: task.name.value,
      priority: task.priority.toString(),
      createdAt: task.createdAt.toISOString(),
    };
  }

  // Domain → DTO (list)
  toDtoList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map(t => this.toDto(t));
  }
}
```

### Repository Mapper (Domain ↔ Data)

```typescript
// src/lib/{domain}/mappers/repo.mapper.ts

export class TaskRepoMapper {
  // Domain → Data (for saving)
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

  // Data → Domain (for loading)
  toDomain(record: TaskRecord): Task {
    return {
      id: TaskId.fromString(record.id),
      name: TaskName.create(record.name),
      priority: Priority.fromNumber(record.priority),
      status: TaskStatus.fromString(record.status),
      createdAt: new Date(record.created_at),
    };
  }

  // Data → Domain (list)
  toDomainList(records: TaskRecord[]): Task[] {
    return records.map(r => this.toDomain(r));
  }
}
```

## Directory Structure

```
src/
├── lib/                          # DOMAIN LAYER (pure)
│   ├── task/
│   │   ├── structures.ts         # Domain models (Task, TaskStatus)
│   │   ├── interfaces.ts         # ITaskRepository, ITaskService
│   │   ├── service.ts            # TaskService (business logic)
│   │   └── mappers/
│   │       ├── controller.mapper.ts  # DTO ↔ Domain
│   │       └── repo.mapper.ts        # Domain ↔ Data
│   └── shared/
│       └── types.ts              # Result<T,E>, common types
│
├── adapters/                     # ADAPTER LAYERS (impure)
│   ├── controllers/              # CONTROLLER LAYER
│   │   ├── tui/                  # Interactive terminal
│   │   │   ├── task.tui.ts
│   │   │   └── types.ts          # TUI-specific DTOs
│   │   ├── cli/                  # Non-interactive args
│   │   │   ├── task.cli.ts
│   │   │   └── types.ts          # CLI-specific DTOs
│   │   └── socket/               # Network/data-plane
│   │       ├── task.socket.ts
│   │       └── types.ts          # Socket-specific DTOs
│   │
│   └── repos/                    # REPOSITORY LAYER
│       ├── file/
│       │   ├── task.file-repo.ts
│       │   └── types.ts          # File-specific data models
│       ├── sqlite/
│       │   ├── task.sqlite-repo.ts
│       │   └── types.ts          # SQLite-specific data models
│       └── memory/
│           └── task.memory-repo.ts  # For testing
│
└── cli.ts                        # Entry point (wires everything)
```

## Controller Types

### TUI Controller (Interactive Terminal)

```typescript
// src/adapters/controllers/tui/task.tui.ts

export class TaskTuiController {
  constructor(
    private taskService: ITaskService,
    private mapper: TaskControllerMapper,
    private ui: ITuiAdapter,
  ) {}

  async createTask(): Promise<void> {
    // Interactive prompts
    const name = await this.ui.prompt('Task name:');
    const priority = await this.ui.select('Priority:', ['low', 'medium', 'high']);

    const dto: CreateTaskDto = { name, priority };
    const input = this.mapper.toDomain(dto);
    const task = await this.taskService.create(input);
    const response = this.mapper.toDto(task);

    this.ui.render(response);
  }
}
```

### CLI Controller (Non-Interactive)

```typescript
// src/adapters/controllers/cli/task.cli.ts

export class TaskCliController {
  constructor(
    private taskService: ITaskService,
    private mapper: TaskControllerMapper,
    private output: IOutputAdapter,
  ) {}

  async createTask(args: CliCreateTaskArgs): Promise<void> {
    // Args from command line
    const dto: CreateTaskDto = {
      name: args.name,
      priority: args.priority,
    };

    const input = this.mapper.toDomain(dto);
    const task = await this.taskService.create(input);
    const response = this.mapper.toDto(task);

    this.output.json(response);
  }
}
```

### Socket Controller (Network/Data-Plane)

```typescript
// src/adapters/controllers/socket/task.socket.ts

export class TaskSocketController {
  constructor(
    private taskService: ITaskService,
    private mapper: TaskControllerMapper,
  ) {}

  // Handle incoming socket messages
  async handle(message: SocketMessage): Promise<SocketResponse> {
    switch (message.type) {
      case 'task.create': {
        const dto = message.payload as CreateTaskDto;
        const input = this.mapper.toDomain(dto);
        const task = await this.taskService.create(input);
        return {
          type: 'task.created',
          payload: this.mapper.toDto(task),
        };
      }
      // ... other handlers
    }
  }
}
```

## Repository Implementation

```typescript
// src/adapters/repos/file/task.file-repo.ts

export class TaskFileRepo implements ITaskRepository {
  constructor(
    private fs: IFilesystemAdapter,
    private mapper: TaskRepoMapper,
    private path: string,
  ) {}

  async save(task: Task): Promise<void> {
    const records = await this.loadRecords();
    const data = this.mapper.toData(task);
    records[task.id.value] = data;
    await this.fs.writeJson(this.path, records);
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

  private async loadRecords(): Promise<Record<string, TaskRecord>> {
    const exists = await this.fs.exists(this.path);
    return exists ? await this.fs.readJson(this.path) : {};
  }
}
```

## Wiring at Entry Point

```typescript
// src/cli.ts

async function main() {
  // 1. Adapters (IO)
  const fs = new FilesystemAdapter();
  const console = new ConsoleAdapter();
  const socket = new SocketAdapter();

  // 2. Mappers
  const taskControllerMapper = new TaskControllerMapper();
  const taskRepoMapper = new TaskRepoMapper();

  // 3. Repositories
  const taskRepo = new TaskFileRepo(fs, taskRepoMapper, '.kagent/tasks.json');

  // 4. Services (Domain)
  const taskService = new TaskService(taskRepo);

  // 5. Controllers
  const taskTuiController = new TaskTuiController(taskService, taskControllerMapper, console);
  const taskCliController = new TaskCliController(taskService, taskControllerMapper, console);
  const taskSocketController = new TaskSocketController(taskService, taskControllerMapper);

  // 6. Route based on mode
  if (process.argv.includes('--tui')) {
    await taskTuiController.run();
  } else if (socket.isConnected()) {
    socket.onMessage(msg => taskSocketController.handle(msg));
  } else {
    await taskCliController.run(parseArgs());
  }
}
```

## Benefits of Mappers

| Benefit                | Without Mappers    | With Mappers            |
| ---------------------- | ------------------ | ----------------------- |
| **Swap controller**    | Break domain tests | Just change DTO mapper  |
| **Swap repo**          | Break domain tests | Just change data mapper |
| **Add new controller** | Modify domain      | Add new DTO + mapper    |
| **Change DB schema**   | Touch all layers   | Only repo mapper        |
| **Domain tests**       | Mock IO details    | Mock interfaces only    |

## Checklist

- [ ] Three layers: Controller → Domain → Repo
- [ ] Domain layer has NO IO, NO knowledge of other layers
- [ ] Each layer has its own model type (DTO, Domain, Data)
- [ ] Controller mapper: DTO ↔ Domain
- [ ] Repo mapper: Domain ↔ Data
- [ ] Mappers live in `src/lib/{domain}/mappers/`
- [ ] Controllers support: TUI, CLI, Socket
- [ ] Repos implement domain interfaces
- [ ] All wiring happens at entry point
- [ ] Domain is 100% testable with mocks

## Related Skills

- **stateless-oop-di**: Stateless OOP patterns, dependency injection
- **testing**: Arrange-Act-Assert, spies and mocks
