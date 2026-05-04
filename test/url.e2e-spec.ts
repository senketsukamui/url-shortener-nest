import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UrlController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function createAccessToken(email = 'user@example.com') {
    const password = 'password123';

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return loginResponse.body.access_token as string;
  }

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
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /url/shorten should reject requests without an access token', async () => {
    await request(app.getHttpServer())
      .post('/url/shorten')
      .send({ url: 'https://example.com/articles/1' })
      .expect(401);
  });

  it('POST /url/shorten should create a short URL for the current user', async () => {
    const accessToken = await createAccessToken();

    const response = await request(app.getHttpServer())
      .post('/url/shorten')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'https://example.com/articles/1' })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      shortUrl: expect.any(String),
      longUrl: 'https://example.com/articles/1',
      clicks: 0,
      userId: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(response.body.shortUrl).toHaveLength(6);
  });

  it('POST /url/shorten should reject invalid URLs', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .post('/url/shorten')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'not-a-url' })
      .expect(400);
  });

  it('POST /url/shorten should reject requests with extra fields', async () => {
    const accessToken = await createAccessToken();

    await request(app.getHttpServer())
      .post('/url/shorten')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'https://example.com', extra: 'not allowed' })
      .expect(400);
  });

  it('GET /url should list all shortened URLs', async () => {
    const accessToken = await createAccessToken();

    const createdUrl = await request(app.getHttpServer())
      .post('/url/shorten')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'https://example.com' })
      .expect(201);

    const response = await request(app.getHttpServer()).get('/url').expect(200);

    expect(response.body).toEqual([createdUrl.body]);
  });

  it('GET /url/:id should redirect to the original URL', async () => {
    const accessToken = await createAccessToken();

    const createdUrl = await request(app.getHttpServer())
      .post('/url/shorten')
      .set('Authorization', `Bearer ${accessToken}`)
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
