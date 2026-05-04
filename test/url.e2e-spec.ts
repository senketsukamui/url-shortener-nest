import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UrlController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.url.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /url/shorten should create a short URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'https://example.com/articles/1' })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      shortUrl: expect.any(String),
      longUrl: 'https://example.com/articles/1',
      clicks: 0,
      userId: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(response.body.shortUrl).toHaveLength(6);
  });

  it('POST /url/shorten should reject invalid URLs', async () => {
    await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'not-a-url' })
      .expect(400);
  });

  it('POST /url/shorten should reject requests with extra fields', async () => {
    await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'https://example.com', extra: 'not allowed' })
      .expect(400);
  });

  it('GET /url should list all shortened URLs', async () => {
    const createdUrl = await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'https://example.com' })
      .expect(201);

    const response = await request(app.getHttpServer()).get('/url').expect(200);

    expect(response.body).toEqual([createdUrl.body]);
  });

  it('GET /url/:id should redirect to the original URL', async () => {
    const createdUrl = await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'https://example.com/docs' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/url/${createdUrl.body.shortUrl}`)
      .expect(302)
      .expect('Location', 'https://example.com/docs');
  });

  it('GET /url/:id should return 404 when the short URL does not exist', async () => {
    await request(app.getHttpServer()).get('/url/missing').expect(404);
  });
});
