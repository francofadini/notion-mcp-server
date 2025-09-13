#!/usr/bin/env node

import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notion-mcp-server' });
});

// SSE endpoint for MCP
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const mcpProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  // Forward data from MCP server to SSE client
  mcpProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      res.write(`data: ${line}\n\n`);
    });
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
  });

  mcpProcess.on('close', () => {
    res.write('event: close\ndata: {}\n\n');
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    mcpProcess.kill();
  });
});

// POST endpoint for sending messages to MCP
app.post('/message', (req, res) => {
  // This would need to be implemented to send messages to the MCP process
  res.json({ status: 'received' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`MCP HTTP wrapper running on port ${port}`);
});
