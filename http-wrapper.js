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

// MCP endpoint
app.post('/mcp', (req, res) => {
  const mcpProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  let responseData = '';
  let errorData = '';

  // Send request to MCP server
  mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
  mcpProcess.stdin.end();

  // Collect response
  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  mcpProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const response = JSON.parse(responseData);
        res.json(response);
      } catch (e) {
        res.status(500).json({ error: 'Invalid response from MCP server' });
      }
    } else {
      res.status(500).json({ error: errorData || 'MCP server error' });
    }
  });

  mcpProcess.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`MCP HTTP wrapper running on port ${port}`);
});
