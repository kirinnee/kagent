---
name: stateless-oop-di
description: Stateless OOP with dependency injection (structures vs objects). Use when designing or implementing classes and interfaces.
---

# Stateless OOP with Dependency Injection

## Overview

Use stateless Object-Oriented Programming with dependency injection (DI) to create maintainable, testable code. Separate pure logic from impure operations by organizing code into structures (pure data) and objects (behavior with DI).

## When to Use

- Designing new classes or services
- Implementing business logic
- Writing testable code
- Organizing project structure

## Instructions

### Step 1: Ensure Stateless Methods

All methods must be stateless - no mutable instance state. If a class has properties, they are only dependencies passed via constructor, never modified after construction.

```typescript
// ❌ BAD - Mutable state
class Counter {
  private count = 0;
  increment() {
    this.count++;
    return this.count;
  }
}

// ✅ GOOD - Stateless method
class Counter {
  increment(count: number): number {
    return count + 1;
  }
}
```

### Step 2: Avoid Mutations - Write Functional Code

**Never mutate data.** Always return new objects/arrays instead of modifying existing ones.

```typescript
// ❌ BAD - Mutations
function updateUser(user: User, name: string): User {
  user.name = name; // Mutating input!
  return user;
}

function addItem(items: Item[], item: Item): Item[] {
  items.push(item); // Mutating input!
  return items;
}

// ✅ GOOD - Return new objects
function updateUser(user: User, name: string): User {
  return { ...user, name }; // New object
}

function addItem(items: Item[], item: Item): Item[] {
  return [...items, item]; // New array
}
```

**Avoid imperative patterns:**

```typescript
// ❌ BAD - Imperative with mutations
function processUsers(users: User[]): Result[] {
  const results: Result[] = [];
  for (const user of users) {
    const result = { id: user.id, status: 'processed' };
    results.push(result); // Mutation!
  }
  return results;
}

// ✅ GOOD - Functional/declarative
function processUsers(users: User[]): Result[] {
  return users.map(user => ({
    id: user.id,
    status: 'processed',
  }));
}
```

**Building objects without mutation:**

```typescript
// ❌ BAD - Building with mutations
function buildConfig(options: Options): Config {
  const config: Partial<Config> = {};
  config.name = options.name;
  if (options.debug) {
    config.logLevel = 'debug';
  }
  config.timeout = options.timeout ?? 30;
  return config as Config;
}

// ✅ GOOD - Build immutably
function buildConfig(options: Options): Config {
  return {
    name: options.name,
    logLevel: options.debug ? 'debug' : 'info',
    timeout: options.timeout ?? 30,
  };
}
```

### Step 3: Use Dependency Injection

Pass all dependencies via constructor. Never create dependencies inside methods.

```typescript
// ❌ BAD - Hard-coded dependency
class UserService {
  getUser(id: string) {
    return fetch(`/api/users/${id}`); // creates own dependency
  }
}

// ✅ GOOD - Dependency injected
class UserService {
  constructor(private httpClient: IHttpClient) {}
  getUser(id: string) {
    return this.httpClient.get(`/api/users/${id}`);
  }
}
```

### Step 4: Resolve All Dependencies at Entry Point

**All dependencies must be constructed and wired at the application entry point**, before any business logic runs. Entry points (CLI, API handlers, etc.) are the only place where adapters are instantiated.

```typescript
// ❌ BAD - Dependencies created inside commands/handlers
function handleRequest(req: Request) {
  const db = new DatabaseAdapter(); // Created inside!
  const logger = new ConsoleAdapter(); // Created inside!
  const userService = new UserService(db, logger);
  return userService.getUser(req.params.id);
}

// ❌ BAD - Dependencies created lazily
class App {
  private userService?: UserService;

  getUserService() {
    if (!this.userService) {
      this.userService = new UserService(new DbAdapter()); // Lazy creation!
    }
    return this.userService;
  }
}

// ✅ GOOD - All dependencies resolved at entry point
// src/cli.ts (entry point)
async function main() {
  // 1. Construct ALL adapters first
  const filesystem = new FilesystemAdapter();
  const console = new ConsoleAdapter();
  const clock = new ClockAdapter();
  const process = new ProcessAdapter();

  // 2. Construct ALL services with their dependencies
  const configService = new ConfigService(filesystem);
  const userService = new UserService(filesystem, clock);
  const runService = new RunService(filesystem, process);

  // 3. Wire dependencies into commands (commands are dumb)
  const deps = { filesystem, console, clock, configService, userService, runService };

  program.addCommand(createInitCommand(deps)).addCommand(createRunCommand(deps)).addCommand(createStatusCommand(deps));

  // 4. Parse and execute
  await program.parseAsync();
}

main();
```

**Why resolve at entry point?**

- Makes the dependency graph explicit and visible
- Ensures all dependencies are ready before any code runs
- Makes testing easy - just pass different adapters
- Prevents hidden dependencies and circular issues
- Entry point is the "composition root" - the only impure place

### Step 5: Separate Structures from Objects

- **Structures**: Pure data, no methods, just properties
- **Objects**: Have methods, receive dependencies via DI, take structures as parameters

