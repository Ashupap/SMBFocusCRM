import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API Documentation',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the CRM platform',
      contact: {
        name: 'API Support',
        email: 'support@crm.example.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Contact: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'ownerId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            title: { type: 'string', nullable: true },
            company: { type: 'string', nullable: true },
            companyId: { type: 'string', format: 'uuid', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          required: ['name', 'ownerId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            industry: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Deal: {
          type: 'object',
          required: ['title', 'value', 'stage', 'ownerId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            value: { type: 'number', format: 'decimal' },
            stage: { type: 'string', enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'] },
            probability: { type: 'integer', minimum: 0, maximum: 100 },
            expectedCloseDate: { type: 'string', format: 'date-time', nullable: true },
            actualCloseDate: { type: 'string', format: 'date-time', nullable: true },
            contactId: { type: 'string', format: 'uuid', nullable: true },
            companyId: { type: 'string', format: 'uuid', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Activity: {
          type: 'object',
          required: ['type', 'subject', 'ownerId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['call', 'email', 'meeting', 'task', 'note'] },
            subject: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'completed'], default: 'pending' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            completedDate: { type: 'string', format: 'date-time', nullable: true },
            contactId: { type: 'string', format: 'uuid', nullable: true },
            dealId: { type: 'string', format: 'uuid', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        EmailCampaign: {
          type: 'object',
          required: ['name', 'subject', 'content', 'ownerId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            subject: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'sent'], default: 'draft' },
            scheduledDate: { type: 'string', format: 'date-time', nullable: true },
            sentDate: { type: 'string', format: 'date-time', nullable: true },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Contacts', description: 'Contact management endpoints' },
      { name: 'Companies', description: 'Company management endpoints' },
      { name: 'Deals', description: 'Deal management endpoints' },
      { name: 'Activities', description: 'Activity management endpoints' },
      { name: 'Campaigns', description: 'Email campaign endpoints' },
      { name: 'Analytics', description: 'Analytics and reporting endpoints' },
      { name: 'Import/Export', description: 'Data import and export endpoints' },
      { name: 'AI', description: 'AI-powered features' },
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate user and receive JWT tokens',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      refresh_token: { type: 'string' },
                      user: { type: 'object' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/contacts': {
        get: {
          tags: ['Contacts'],
          summary: 'Get all contacts',
          description: 'Retrieve all contacts for the authenticated user',
          responses: {
            200: {
              description: 'List of contacts',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Contact' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Contacts'],
          summary: 'Create contact',
          description: 'Create a new contact',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contact' },
              },
            },
          },
          responses: {
            201: {
              description: 'Contact created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Contact' },
                },
              },
            },
          },
        },
      },
      '/deals': {
        get: {
          tags: ['Deals'],
          summary: 'Get all deals',
          description: 'Retrieve all deals for the authenticated user',
          responses: {
            200: {
              description: 'List of deals',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Deal' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Deals'],
          summary: 'Create deal',
          description: 'Create a new deal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Deal' },
              },
            },
          },
          responses: {
            201: {
              description: 'Deal created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Deal' },
                },
              },
            },
          },
        },
      },
      '/analytics/pipeline-conversion': {
        get: {
          tags: ['Analytics'],
          summary: 'Get pipeline conversion rates',
          description: 'Calculate conversion rates between pipeline stages',
          parameters: [
            {
              in: 'query',
              name: 'startDate',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter from date',
            },
            {
              in: 'query',
              name: 'endDate',
              schema: { type: 'string', format: 'date-time' },
              description: 'Filter to date',
            },
          ],
          responses: {
            200: {
              description: 'Conversion data',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        stage: { type: 'string' },
                        count: { type: 'integer' },
                        conversionRate: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/import/parse': {
        post: {
          tags: ['Import/Export'],
          summary: 'Parse import file',
          description: 'Parse CSV or Excel file for import',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'File parsed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      headers: { type: 'array', items: { type: 'string' } },
                      preview: { type: 'array' },
                      totalRows: { type: 'integer' },
                      data: { type: 'array' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ai/generate': {
        post: {
          tags: ['AI'],
          summary: 'Generate AI content',
          description: 'Generate content using AI (email templates, insights, etc.)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'input'],
                  properties: {
                    type: { type: 'string', enum: ['email', 'insight', 'recommendation'] },
                    input: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'AI generated content',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      content: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
