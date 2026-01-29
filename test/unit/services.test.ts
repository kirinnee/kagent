/**
 * Unit tests for src/lib/services.ts
 * Tests only pure code with mocked dependencies
 * Target: 100% coverage of src/lib/
 */

import { describe, it } from 'bun:test';
import should from 'should';
import { CliApplication, ConfigService } from '../../src/lib/services.ts';
import { MemoryEnvironment, MemoryFileSystem, MockProcess, SilentConsole } from '../fixtures/index.ts';

describe('CliApplication', () => {
  describe('getGreeting', () => {
    it('should return formatted greeting with name, version, and description', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const config = {
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI tool',
      };
      const expected = 'test-cli v1.0.0 - A test CLI tool';

      // Act
      const result = app.getGreeting(config);

      // Assert
      result.should.equal(expected);
    });
  });

  describe('processCommand', () => {
    it('should return hello output for hello command', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const input = { args: ['hello'], options: {} };
      const config = {
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI tool',
      };

      // Act
      const result = app.processCommand(input, config);

      // Assert
      result.exitCode.should.equal(0);
      result.stdout.should.equal('Hello, World!');
      result.stderr.should.equal('');
    });

    it('should return version output for version command', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const input = { args: ['version'], options: {} };
      const config = {
        name: 'test-cli',
        version: '2.0.0',
        description: 'A test CLI tool',
      };

      // Act
      const result = app.processCommand(input, config);

      // Assert
      result.exitCode.should.equal(0);
      result.stdout.should.equal('test-cli version 2.0.0');
      result.stderr.should.equal('');
    });

    it('should return help output for help command', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const input = { args: ['help'], options: {} };
      const config = {
        name: 'mycli',
        version: '1.0.0',
        description: 'My CLI tool',
      };

      // Act
      const result = app.processCommand(input, config);

      // Assert
      result.exitCode.should.equal(0);
      result.stdout.should.containEql('mycli v1.0.0');
      result.stdout.should.containEql('My CLI tool');
      result.stdout.should.containEql('hello');
      result.stdout.should.containEql('version');
      result.stderr.should.equal('');
    });

    it('should return error for unknown command', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const input = { args: ['unknown'], options: {} };
      const config = {
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI tool',
      };

      // Act
      const result = app.processCommand(input, config);

      // Assert
      result.exitCode.should.equal(1);
      result.stdout.should.equal('');
      result.stderr.should.equal('Unknown command: unknown');
    });

    it('should default to help command when no args provided', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const input = { args: [], options: {} };
      const config = {
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI tool',
      };

      // Act
      const result = app.processCommand(input, config);

      // Assert
      result.exitCode.should.equal(0);
      result.stdout.should.containEql('test-cli v1.0.0');
    });
  });

  describe('formatOutput', () => {
    it('should return stdout when not verbose', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const output = { exitCode: 0, stdout: 'Success', stderr: 'Debug info' };
      const options = { verbose: false };
      const expected = 'Success';

      // Act
      const result = app.formatOutput(output, options);

      // Assert
      result.should.equal(expected);
    });

    it('should include stderr in verbose mode', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const output = { exitCode: 0, stdout: 'Success', stderr: 'Debug info' };
      const options = { verbose: true };

      // Act
      const result = app.formatOutput(output, options);

      // Assert
      result.should.containEql('[DEBUG] stderr: Debug info');
      result.should.containEql('Success');
    });

    it('should return only stdout when stderr is empty', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const output = { exitCode: 0, stdout: 'Success', stderr: '' };
      const options = { verbose: true };
      const expected = 'Success';

      // Act
      const result = app.formatOutput(output, options);

      // Assert
      result.should.equal(expected);
    });
  });

  describe('getHelpText', () => {
    it('should return formatted help text with config details', () => {
      // Arrange
      const console = new SilentConsole();
      const fs = new MemoryFileSystem();
      const env = new MemoryEnvironment();
      const process = new MockProcess();
      const app = new CliApplication(console, fs, env, process);
      const config = {
        name: 'myapp',
        version: '3.0.0',
        description: 'My application',
      };

      // Act
      const result = app.getHelpText(config);

      // Assert
      result.should.containEql('myapp v3.0.0');
      result.should.containEql('My application');
      result.should.containEql('hello');
      result.should.containEql('version');
    });
  });
});

describe('ConfigService', () => {
  describe('parseConfig', () => {
    it('should parse valid JSON config', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);
      const content = '{"name":"cli","version":"1.0.0","description":"Test"}';
      const expected = {
        name: 'cli',
        version: '1.0.0',
        description: 'Test',
      };

      // Act
      const result = service.parseConfig(content);

      // Assert
      should(result).not.be.null();
      if (result !== null) {
        result.should.eql(expected);
      }
    });

    it('should return null for invalid JSON', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);
      const content = 'not valid json';

      // Act
      const result = service.parseConfig(content);

      // Assert
      should(result).be.null();
    });

    it('should return null for incomplete config', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);
      const content = '{"name":"cli"}';

      // Act
      const result = service.parseConfig(content);

      // Assert
      should(result).be.null();
    });

    it('should return null for malformed JSON', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);
      const content = '{"name":"cli", version: "1.0.0"}'; // missing quotes

      // Act
      const result = service.parseConfig(content);

      // Assert
      should(result).be.null();
    });
  });

  describe('isValidConfig', () => {
    it('should return true for valid config', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);
      const config = {
        name: 'cli',
        version: '1.0.0',
        description: 'Test',
      };

      // Act
      const result = service.isValidConfig(config);

      // Assert
      result.should.be.true();
    });

    it('should return false for null', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig(null);

      // Assert
      result.should.be.false();
    });

    it('should return false for non-object', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig('string');

      // Assert
      result.should.be.false();
    });

    it('should return false for array', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig(['item']);

      // Assert
      result.should.be.false();
    });

    it('should return false when missing required fields', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig({ name: 'cli' });

      // Assert
      result.should.be.false();
    });

    it('should return false when name is not a string', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig({
        name: 123,
        version: '1.0.0',
        description: 'test',
      });

      // Assert
      result.should.be.false();
    });

    it('should return false when version is not a string', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.isValidConfig({
        name: 'cli',
        version: null,
        description: 'test',
      });

      // Assert
      result.should.be.false();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config structure', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result = service.getDefaultConfig();

      // Assert
      result.name.should.equal('kagent');
      result.version.should.equal('0.1.0');
      result.description.should.equal('Bun CLI Framework with OOP Architecture');
    });

    it('should return same config object on multiple calls', () => {
      // Arrange
      const fs = new MemoryFileSystem();
      const service = new ConfigService(fs);

      // Act
      const result1 = service.getDefaultConfig();
      const result2 = service.getDefaultConfig();

      // Assert - should be equivalent but not necessarily same reference
      result1.should.eql(result2);
    });
  });
});
