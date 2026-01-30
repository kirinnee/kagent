---
name: arrange-act-assert
description: Arrange-Act-Assert test format for unit tests. Use when writing or reviewing tests to ensure consistent AAA pattern.
---

# Arrange-Act-Assert Test Format

## Overview

All tests in this project follow the strict Arrange-Act-Assert (AAA) pattern for consistency and readability.

## When to Use

- Writing any unit test or integration test
- Reviewing test code for consistency
- Creating test templates or examples

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
