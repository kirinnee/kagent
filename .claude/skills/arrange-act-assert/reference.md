# Arrange-Act-Assert Test Format - Reference

## The AAA Pattern

The Arrange-Act-Assert (AAA) pattern is a standard way to structure tests:

1. **Arrange** - Set up the test by constructing the subject, defining inputs, and expected results
2. **Act** - Execute the method/function under test
3. **Assert** - Verify the result matches expectations

## Variable Naming Conventions

### Standard Names

| Variable   | Usage                           | Description                         |
| ---------- | ------------------------------- | ----------------------------------- |
| `subject`  | The class/function being tested | The main object under test          |
| `input`    | Input parameters                | Data passed to the method           |
| `expected` | Expected result                 | What we expect the method to return |
| `actual`   | Actual result                   | What the method actually returned   |

### Examples

```typescript
// Arrange
const subject = new UserService(mockLogger);
const input = { id: '123', name: 'Alice' };
const expected = 'Hello, Alice!';

// Act
const actual = subject.greet(input);

// Assert
actual.should.equal(expected);
```

## Section Comments

Each section must be explicitly commented:

```typescript
describe('UserService', () => {
  it('should greet user by name', () => {
    // Arrange - object construction, `subject` setup, `input`s, `expected`
    const subject = new UserService(mockLogger);
    const input = { id: '123', name: 'Alice' };
    const expected = 'Hello, Alice!';

    // Act - perform action => actual = subject.method(input)
    const actual = subject.greet(input);

    // Assert - actual.should.deep.equal(expected)
    actual.should.equal(expected);
  });
});
```

## Should Assertions

This project uses `should` style assertions (not `expect` or `assert`).

### Basic Assertions

```typescript
import should from 'should';

// Equality
actual.should.equal(expected);
actual.should.eql(expected); // deep equality

// Boolean
result.should.be.true();
result.should.be.false();

// Null/undefined
value.should.be.null();
should(value).be.undefined();

// Type checking
value.should.be.String();
value.should.be.Number();
value.should.be.Object();
value.should.be.Array();

// Contains
text.should.containEql('substring');
array.should.containEql(item);

// Negation
result.should.not.equal(expected);
result.should.not.be.null();

// Numbers
count.should.be.above(5);
count.should.be.below(10);
count.should.be.within(1, 10);

// Length (for arrays/strings)
items.should.have.length(3);
```

## Test Structure

### describe Block

```typescript
describe('ClassName', () => {
  // All tests for this class
});
```

### it Block

```typescript
describe('ClassName', () => {
  it('should do something specific', () => {
    // Test code
  });
});
```

### Nested describe

```typescript
describe('UserService', () => {
  describe('greet', () => {
    it('should return greeting with name', () => {
      // Test
    });

    it('should handle empty name', () => {
      // Test
    });
  });
});
```

## Mocking Dependencies

### Simple Mock

```typescript
describe('UserService', () => {
  it('should log greeting', () => {
    // Arrange
    const mockLogger = {
      log: (message: string) => {
        // Do nothing or store for assertion
      },
    };
    const subject = new UserService(mockLogger);
    const input = { id: '1', name: 'Test' };

    // Act
    subject.greet(input);

    // Assert - verify logger was called
    // (in real tests, use a spy library or custom mock)
  });
});
```

### Mock with Return Value

```typescript
describe('DataService', () => {
  it('should fetch and transform data', () => {
    // Arrange
    const mockHttpClient = {
      get: (url: string) => Promise.resolve('{"name": "Test"}'),
    };
    const subject = new DataService(mockHttpClient);
    const input = '/api/user/1';
    const expected = { name: 'Test' };

    // Act
    const actual = await subject.fetch(input);

    // Assert
    actual.should.eql(expected);
  });
});
```

## Async Tests

```typescript
describe('AsyncService', () => {
  it('should fetch data', async () => {
    // Arrange
    const subject = new AsyncService(mockClient);
    const input = '/api/data';
    const expected = { id: '123' };

    // Act
    const actual = await subject.fetch(input);

    // Assert
    actual.should.eql(expected);
  });
});
```

## Testing Error Conditions

### Expected Errors

```typescript
describe('Validator', () => {
  it('should throw on invalid input', () => {
    // Arrange
    const subject = new Validator();
    const input = null;

    // Act & Assert
    ((): void => subject.validate(input)).should.throw('Invalid input');
  });
});
```

### Error Objects

```typescript
describe('Parser', () => {
  it('should return error for invalid JSON', async () => {
    // Arrange
    const subject = new Parser();
    const input = '{invalid json}';
    const expected = new Error('Invalid JSON');

    // Act & Assert
    (async (): Promise<void> => {
      await subject.parse(input);
    }).should.throw(expected);
  });
});
```

## Multiple Assertions

### Group Related Assertions

```typescript
describe('ResultBuilder', () => {
  it('should build complete result', () => {
    // Arrange
    const subject = new ResultBuilder();
    const input = { name: 'Test', count: 5 };

    // Act
    const actual = subject.build(input);

    // Assert - multiple related assertions
    actual.should.have.property('name', 'Test');
    actual.should.have.property('count', 5);
    actual.should.have.property('success', true);
  });
});
```

## Test Data

### Inline Test Data

```typescript
describe('Calculator', () => {
  it('should add numbers', () => {
    // Arrange
    const subject = new Calculator();
    const input = { a: 5, b: 3 };
    const expected = 8;

    // Act
    const actual = subject.add(input.a, input.b);

    // Assert
    actual.should.equal(expected);
  });
});
```

### Test Fixtures

```typescript
// test/fixtures/test-data.ts
export const validUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
};

export const invalidUser = {
  id: '',
  name: '',
  email: 'not-an-email',
};

// test/unit/user-validator.test.ts
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
});
```

## Best Practices

### One Assertion Per Test (Ideally)

```typescript
// ✅ GOOD - Single, clear assertion
describe('Calculator', () => {
  it('should add numbers', () => {
    const subject = new Calculator();
    const actual = subject.add(2, 3);
    actual.should.equal(5);
  });
});

// ❌ BAD - Multiple unrelated assertions
describe('Calculator', () => {
  it('should do math', () => {
    const subject = new Calculator();
    subject.add(2, 3).should.equal(5);
    subject.subtract(5, 3).should.equal(2); // Unrelated!
  });
});
```

### Descriptive Test Names

```typescript
// ✅ GOOD - Descriptive
it("should return greeting with user's name", () => {
  // ...
});

// ❌ BAD - Vague
it('should work', () => {
  // ...
});
```

### Test One Thing

```typescript
// ✅ GOOD - Single behavior
it('should capitalize first letter', () => {
  // ...
});

// ❌ BAD - Testing multiple behaviors
it('should capitalize and trim', () => {
  // ...
});
```
