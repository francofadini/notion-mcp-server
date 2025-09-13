import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CONFIG } from "../config/index.js";
import express, { Request, Response } from 'express';
import cors from 'cors';
export const server = new McpServer(
  {
    name: CONFIG.serverName,
    version: CONFIG.serverVersion,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
    instructions: `
      MCP server for the Notion.
      It is used to create, update and delete Notion entities.
    `,
  }
);

export async function startServer() {
  try {
    const useWeb = process.env.USE_SSE === 'true' || process.env.NODE_ENV === 'production';
    
    if (useWeb) {
      // Create Express app for web deployment
      const app = express();
      const port = parseInt(process.env.PORT || '3000');
      
      app.use(cors());
      app.use(express.json());
      
      // Health check
      app.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', service: CONFIG.serverName });
      });
      
      // MCP capabilities
      app.get('/capabilities', (req: Request, res: Response) => {
        res.json({
          capabilities: {
            tools: {
              notion_pages: {
                description: "Perform various page operations (create, archive, restore, search, update)"
              },
              notion_blocks: {
                description: "Perform various block operations (retrieve, update, delete, append children, batch operations)"
              },
              notion_database: {
                description: "Perform various database operations (create, query, update)"
              },
              notion_comments: {
                description: "Perform various comment operations (get, add to page, add to discussion)"
              },
              notion_users: {
                description: "Perform various user operations (list, get, get bot)"
              }
            },
            resources: {},
            prompts: {}
          },
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: CONFIG.serverName,
            version: CONFIG.serverVersion
          }
        });
      });
      
      // Start HTTP server
      app.listen(port, '0.0.0.0', () => {
        console.log(`${CONFIG.serverName} v${CONFIG.serverVersion} running on HTTP port ${port}`);
      });
      
      // Still connect stdio transport for MCP protocol
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } else {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log(
        `${CONFIG.serverName} v${CONFIG.serverVersion} running on stdio`
      );
    }
  } catch (error) {
    console.error(
      "Server initialization error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
