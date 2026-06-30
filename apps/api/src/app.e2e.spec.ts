import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobStatus, UrlStatus } from '@url-checker/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { configureApp } from './common/configure-app.js';
import {
  CLOCK,
  DELAY_PROVIDER,
  HTTP_CHECKER,
  RANDOM_PROVIDER,
} from './config/tokens.js';
import type {
  Clock,
  DelayProvider,
  HttpChecker,
  RandomProvider,
} from './domain/index.js';

class TestClock implements Clock {
  private nowValue = new Date('2026-01-01T00:00:00.000Z');

  public now(): Date {
    return new Date(this.nowValue);
  }

  public advance(ms: number): void {
    this.nowValue = new Date(this.nowValue.getTime() + ms);
  }
}

describe('App e2e', () => {
  async function createApp(options?: {
    httpChecker?: HttpChecker;
    delayProvider?: DelayProvider;
    randomProvider?: RandomProvider;
    clock?: TestClock;
  }): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HTTP_CHECKER)
      .useValue(
        options?.httpChecker ?? {
          check: async () => ({ statusCode: 204 }),
        },
      )
      .overrideProvider(DELAY_PROVIDER)
      .useValue(
        options?.delayProvider ?? {
          wait: async () => undefined,
        },
      )
      .overrideProvider(RANDOM_PROVIDER)
      .useValue(
        options?.randomProvider ?? {
          nextInt: () => 0,
        },
      )
      .overrideProvider(CLOCK)
      .useValue(options?.clock ?? new TestClock())
      .compile();

    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    return app;
  }

  it('creates a job and returns it in list/details', async () => {
    const clock = new TestClock();
    const app = await createApp({
      clock,
      httpChecker: {
        check: async () => {
          clock.advance(25);
          return { statusCode: 200 };
        },
      },
      delayProvider: {
        wait: async (durationMs) => {
          clock.advance(durationMs);
        },
      },
      randomProvider: {
        nextInt: () => 10,
      },
    });

    try {
      const createResponse = await request(app.getHttpServer())
        .post('/api/jobs')
        .send({ urls: ['https://example.com', 'https://example.com'] })
        .expect(201);

      expect(createResponse.body.jobId).toEqual(expect.any(String));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const listResponse = await request(app.getHttpServer())
        .get('/api/jobs')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        id: createResponse.body.jobId,
        status: JobStatus.completed,
        total: 1,
        successCount: 1,
        errorCount: 0,
      });

      const detailsResponse = await request(app.getHttpServer())
        .get(`/api/jobs/${createResponse.body.jobId}`)
        .expect(200);

      expect(detailsResponse.body.status).toBe(JobStatus.completed);
      expect(detailsResponse.body.results).toEqual([
        expect.objectContaining({
          url: 'https://example.com',
          status: UrlStatus.success,
          httpStatus: 200,
          durationMs: 35,
        }),
      ]);
    } finally {
      await app.close();
    }
  });

  it('cancels an in-flight job', async () => {
    let rejectRequest: ((reason?: unknown) => void) | null = null;
    const app = await createApp({
      httpChecker: {
        check: async (_url, signal) => {
          return await new Promise((_resolve, reject) => {
            rejectRequest = reject;
            signal.addEventListener(
              'abort',
              () => reject(new Error('Aborted')),
              {
                once: true,
              },
            );
          });
        },
      },
    });

    try {
      const createResponse = await request(app.getHttpServer())
        .post('/api/jobs')
        .send({
          urls: [
            'https://one.test',
            'https://two.test',
            'https://three.test',
            'https://four.test',
            'https://five.test',
            'https://six.test',
          ],
        })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 0));

      await request(app.getHttpServer())
        .delete(`/api/jobs/${createResponse.body.jobId}`)
        .expect(204);

      if (rejectRequest !== null) {
        (rejectRequest as (reason?: unknown) => void)(new Error('Aborted'));
      }
      await new Promise((resolve) => setTimeout(resolve, 0));

      const detailsResponse = await request(app.getHttpServer())
        .get(`/api/jobs/${createResponse.body.jobId}`)
        .expect(200);

      expect(detailsResponse.body.status).toBe(JobStatus.cancelled);
      expect(
        detailsResponse.body.results.every(
          (result: { status: UrlStatus }) =>
            result.status === UrlStatus.cancelled,
        ),
      ).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('returns validation errors for invalid urls', async () => {
    const app = await createApp();

    try {
      const response = await request(app.getHttpServer())
        .post('/api/jobs')
        .send({ urls: ['not-a-url'] })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(expect.any(Array));
    } finally {
      await app.close();
    }
  });

  it('returns 404 for missing jobs', async () => {
    const app = await createApp();

    try {
      await request(app.getHttpServer()).get('/api/jobs/missing').expect(404);
      await request(app.getHttpServer())
        .delete('/api/jobs/missing')
        .expect(404);
    } finally {
      await app.close();
    }
  });

  it('responds to health checks', async () => {
    const app = await createApp();

    try {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      expect(response.body).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
