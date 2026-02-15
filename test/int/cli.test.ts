/**
 * Integration tests for CLI
 * End-to-end tests with real dependencies
 * Target: 80%+ overall coverage
 */

import { beforeAll, describe, it } from 'bun:test';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import should from 'should';

describe('CLI Integration Tests', () => {
  describe('build', () => {
    it('should build the binary successfully', () => {
      // Arrange & Act
      const output = execSync('bun build --compile --outfile dist/kagent src/cli.ts', { encoding: 'utf-8' });

      // Assert
      existsSync('./dist/kagent').should.be.true();
    });
  });

  describe('CLI Commands', () => {
    beforeAll(() => {
      // Build the CLI before running integration tests
      execSync('bun build --compile --outfile dist/kagent src/cli.ts', { encoding: 'utf-8' });
    });

    it('should run hello command', () => {
      // Arrange
      const cmd = 'bun run src/cli.ts hello';

      // Act
      const output = execSync(cmd, { encoding: 'utf-8' });

      // Assert
      output.should.containEql('Hello');
    });

    it('should run version command', () => {
      // Arrange
      const cmd = 'bun run src/cli.ts version';

      // Act
      const output = execSync(cmd, { encoding: 'utf-8' });

      // Assert
      output.should.containEql('version');
    });

    it('should show help with no args', () => {
      // Arrange
      const cmd = 'bun run src/cli.ts --help';

      // Act
      const output = execSync(cmd, { encoding: 'utf-8' });

      // Assert
      output.should.containEql('hello');
      output.should.containEql('version');
    });

    it('should accept --verbose flag', () => {
      // Arrange
      const cmd = 'bun run src/cli.ts hello --verbose';

      // Act
      const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

      // Assert - command should execute without error
      should(output).not.be.undefined();
    });
  });

  describe('FileSystem', () => {
    it('should write and read files via Bun', async () => {
      // Arrange
      const testFile = '/tmp/test-kagent-write.txt';
      const content = 'Test content';

      // Act
      await Bun.write(testFile, content);
      const readContent = await Bun.file(testFile).text();

      // Assert
      readContent.should.equal(content);

      // Cleanup - use rm command instead of Bun.remove
      execSync(`rm -f ${testFile}`);
    });
  });

  describe('Config Loading', () => {
    it('should load default config when no config file exists', async () => {
      // Arrange
      const { CliApplication, ConfigService } = await import('../../src/lib/index.ts');
      const { FileSystemAdapter, ConsoleAdapter, EnvironmentAdapter } = await import('../../src/adapters/index.ts');
      const processAdapter = {
        exit: (code: number) => {
          throw new Error(`exit ${code}`);
        },
        cwd: () => '/test',
        chdir: () => {},
      };

      // Act
      const fs = new FileSystemAdapter();
      const consoleAdapter = new ConsoleAdapter();
      const env = new EnvironmentAdapter();
      const app = new CliApplication(consoleAdapter, fs, env, processAdapter);
      const configService = new ConfigService(fs);
      const config = configService.getDefaultConfig();

      // Assert
      config.name.should.equal('kagent');
      config.version.should.equal('0.1.0');
    });

    it('should parse valid config from file', async () => {
      // Arrange
      const { ConfigService } = await import('../../src/lib/index.ts');
      const { FileSystemAdapter } = await import('../../src/adapters/index.ts');
      const fs = new FileSystemAdapter();
      const service = new ConfigService(fs);
      const testConfigFile = '/tmp/test-kagent-config.json';
      const validConfig = JSON.stringify({
        name: 'test-cli',
        version: '2.0.0',
        description: 'Test description',
      });

      // Act
      await Bun.write(testConfigFile, validConfig);
      const content = await fs.readFile(testConfigFile);
      const parsed = service.parseConfig(content);

      // Assert
      should(parsed).not.be.null();
      if (parsed !== null) {
        parsed.name.should.equal('test-cli');
        parsed.version.should.equal('2.0.0');
      }

      // Cleanup
      execSync(`rm -f ${testConfigFile}`);
    });

    it('should get greeting from app', async () => {
      // Arrange
      const { CliApplication, ConfigService } = await import('../../src/lib/index.ts');
      const { FileSystemAdapter, ConsoleAdapter, EnvironmentAdapter } = await import('../../src/adapters/index.ts');
      const processAdapter = {
        exit: (code: number) => {
          throw new Error(`exit ${code}`);
        },
        cwd: () => '/test',
        chdir: () => {},
      };

      // Act
      const fs = new FileSystemAdapter();
      const consoleAdapter = new ConsoleAdapter();
      const env = new EnvironmentAdapter();
      const app = new CliApplication(consoleAdapter, fs, env, processAdapter);
      const config = {
        name: 'test-app',
        version: '1.5.0',
        description: 'Test App Description',
      };
      const greeting = app.getGreeting(config);

      // Assert
      greeting.should.equal('test-app v1.5.0 - Test App Description');
    });

    it('should process commands via app', async () => {
      // Arrange
      const { CliApplication } = await import('../../src/lib/index.ts');
      const { FileSystemAdapter, ConsoleAdapter, EnvironmentAdapter } = await import('../../src/adapters/index.ts');
      const processAdapter = {
        exit: (code: number) => {
          throw new Error(`exit ${code}`);
        },
        cwd: () => '/test',
        chdir: () => {},
      };

      // Act
      const fs = new FileSystemAdapter();
      const consoleAdapter = new ConsoleAdapter();
      const env = new EnvironmentAdapter();
      const app = new CliApplication(consoleAdapter, fs, env, processAdapter);
      const config = { name: 'test', version: '1.0.0', description: 'Test' };

      const helloResult = app.processCommand({ args: ['hello'], options: {} }, config);
      const versionResult = app.processCommand({ args: ['version'], options: {} }, config);
      const helpResult = app.processCommand({ args: ['help'], options: {} }, config);

      // Assert
      helloResult.exitCode.should.equal(0);
      helloResult.stdout.should.equal('Hello, World!');
      versionResult.stdout.should.containEql('test version 1.0.0');
      helpResult.stdout.should.containEql('test v1.0.0');
    });

    it('should format output correctly', async () => {
      // Arrange
      const { CliApplication } = await import('../../src/lib/index.ts');
      const { FileSystemAdapter, ConsoleAdapter, EnvironmentAdapter } = await import('../../src/adapters/index.ts');
      const processAdapter = {
        exit: (code: number) => {
          throw new Error(`exit ${code}`);
        },
        cwd: () => '/test',
        chdir: () => {},
      };

      // Act
      const fs = new FileSystemAdapter();
      const consoleAdapter = new ConsoleAdapter();
      const env = new EnvironmentAdapter();
      const app = new CliApplication(consoleAdapter, fs, env, processAdapter);
      const output = { exitCode: 0, stdout: 'Success', stderr: 'Debug info' };

      const normalOutput = app.formatOutput(output, { verbose: false });
      const verboseOutput = app.formatOutput(output, { verbose: true });

      // Assert
      normalOutput.should.equal('Success');
      verboseOutput.should.containEql('[DEBUG]');
      verboseOutput.should.containEql('Debug info');
    });
  });

  describe('Adapters', () => {
    it('should use environment adapter', async () => {
      // Arrange
      const { EnvironmentAdapter } = await import('../../src/adapters/index.ts');
      const env = new EnvironmentAdapter();

      // Act
      env.set('TEST_KAGENT_VAR', 'test-value');
      const value = env.get('TEST_KAGENT_VAR');
      const all = env.getAll();

      // Assert
      should(value).equal('test-value');
      (all.TEST_KAGENT_VAR as unknown as string).should.equal('test-value');

      // Cleanup
      process.env.TEST_KAGENT_VAR = undefined;
    });

    it('should use filesystem adapter for all operations', async () => {
      // Arrange
      const { FileSystemAdapter } = await import('../../src/adapters/index.ts');
      const fs = new FileSystemAdapter();
      const testFile = '/tmp/test-kagent-fs-ops.txt';
      const content = 'File content for testing';

      // Act - write
      await fs.writeFile(testFile, content);
      const exists = await fs.exists(testFile);
      const readContent = await fs.readFile(testFile);

      // Assert
      exists.should.be.true();
      readContent.should.equal(content);

      // Act - delete
      await fs.delete(testFile);
      const existsAfter = await fs.exists(testFile);

      // Assert
      existsAfter.should.be.false();
    });

    it('should use console adapter', async () => {
      // Arrange
      const { ConsoleAdapter } = await import('../../src/adapters/index.ts');
      const consoleAdapter = new ConsoleAdapter();

      // Act & Assert - should not throw
      consoleAdapter.log('Test log');
      consoleAdapter.info('Test info');
      consoleAdapter.warn('Test warn');
      consoleAdapter.error('Test error');

      // If we reach here, all methods worked
      true.should.be.true();
    });

    it('should use process adapter methods', async () => {
      // Arrange
      const { ProcessAdapter } = await import('../../src/adapters/index.ts');
      const processAdapter = new ProcessAdapter();

      // Act
      const cwd = processAdapter.cwd();
      const originalDir = cwd;

      // Assert - cwd should return a string
      should(cwd).be.a.String();
      cwd.should.not.equal('');

      // Act - chdir to /tmp and back
      processAdapter.chdir('/tmp');
      const newCwd = processAdapter.cwd();
      processAdapter.chdir(originalDir);

      // Assert - chdir worked
      newCwd.should.containEql('tmp');
    });
  });
});
