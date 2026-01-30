# Stateless OOP with DI - Examples

## Example 1: User Domain (Simple Service)

### Domain Structure

```
src/lib/user/
├── structures.ts
├── interfaces.ts
└── service.ts
```

### Structures

```typescript
// src/lib/user/structures.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### Interface for Dependency

```typescript
// src/lib/user/interfaces.ts
export interface ILogger {
  log(message: string): void;
}
```

### Stateless Service

```typescript
// src/lib/user/service.ts
import type { User } from './structures.js';
import type { ILogger } from './interfaces.js';

export class UserService {
  constructor(private logger: ILogger) {}

  greet(user: User): string {
    this.logger.log(`Greeting user ${user.id}`);
    return `Hello, ${user.name}!`;
  }

  formalGreet(user: User, title: string): string {
    this.logger.log(`Formal greeting for ${user.id}`);
    return `Good day, ${title} ${user.name}.`;
  }
}
```

### Adapter (Impure)

```typescript
// src/adapters/console.adapter.ts
import type { ILogger } from '../lib/user/interfaces.js';

export class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(message);
  }
}
```

### Usage in CLI

```typescript
// src/cli.ts
import { ConsoleLogger } from './adapters/console.adapter.js';
import { UserService } from './lib/user/service.js';
import type { User } from './lib/user/structures.js';

const logger = new ConsoleLogger();
const service = new UserService(logger);

const user: User = { id: '1', name: 'Alice', email: 'alice@example.com' };
console.log(service.greet(user));
```

## Example 2: File Domain (Multiple Dependencies)

### Domain Structure

```
src/lib/file/
├── structures.ts
├── interfaces.ts
└── service.ts
```

### Structures

```typescript
// src/lib/file/structures.ts
export interface FileConfig {
  path: string;
  encoding: string;
}

export interface ProcessResult {
  success: boolean;
  lines: number;
  content: string;
}
```

### Interfaces

```typescript
// src/lib/file/interfaces.ts
export interface IFileSystem {
  readFile(path: string): string;
}

export interface IParser {
  parse(content: string): string[];
}
```

### Service

```typescript
// src/lib/file/service.ts
import type { FileConfig, ProcessResult } from './structures.js';
import type { IFileSystem, IParser } from './interfaces.js';

export class FileProcessor {
  constructor(
    private fs: IFileSystem,
    private parser: IParser,
  ) {}

  process(config: FileConfig): ProcessResult {
    const content = this.fs.readFile(config.path);
    const lines = this.parser.parse(content);

    return {
      success: true,
      lines: lines.length,
      content: lines.join('\n'),
    };
  }
}
```

### Unit Test

```typescript
// test/unit/file/service.test.ts
import 'should';
import { FileProcessor } from '../../../src/lib/file/service';

describe('FileProcessor', () => {
  it('should process file content', () => {
    // Arrange
    const mockFs = {
      readFile: (path: string) => 'line1\nline2\nline3',
    };
    const mockParser = {
      parse: (content: string) => content.split('\n'),
    };
    const subject = new FileProcessor(mockFs, mockParser);
    const input = { path: '/test.txt', encoding: 'utf-8' };

    // Act
    const actual = subject.process(input);

    // Assert
    actual.should.eql({
      success: true,
      lines: 3,
      content: 'line1\nline2\nline3',
    });
  });
});
```

## Example 3: Command Domain (Multiple Dependencies)

### Domain Structure

```
src/lib/command/
├── structures.ts
├── interfaces.ts
└── service.ts
```

### Structures

```typescript
// src/lib/command/structures.ts
export interface CommandContext {
  args: string[];
  env: Record<string, string>;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
```

### Interfaces

```typescript
// src/lib/command/interfaces.ts
import type { CommandResult } from './structures.js';

export interface IEnvironment {
  get(key: string): string | undefined;
}

export interface IProcess {
  exec(command: string): Promise<CommandResult>;
}

export interface IOutput {
  write(message: string): void;
  error(message: string): void;
}
```

### Service

```typescript
// src/lib/command/service.ts
import type { CommandContext, CommandResult } from './structures.js';
import type { IEnvironment, IProcess, IOutput } from './interfaces.js';

export class CommandRunner {
  constructor(
    private env: IEnvironment,
    private process: IProcess,
    private output: IOutput,
  ) {}

