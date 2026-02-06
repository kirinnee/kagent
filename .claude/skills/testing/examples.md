# Testing Conventions - Examples

## Example 1: Simple Stateless Service

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { GreetingService } from '../src/lib/services';
import type { ILogger } from '../src/lib/interfaces';
import type { User } from '../src/lib/structures';

describe('GreetingService', () => {
  it('should greet user by name', () => {
    // Arrange - object construction, `subject` setup, `input`s, `expected`
    const mockLogger: ILogger = { log: () => {} };
    const subject = new GreetingService(mockLogger);
    const input: User = { id: '123', name: 'Alice', email: 'alice@example.com' };
    const expected = 'Hello, Alice!';

    // Act - perform action => actual = subject.method(input)
    const actual = subject.greet(input);

    // Assert - actual.should.deep.equal(expected)
    actual.should.equal(expected);
  });
});
```

## Example 2: Service with Multiple Dependencies

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { FileProcessor } from '../src/lib/services';
import type { IFileSystem, IParser } from '../src/lib/interfaces';

describe('FileProcessor', () => {
  it('should process file and count lines', () => {
    // Arrange
    const mockFs: IFileSystem = {
      readFile: (path: string) => 'line1\nline2\nline3',
    };
    const mockParser: IParser = {
      parse: (content: string) => content.split('\n'),
    };
    const subject = new FileProcessor(mockFs, mockParser);
    const input = { path: '/test.txt', encoding: 'utf-8' };
    const expected = {
      success: true,
      lines: 3,
      content: 'line1\nline2\nline3',
    };

    // Act
    const actual = subject.process(input);

    // Assert
    actual.should.eql(expected);
  });
});
```

## Example 3: Async Service

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { DataService } from '../src/lib/services';

describe('DataService', () => {
  it('should fetch and parse user data', async () => {
    // Arrange
    const mockHttpClient = {
      get: (url: string) => Promise.resolve('{"id":"123","name":"Alice"}'),
    };
    const subject = new DataService(mockHttpClient);
    const input = '/api/users/123';
    const expected = { id: '123', name: 'Alice' };

    // Act
    const actual = await subject.fetchUser(input);

    // Assert
    actual.should.eql(expected);
  });
});
```

## Example 4: Error Handling

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { Validator } from '../src/lib/services';

describe('Validator', () => {
  it('should throw error for null input', () => {
    // Arrange
    const subject = new Validator();
    const input = null;

    // Act & Assert
    ((): void => subject.validate(input)).should.throw('Input cannot be null');
  });

  it('should return error result for invalid email', () => {
    // Arrange
    const subject = new Validator();
    const input = { email: 'not-an-email' };
    const expected = {
      valid: false,
      errors: ['Invalid email format'],
    };

    // Act
    const actual = subject.validateEmail(input.email);

    // Assert
    actual.should.eql(expected);
  });
});
```

## Example 5: Pure Functions

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { capitalize, formatName } from '../src/lib/utils';

describe('StringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      // Arrange
      const input = 'hello';
      const expected = 'Hello';

      // Act
      const actual = capitalize(input);

      // Assert
      actual.should.equal(expected);
    });

    it('should handle empty string', () => {
      // Arrange
      const input = '';
      const expected = '';

      // Act
      const actual = capitalize(input);

      // Assert
      actual.should.equal(expected);
    });
  });

  describe('formatName', () => {
    it('should format first and last name', () => {
      // Arrange
      const inputFirst = 'john';
      const inputLast = 'doe';
      const expected = 'John Doe';

      // Act
      const actual = formatName(inputFirst, inputLast);

      // Assert
      actual.should.equal(expected);
    });
  });
});
```

## Example 6: Testing with Fixtures

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { UserValidator } from '../src/lib/services';
import { validUser, invalidUser } from '../fixtures/test-data';

describe('UserValidator', () => {
  it('should validate valid user', () => {
    // Arrange
    const subject = new UserValidator();
    const input = validUser;

    // Act
    const actual = subject.validate(input);

    // Assert
    actual.should.be.true();
  });

  it('should reject invalid user', () => {
    // Arrange
    const subject = new UserValidator();
    const input = invalidUser;

    // Act
    const actual = subject.validate(input);

    // Assert
    actual.should.be.false();
  });
});
```

## Example 7: Multiple Related Assertions

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { ResultBuilder } from '../src/lib/services';

describe('ResultBuilder', () => {
  it('should build complete result', () => {
    // Arrange
    const subject = new ResultBuilder();
    const input = { name: 'Test', count: 5 };

    // Act
    const actual = subject.build(input);

    // Assert - multiple related assertions are OK
    actual.should.have.property('name');
    actual.should.have.property('count');
    actual.should.have.property('success');
    actual.name.should.equal('Test');
    actual.count.should.equal(5);
    actual.success.should.be.true();
  });
});
```

## Example 8: Array/Collection Testing

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { ArrayUtils } from '../src/lib/utils';

describe('ArrayUtils', () => {
  it('should filter positive numbers', () => {
    // Arrange
    const subject = new ArrayUtils();
    const input = [-1, 0, 1, 2, -3, 4];
    const expected = [1, 2, 4];

    // Act
    const actual = subject.filterPositive(input);

    // Assert
    actual.should.eql(expected);
  });

  it('should find item by id', () => {
    // Arrange
    const subject = new ArrayUtils();
    const items = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
    ];
    const input = '2';
    const expected = { id: '2', name: 'Second' };

    // Act
    const actual = subject.findById(items, input);

    // Assert
    actual.should.eql(expected);
  });

  it('should return undefined for non-existent id', () => {
    // Arrange
    const subject = new ArrayUtils();
    const items = [{ id: '1', name: 'First' }];
    const input = '999';

    // Act
    const actual = subject.findById(items, input);

    // Assert
    should(actual).be.undefined();
  });
});
```

## Example 9: String Manipulation

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { TextProcessor } from '../src/lib/services';

describe('TextProcessor', () => {
  it('should extract username from email', () => {
    // Arrange
    const subject = new TextProcessor();
    const input = 'alice@example.com';
    const expected = 'alice';

    // Act
    const actual = subject.extractUsername(input);

    // Assert
    actual.should.equal(expected);
  });

  it('should handle email without @', () => {
    // Arrange
    const subject = new TextProcessor();
    const input = 'not-an-email';

    // Act
    const actual = subject.extractUsername(input);

    // Assert
    actual.should.equal('not-an-email');
  });
});
```

## Example 10: Integration with Multiple Steps

```typescript
import { describe, it } from 'bun:test';
import should from 'should';
import { UserService } from '../src/lib/services';

describe('UserService', () => {
  it('should create and format user profile', () => {
    // Arrange
    const mockLogger = { log: () => {} };
    const subject = new UserService(mockLogger);
    const input = {
      firstName: 'john',
      lastName: 'doe',
      email: 'john@example.com',
    };
    const expected = {
      displayName: 'John Doe',
      email: 'john@example.com',
      username: 'john',
      created: true,
    };

    // Act
    const actual = subject.createProfile(input);

    // Assert
    actual.should.eql(expected);
  });
});
```
