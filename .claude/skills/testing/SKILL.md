---
name: testing
description: Testing conventions for unit and integration tests. Use when writing tests, reviewing test code, or working with mocks/spies.
invocation:
  - test
  - testing
---

# Testing Conventions

## Overview

All tests in this project follow the strict Arrange-Act-Assert (AAA) pattern for consistency and readability, with proper use of spies and mocks for side effects.

## When to Use

- Writing any unit test or integration test
- Reviewing test code for consistency
- Creating test templates or examples
- Testing interfaces with side effects (logging, I/O, etc.)

## Instructions

### Step 1: Arrange Section

Set up the test by:

- Constructing the subject (class under test) with mocked dependencies
- Defining input values
- Defining expected results
- Use variable names: `subject`, `input`, `expected`

### Step 2: Act Section

Perform a single action:

- Call one method on the subject
- Capture the result as `actual`
- Use format: `const actual = subject.method(input);`

### Step 3: Assert Section

Verify the result:

- Compare `actual` to `expected`
- Use should-style assertions: `actual.should.eql(expected)`
- Assert on meaningful values, not implementation details

## Format Template

```typescript
describe("Service/Class", () => {
  it("should do something specific", () => {
    // Arrange - object construction, `subject` setup, `input`s, `expected`
    const subject = new Service(mockDep);
    const input = { ... };
    const expected = { ... };

    // Act - perform action => actual = subject.method(input)
    const actual = subject.method(input);

    // Assert - actual.should.deep.equal(expected)
    actual.should.eql(expected);
  });
});
```

## Assertion Style

This project uses `should` assertions (not `expect`):

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

// Contains
text.should.containEql('substring');

// Negation
result.should.not.equal(expected);
result.should.not.be.null();
```

## Key Rules

1. **Always** comment each section with `// Arrange`, `// Act`, `// Assert`
2. Use `subject` for the class/function under test
3. Use `input` for input parameters
4. Use `expected` for expected results
5. Use `actual` for the result of the method call
6. Prefer `should.eql()` for deep equality
7. Use `should(value).be.null()` for null checks (value might be null)

## Spies and Mocks for Side Effects

When testing interfaces with side effects (like `console.log`, file I/O, network calls), use **spies** or **mocks**.

### Spies (Collect and Assert)

Use spies when you want to **verify what was called** without changing behavior:

```typescript
describe('LoggingService', () => {
  it('should log formatted message', () => {
    // Arrange - create spy that collects calls
    const logs: string[] = [];
    const spyLogger: ILogger = {
      log: (message: string) => {
        logs.push(message); // Collect the call
      },
    };
    const subject = new LoggingService(spyLogger);
    const input = { level: 'info', message: 'Hello' };
    const expectedLogs = ['[INFO] Hello'];

    // Act
    subject.logFormatted(input);

    // Assert - verify the collected calls
    logs.should.eql(expectedLogs);
  });
});
```

### Mocks (Verify Arguments)

Use mocks when you want to **verify the correct arguments were passed**:

```typescript
describe('NotificationService', () => {
  it('should send notification with correct payload', () => {
    // Arrange - create mock that captures arguments
    let capturedPayload: any = null;
    const mockSender: ISender = {
      send: (payload: any) => {
        capturedPayload = payload; // Capture the argument
        return Promise.resolve();
      },
    };
    const subject = new NotificationService(mockSender);
    const input = { userId: '123', message: 'Hello' };
    const expectedPayload = {
      to: '123',
      body: 'Hello',
      timestamp: expect.any(Number),
    };

    // Act
    await subject.notify(input);

    // Assert - verify the captured argument
    capturedPayload.should.have.property('to', '123');
    capturedPayload.should.have.property('body', 'Hello');
    capturedPayload.should.have.property('timestamp');
  });
});
```

### Multiple Calls

When a method is called multiple times, collect all calls:

```typescript
describe('BatchProcessor', () => {
  it('should process each item', () => {
    // Arrange - collect all calls
    const processedItems: string[] = [];
    const mockProcessor: IProcessor = {
      process: (item: string) => {
        processedItems.push(item);
      },
    };
    const subject = new BatchProcessor(mockProcessor);
    const input = ['a', 'b', 'c'];
    const expectedCalls = ['a', 'b', 'c'];

    // Act
    subject.processAll(input);

    // Assert - verify all calls in order
    processedItems.should.eql(expectedCalls);
  });
});
```

### Call Count

Verify how many times a method was called:

```typescript
describe('RetryService', () => {
  it('should retry 3 times on failure', async () => {
    // Arrange - count calls
    let callCount = 0;
    const mockClient: IClient = {
      fetch: () => {
        callCount++;
        throw new Error('Network error');
      },
    };
    const subject = new RetryService(mockClient, { maxRetries: 3 });
    const input = '/api/data';

    // Act
    try {
      await subject.fetchWithRetry(input);
    } catch (e) {
      // Expected to throw
    }

    // Assert - verify call count
    callCount.should.equal(3);
  });
});
```

### Spy Pattern Summary

| Pattern              | Use Case                    | Implementation                          |
| -------------------- | --------------------------- | --------------------------------------- |
| **Collect calls**    | Verify what was logged/sent | `calls.push(arg)` then assert `calls`   |
| **Capture argument** | Verify payload structure    | `captured = arg` then assert `captured` |
| **Count calls**      | Verify retry/loop behavior  | `count++` then assert `count`           |
| **Return value**     | Stub dependency response    | `return mockValue`                      |

## Parameterized Tests with Triangulation

**Tests MUST use parameterization to prove code works for multiple values (triangulation).**

Each test case should appear as a separate `it` block with indexed naming:

```typescript
// ✅ CORRECT - Parameterized tests with triangulation
describe('TaskService', () => {
  describe('getStatus', () => {
    const cases = [
      { input: { status: 'pending' }, expected: 'Pending' },
      { input: { status: 'running' }, expected: 'Running' },
      { input: { status: 'completed' }, expected: 'Completed' },
    ];

    cases.forEach((testCase, index) => {
      it(`should return formatted status (${index + 1})`, () => {
        // Arrange
        const subject = new TaskService(mockDeps);
        const { input, expected } = testCase;

        // Act
        const actual = subject.getStatus(input);

        // Assert
        actual.should.equal(expected);
      });
    });
  });
});
```

**Test output will show:**

```
TaskService
  getStatus
    ✓ should return formatted status (1)
    ✓ should return formatted status (2)
    ✓ should return formatted status (3)
```

**Why triangulation matters:**

- Single test case might pass by accident
- Multiple cases prove the logic is correct
- Each case visible in test output
- Easy to add new edge cases