  async run(context: CommandContext): Promise<CommandResult> {
    const command = context.args[0];
    this.output.write(`Running: ${command}`);

    const result = await this.process.exec(command);
    this.output.write(`Exit code: ${result.exitCode}`);

    return result;
  }
}
```

## Example 4: Shared Domain (Pure Utilities)

Some code is shared across domains and can live in `shared/`:

```
src/lib/shared/
├── types.ts      # Common types (Result, etc.)
└── utils.ts      # Pure utility functions
```

```typescript
// src/lib/shared/utils.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatName(first: string, last: string): string {
  return `${capitalize(first)} ${capitalize(last)}`;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

```typescript
// test/unit/shared/utils.test.ts - no mocking needed!
import { describe, it } from 'bun:test';
import 'should';
import { capitalize, formatName } from '../../../src/lib/shared/utils';

describe('Utils', () => {
  it('should capitalize first letter', () => {
    capitalize('hello').should.equal('Hello');
  });

  it('should format full name', () => {
    formatName('john', 'doe').should.equal('John Doe');
  });
});
```

## Example 5: Validation Domain (Result Types)

### Domain Structure

```
src/lib/validation/
├── structures.ts
└── service.ts
```

### Shared Types

```typescript
// src/lib/shared/types.ts
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };
```

### Structures

```typescript
// src/lib/validation/structures.ts
export interface ValidationError {
  field: string;
  message: string;
}
```

### Service

```typescript
// src/lib/validation/service.ts
import type { Result } from '../shared/types.js';
import type { User } from '../user/structures.js';
import type { ValidationError } from './structures.js';

export class UserValidator {
  validate(data: unknown): Result<User, ValidationError> {
    if (typeof data !== 'object' || data === null) {
      return { success: false, error: { field: 'user', message: 'Must be object' } };
    }

    const user = data as User;
    if (!user.id) {
      return { success: false, error: { field: 'id', message: 'Required' } };
    }

    return { success: true, data: user };
  }
}
```

### Test

```typescript
// test/unit/validation/service.test.ts
import 'should';
import { UserValidator } from '../../../src/lib/validation/service';

describe('UserValidator', () => {
  it('should return error for invalid input', () => {
    // Arrange
    const subject = new UserValidator();

    // Act
    const actual = subject.validate(null);

    // Assert
    actual.success.should.be.false();
    if (!actual.success) {
      actual.error.field.should.equal('user');
    }
  });

  it('should return valid user', () => {
    // Arrange
    const subject = new UserValidator();
    const input = { id: '123', name: 'Test', email: 'test@test.com' };

    // Act
    const actual = subject.validate(input);

    // Assert
    actual.success.should.be.true();
    if (actual.success) {
      actual.data.id.should.equal('123');
    }
  });
});
```

## Example 6: Cross-Domain Import

Domains can import from other domains within `lib/`:

```typescript
// src/lib/order/service.ts
import type { User } from '../user/structures.js'; // Cross-domain import
import type { Result } from '../shared/types.js'; // Shared types
import type { Order, OrderStatus } from './structures.js';
import type { IOrderRepository } from './interfaces.js';

export class OrderService {
  constructor(private repo: IOrderRepository) {}

  createOrder(user: User, items: string[]): Result<Order, string> {
    if (items.length === 0) {
      return { success: false, error: 'No items provided' };
    }

    const order: Order = {
      id: crypto.randomUUID(),
      userId: user.id,
      items,
      status: 'pending',
    };

    return { success: true, data: order };
  }
}
```

## Example 7: Index Re-exports

The main `index.ts` re-exports from all domains:

```typescript
// src/lib/index.ts
// User domain
export type { User } from './user/structures.js';
export type { ILogger } from './user/interfaces.js';
export { UserService } from './user/service.js';

// Order domain
export type { Order, OrderStatus } from './order/structures.js';
export { OrderService } from './order/service.js';

// Validation domain
export type { ValidationError } from './validation/structures.js';
export { UserValidator } from './validation/service.js';

// Shared
export type { Result } from './shared/types.js';
export { capitalize, formatName, validateEmail } from './shared/utils.js';
```
