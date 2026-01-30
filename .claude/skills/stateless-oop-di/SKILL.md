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

### Step 2: Use Dependency Injection

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

### Step 3: Separate Structures from Objects

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

Organize code to separate pure and impure:

```
src/
├── lib/                # Pure code: structures, interfaces, classes
│   ├── structures.ts   # Pure data structures
│   ├── interfaces.ts   # Interfaces for impure dependencies
│   ├── services.ts     # Stateless service classes
│   └── index.ts        # Library exports
└── adapters/           # Impure/stateful operations
    ├── console.adapter.ts
    ├── filesystem.adapter.ts
    └── index.ts
```

### lib/ - Pure Code

- **structures.ts**: Pure data interfaces with no behavior
- **interfaces.ts**: Contracts for impure dependencies
- **services.ts**: Stateless classes using dependencies via DI
- Target: 100% test coverage (mock all dependencies)

### adapters/ - Impure Operations

- File I/O, console output, environment access, etc.
- Implement interfaces defined in lib/
- Never import from lib/ (avoid circular dependencies)

## Checklist

- [ ] All methods are stateless (no mutable instance state)
- [ ] All dependencies passed via constructor DI
- [ ] Structures contain only data, no methods
- [ ] Objects take structures as parameters
- [ ] Interfaces defined for all impure dependencies
- [ ] `src/lib/` contains only pure code
- [ ] `src/adapters/` contains impure operations
- [ ] No circular dependencies between lib and adapters
