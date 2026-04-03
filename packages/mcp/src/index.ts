#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { AnalyzeInputSchema, handleAnalyzeProject } from './tools/analyze.js';
import { GenerateInputSchema, handleGenerateTests } from './tools/generate.js';
import { RunInputSchema, handleRunTests } from './tools/run.js';
import { ClassifyInputSchema, handleClassifyFailures } from './tools/classify.js';
import { FixInputSchema, handleGetFixes } from './tools/fix.js';

export { runLoop } from './loop.js';
export type { LoopOptions, LoopResult } from './loop.js';

const server = new Server(
  { name: 'kairo', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'analyze_project',
      description: 'Analyze a project directory to detect stack, routes, endpoints, and auth strategy',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: { type: 'string', description: 'Absolute path to the project' },
        },
        required: ['projectPath'],
      },
    },
    {
      name: 'generate_tests',
      description: 'Generate Playwright test files from analyzer output',
      inputSchema: {
        type: 'object',
        properties: {
          analyzerResult: { type: 'object', description: 'Output from analyze_project' },
          targetUrl: { type: 'string', description: 'Base URL of the running application' },
        },
        required: ['analyzerResult', 'targetUrl'],
      },
    },
    {
      name: 'run_tests',
      description: 'Run Playwright tests with double-run for flakiness detection',
      inputSchema: {
        type: 'object',
        properties: {
          specFiles: { type: 'array', items: { type: 'string' }, description: 'Paths to spec files' },
          targetUrl: { type: 'string', description: 'Base URL of the running application' },
        },
        required: ['specFiles', 'targetUrl'],
      },
    },
    {
      name: 'classify_failures',
      description: 'Classify test failures into bug/flaky/env/security categories',
      inputSchema: {
        type: 'object',
        properties: {
          run1: { type: 'array', items: { type: 'object' }, description: 'First run results' },
          run2: { type: 'array', items: { type: 'object' }, description: 'Re-run results' },
        },
        required: ['run1', 'run2'],
      },
    },
    {
      name: 'get_fixes',
      description: 'Get fix recommendations for classified failures (excludes flaky/env)',
      inputSchema: {
        type: 'object',
        properties: {
          failures: { type: 'array', items: { type: 'object' }, description: 'Classified failures' },
        },
        required: ['failures'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'analyze_project': {
        const input = AnalyzeInputSchema.parse(args);
        result = await handleAnalyzeProject(input);
        break;
      }
      case 'generate_tests': {
        const input = GenerateInputSchema.parse(args);
        result = await handleGenerateTests(input);
        break;
      }
      case 'run_tests': {
        const input = RunInputSchema.parse(args);
        result = await handleRunTests(input);
        break;
      }
      case 'classify_failures': {
        const input = ClassifyInputSchema.parse(args);
        result = await handleClassifyFailures(input);
        break;
      }
      case 'get_fixes': {
        const input = FixInputSchema.parse(args);
        result = await handleGetFixes(input);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: unknown) {
    const message = err instanceof z.ZodError
      ? `Validation error: ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Kairo MCP server started\n');
}

main().catch((err: unknown) => {
  process.stderr.write(`Fatal error: ${String(err)}\n`);
  process.exit(1);
});