```typescript
// ✅ Structure - pure data
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Interface for impure dependency
interface ILogger {
  log(message: string): void;
}

// ✅ Object - behavior with DI
class UserService {
  constructor(private logger: ILogger) {}
  greet(user: User): string {
    this.logger.log(`Greeting ${user.id}`);
    return `Hello, ${user.name}`;
  }
}
```

## Project Structure

Organize code by **domain/feature**, not by type. Each domain folder contains its own structures, interfaces, and services. This keeps related code together and makes the codebase easier to navigate.

```
src/
├── lib/                # Pure code organized by domain
│   ├── user/           # User domain
│   │   ├── structures.ts   # User, UserRole, etc.
│   │   ├── interfaces.ts   # IUserRepository
│   │   └── service.ts      # UserService
│   ├── order/          # Order domain
│   │   ├── structures.ts   # Order, OrderStatus, etc.
│   │   ├── interfaces.ts   # IOrderRepository
│   │   └── service.ts      # OrderService
│   ├── shared/         # Shared types across domains
│   │   └── types.ts        # Result<T,E>, common enums
│   └── index.ts        # Re-exports from all domains
└── adapters/           # Impure/stateful operations
    ├── console.adapter.ts
    ├── filesystem.adapter.ts
    └── index.ts
```

### Domain Organization Rules

- Each domain folder contains its own `structures.ts`, `interfaces.ts`, `service.ts`
- A domain may omit files it doesn't need (e.g., no interfaces if no external deps)
- Cross-domain imports are allowed within `lib/` (import from sibling domains)
- `shared/types.ts` contains types used by multiple domains
- `index.ts` re-exports public APIs from all domains

### lib/{domain}/ - Pure Code

- **structures.ts**: Pure data interfaces for this domain
- **interfaces.ts**: Contracts for impure dependencies this domain needs
- **service.ts**: Stateless service class(es) for this domain
- Target: 100% test coverage (mock all dependencies)

### adapters/ - Impure Operations

- File I/O, console output, environment access, etc.
- Implement interfaces defined in lib/{domain}/interfaces.ts
- Adapters can import from lib/ (interfaces only)

## Step 6: Use Libraries to Reduce Custom Code

Before writing utility code, search npm for established, well-maintained libraries.

### Recommended Libraries

| Category     | Library          | Instead of                            |
| ------------ | ---------------- | ------------------------------------- |
| Validation   | `zod`, `valibot` | Hand-written type guards, validation  |
| Date/time    | `date-fns`       | Manual date formatting, duration calc |
| Deep merge   | `deepmerge`      | Custom object merging                 |
| Shell escape | `shell-quote`    | Manual string escaping                |
| Path utils   | Node's `path`    | String concatenation                  |

### Library Selection Criteria

**Only use libraries that meet ALL of these criteria:**

1. **Well-maintained**: Updated within last 6 months
2. **High downloads**: >100k weekly downloads on npm
3. **TypeScript support**: Built-in types or `@types/*`
4. **Small footprint**: Focused, not kitchen-sink
5. **Minimal dependencies**: Avoid deep dependency trees
6. **Good docs**: Clear API documentation
7. **Stable API**: v1.0+ with semver

**Verify before adding:**

```bash
npm info <package> time.modified  # Last update
npm info <package> dependencies   # Dependency count
```

**Red flags - DO NOT use:**

- No updates in >1 year
- <10k weekly downloads
- Security vulnerabilities (`npm audit`)
- Abandoned/archived repo
- No TypeScript types
- Excessive dependencies

```typescript
// ❌ BAD - Custom validation
function isValidConfig(obj: unknown): obj is Config {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof obj.name === 'string' &&
    'timeout' in obj &&
    typeof obj.timeout === 'number'
  );
}

// ✅ GOOD - Use zod
import { z } from 'zod';

const ConfigSchema = z.object({
  name: z.string(),
  timeout: z.number(),
});

type Config = z.infer<typeof ConfigSchema>;
const config = ConfigSchema.parse(obj); // Throws if invalid
```

```typescript
// ❌ BAD - Custom date formatting
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  // ... more manual logic
}

// ✅ GOOD - Use date-fns
import { formatDuration, intervalToDuration } from 'date-fns';

const duration = formatDuration(intervalToDuration({ start: 0, end: ms }));
```

## Checklist

- [ ] All methods are stateless (no mutable instance state)
- [ ] **No mutations** - always return new objects/arrays, never modify inputs
- [ ] **Functional over imperative** - use map/filter/reduce, avoid manual loops with push
- [ ] All dependencies passed via constructor DI
- [ ] **Dependencies resolved at entry point** - all adapters/services constructed before commands
- [ ] **Use libraries** - zod for validation, date-fns for dates, deepmerge for merging
- [ ] **Library quality** - only well-maintained libs (>100k downloads, updated <6mo, TypeScript support)
- [ ] Structures contain only data, no methods
- [ ] Objects take structures as parameters
- [ ] Interfaces defined for all impure dependencies
- [ ] `src/lib/` organized by domain (not by type)
- [ ] Each domain has its own `structures.ts`, `interfaces.ts`, `service.ts`
- [ ] `src/lib/shared/` contains cross-domain types and utilities
- [ ] `src/lib/index.ts` re-exports public APIs from all domains
- [ ] `src/adapters/` contains impure operations
- [ ] Adapters import interfaces from `lib/{domain}/interfaces.ts`
