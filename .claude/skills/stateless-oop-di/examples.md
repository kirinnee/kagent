# Stateless OOP with DI - Examples

## Example 1: Simple Greeting Service

### Structure

```typescript
// src/lib/structures.ts
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Interface for Dependency

```typescript
// src/lib/interfaces.ts
interface ILogger {
  log(message: string): void;
}
```

### Stateless Service

```typescript
// src/lib/services.ts
class GreetingService {
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
import type { ILogger } from '../lib/interfaces.js';

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
import { GreetingService } from './lib/services.js';
import type { User } from './lib/structures.js';

const logger = new ConsoleLogger();
const service = new GreetingService(logger);

const user: User = { id: '1', name: 'Alice', email: 'alice@example.com' };
console.log(service.greet(user));
```

## Example 2: File Processing

### Structures

```typescript
// src/lib/structures.ts
interface FileConfig {
  path: string;
  encoding: string;
}

interface ProcessResult {
  success: boolean;
  lines: number;
  content: string;
}
```

### Interfaces

```typescript
// src/lib/interfaces.ts
interface IFileSystem {
  readFile(path: string): string;
}

interface IParser {
  parse(content: string): string[];
}
```

### Service

```typescript
// src/lib/services.ts
class FileProcessor {
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
// test/unit/file-processor.test.ts
import 'should';
import { FileProcessor } from '../src/lib/services';

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

## Example 3: CLI Command with Multiple Dependencies

### Structures

```typescript
// src/lib/structures.ts
interface CommandContext {
  args: string[];
  env: Record<string, string>;
}

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
```

### Interfaces

```typescript
// src/lib/interfaces.ts
interface IEnvironment {
  get(key: string): string | undefined;
}

interface IProcess {
  exec(command: string): Promise<CommandResult>;
}

interface IOutput {
  write(message: string): void;
  error(message: string): void;
}
```

### Service

```typescript
// src/lib/services.ts
class CommandRunner {
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

## Example 4: Pure Utility Functions (No DI Needed)

```typescript
// src/lib/utils.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatName(first: string, last: string): string {
  return `${capitalize(first)} ${capitalize(last)}`;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Test - no mocking needed!
import { describe, it } from 'bun:test';
import 'should';

describe('Utils', () => {
  it('should capitalize first letter', () => {
    capitalize('hello').should.equal('Hello');
  });

  it('should format full name', () => {
    formatName('john', 'doe').should.equal('John Doe');
  });
});
```

## Example 5: Error Handling with Result Types

### Structures

```typescript
// src/lib/structures.ts
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

interface ValidationError {
  field: string;
  message: string;
}
```

### Service

```typescript
// src/lib/services.ts
class Validator {
  validateUser(data: unknown): Result<User, ValidationError> {
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
describe('Validator', () => {
  it('should return error for invalid input', () => {
    const validator = new Validator();
    const result = validator.validateUser(null);

    result.success.should.be.false();
    if (!result.success) {
      result.error.field.should.equal('user');
    }
  });

  it('should return valid user', () => {
    const validator = new Validator();
    const result = validator.validateUser({ id: '123', name: 'Test', email: 'test@test.com' });

    result.success.should.be.true();
    if (result.success) {
      result.data.id.should.equal('123');
    }
  });
});
```
