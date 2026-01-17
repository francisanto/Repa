import { z } from 'zod';
import { insertStudentSchema, insertEventSchema, insertRegistrationSchema, students, events, registrations, timetables } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      input: z.object({
        search: z.string().optional(),
        batch: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: insertStudentSchema,
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/students/:id',
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/students/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    bulkCreate: {
        method: 'POST' as const,
        path: '/api/students/bulk',
        input: z.array(insertStudentSchema),
        responses: {
            201: z.array(z.custom<typeof students.$inferSelect>()),
            400: errorSchemas.validation,
        }
    },
    importFromGoogleSheets: {
        method: 'POST' as const,
        path: '/api/students/import-sheets',
        input: z.object({
            sheetUrl: z.string().url(),
            sheetName: z.string().optional(),
        }),
        responses: {
            201: z.object({
                imported: z.number(),
                students: z.array(z.custom<typeof students.$inferSelect>()),
            }),
            400: errorSchemas.validation,
        }
    },
    importFromImage: {
        method: 'POST' as const,
        path: '/api/students/import-image',
        input: z.object({
            image: z.string(), // Base64 image
            batch: z.string().optional(),
        }),
        responses: {
            201: z.object({
                imported: z.number(),
                students: z.array(z.custom<typeof students.$inferSelect>()),
            }),
            400: errorSchemas.validation,
        }
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  registrations: {
    create: {
      method: 'POST' as const,
      path: '/api/registrations',
      input: z.object({
        eventId: z.number(),
        studentName: z.string(), // For fuzzy matching
        orderId: z.string().optional(),
        paymentId: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof registrations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound, // Student not found
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/registrations',
        input: z.object({
            eventId: z.number().optional()
        }).optional(),
        responses: {
            200: z.array(z.custom<typeof registrations.$inferSelect>()),
        }
    }
  },
  timetables: {
      list: {
          method: 'GET' as const,
          path: '/api/timetables',
          responses: {
              200: z.array(z.custom<typeof timetables.$inferSelect>()),
          }
      },
      upload: {
          method: 'POST' as const,
          path: '/api/timetables/upload',
          input: z.object({
              batch: z.string(),
              image: z.string(), // Base64
          }),
          responses: {
              201: z.custom<typeof timetables.$inferSelect>(),
              500: errorSchemas.internal
          }
      }
  }
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
