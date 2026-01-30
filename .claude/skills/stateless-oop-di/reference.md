# Stateless OOP with DI - Reference

## Core Concepts

### Statelessness

A method is stateless when:

- It doesn't read or modify instance properties
- All data needed for computation is passed as parameters
- Given the same inputs, it always returns the same output

### Dependency Injection (DI)

DI is a technique where:

- Dependencies are passed to a class via its constructor
- The class doesn't create its own dependencies
- This makes testing easy (mock dependencies) and behavior predictable

### Structures vs Objects

**Structures (Pure Data)**

- Interfaces or types with properties only
- No methods, no behavior
- Can be serialized, compared, validated
- Examples: `User`, `Config`, `RequestData`

**Objects (Behavior with DI)**

- Classes with methods that operate on structures
- Receive dependencies via constructor DI
- Take structures as parameters
- Examples: `UserService`, `FileProcessor`, `CommandRunner`

## TypeScript Patterns

### Pure Data Structures

```typescript
// Structure - pure data interface
interface User {
  id: string;
  name: string;
  email: string;
}

// Structure - can have type constraints
interface Result<T, E> {
  success: boolean;
  data?: T;
  error?: E;
}

// Structure - readonly for immutability
interface Config {
  readonly port: number;
  readonly host: string;
}
```

### Dependency Injection Patterns

```typescript
// Interface for impure dependency
interface ILogger {
  log(message: string): void;
}

// Class with DI
class UserService {
  // Dependency injected via constructor
  constructor(private logger: ILogger) {}

  // Stateless method - takes structure, returns structure
  greet(user: User): string {
    this.logger.log(`Greeting ${user.id}`);
    return `Hello, ${user.name}`;
  }
}
```

### Multiple Dependencies

```typescript
interface ILogger {
  log(message: string): void;
}

interface IHttpClient {
  get(url: string): Promise<string>;
}

class ApiService {
  constructor(
    private logger: ILogger,
    private http: IHttpClient,
  ) {}

  async fetchData(url: string): Promise<string> {
    this.logger.log(`Fetching ${url}`);
    return await this.http.get(url);
  }
}
```

## Testing Patterns

### Mocking Dependencies

```typescript
// Mock dependency
const mockLogger: ILogger = {
  log: (message: string) => {
    console.log(`[MOCK] ${message}`);
  },
};

// Test with mock
const service = new UserService(mockLogger);
const user = { id: '1', name: 'Alice', email: 'alice@example.com' };
const result = service.greet(user);
// Assert result
```

### Pure Function Testing

```typescript
// Pure functions are easy to test
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// No mocking needed!
const calc = new Calculator();
assert(calc.add(2, 3) === 5);
```

## Project Structure Rules

### Domain-Based Organization

Organize `lib/` by **domain/feature**, not by type:

```
src/lib/
├── user/               # User domain
│   ├── structures.ts   # User, UserRole
│   ├── interfaces.ts   # IUserRepository
│   └── service.ts      # UserService
├── order/              # Order domain
│   ├── structures.ts   # Order, OrderStatus
│   └── service.ts      # OrderService (no external deps)
├── shared/             # Cross-domain types
│   └── types.ts        # Result<T,E>, common enums
└── index.ts            # Re-exports
```

### src/lib/{domain}/ - Pure Code

**What goes in each domain folder:**

- `structures.ts`: Pure data interfaces for this domain
- `interfaces.ts`: Contracts for impure dependencies (optional)
- `service.ts`: Stateless service class(es)

**What doesn't go here:**

- File I/O operations
- Console output
- Environment variable access
- Network calls
- Database queries

### src/adapters/ - Impure Operations

**What goes here:**

- File system adapters
- Console adapters
- Environment adapters
- Process adapters
- HTTP client adapters

**Key rule:** Adapters import interfaces from `lib/{domain}/interfaces.ts`

## Common Mistakes

### ❌ Mutable Instance State

```typescript
// BAD - Has mutable state
class Counter {
  private count = 0;
  increment() {
    this.count++;
    return this.count;
  }
}
```

### ❌ Creating Dependencies Inside Methods

```typescript
// BAD - Creates its own dependency
class UserService {
  getUser(id: string) {
    return fetch(`/api/users/${id}`); // Creates own fetch
  }
}
```

### ✅ Correct: Stateless with DI

```typescript
// GOOD - Stateless, DI
class Counter {
  increment(count: number): number {
    return count + 1;
  }
}

// GOOD - DI for dependencies
class UserService {
  constructor(private httpClient: IHttpClient) {}
  getUser(id: string) {
    return this.httpClient.get(`/api/users/${id}`);
  }
}
```

## Benefits

1. **Testability**: Mock dependencies easily
2. **Predictability**: No hidden state changes
3. **Reusability**: Stateless methods work anywhere
4. **Parallelism**: No shared state to worry about
5. **Debugging**: Easier to trace data flow
