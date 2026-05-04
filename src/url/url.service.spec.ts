import { NotFoundException } from '@nestjs/common';
import { UrlService } from './url.service';

describe('UrlService', () => {
  let service: UrlService;
  let prisma: {
    url: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      url: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UrlService(prisma as any);
  });

  describe('create', () => {
    it('should create a shortened URL item in the database', async () => {
      const createdUrl = {
        id: 'url-id',
        shortUrl: 'abc123',
        longUrl: 'https://example.com/articles/1',
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.url.findFirst.mockResolvedValue(null);
      prisma.url.findUnique.mockResolvedValue(null);
      prisma.url.create.mockResolvedValue(createdUrl);

      const result = await service.create(
        { url: 'https://example.com/articles/1' },
        'user-id',
      );

      expect(prisma.url.findFirst).toHaveBeenCalledWith({
        where: { longUrl: 'https://example.com/articles/1', userId: 'user-id' },
      });
      expect(prisma.url.findUnique).toHaveBeenCalledWith({
        where: { shortUrl: expect.any(String) },
        select: { id: true },
      });
      expect(prisma.url.create).toHaveBeenCalledWith({
        data: {
          shortUrl: expect.any(String),
          longUrl: 'https://example.com/articles/1',
          userId: 'user-id',
        },
      });
      expect(result).toBe(createdUrl);
    });

    it('should return the existing item when the long URL already exists', async () => {
      const existingUrl = {
        id: 'url-id',
        shortUrl: 'abc123',
        longUrl: 'https://example.com',
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.url.findFirst.mockResolvedValue(existingUrl);

      const result = await service.create({ url: 'https://example.com' }, 'user-id');

      expect(result).toBe(existingUrl);
      expect(prisma.url.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all saved URL items from the database', async () => {
      const urls = [
        {
          id: 'first-url-id',
          shortUrl: 'abc123',
          longUrl: 'https://example.com/one',
          clicks: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'second-url-id',
          shortUrl: 'def456',
          longUrl: 'https://example.com/two',
          clicks: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.url.findMany.mockResolvedValue(urls);

      await expect(service.findAll()).resolves.toBe(urls);
      expect(prisma.url.findMany).toHaveBeenCalledWith();
    });
  });

  describe('getLongUrl', () => {
    it('should increment clicks and return the long URL for an existing short code', async () => {
      prisma.url.update.mockResolvedValue({ longUrl: 'https://example.com' });

      await expect(service.getLongUrl('abc123')).resolves.toBe('https://example.com');
      expect(prisma.url.update).toHaveBeenCalledWith({
        where: { shortUrl: 'abc123' },
        data: {
          clicks: {
            increment: 1,
          },
        },
        select: { longUrl: true },
      });
    });

    it('should throw NotFoundException when the short code does not exist', async () => {
      prisma.url.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.getLongUrl('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkUrlDuplicate', () => {
    it('should return the existing URL item when a duplicate long URL exists', async () => {
      const existingUrl = {
        id: 'url-id',
        shortUrl: 'abc123',
        longUrl: 'https://example.com',
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.url.findFirst.mockResolvedValue(existingUrl);

      await expect(
        service.checkUrlDuplicate('https://example.com', 'user-id'),
      ).resolves.toBe(existingUrl);
      expect(prisma.url.findFirst).toHaveBeenCalledWith({
        where: { longUrl: 'https://example.com', userId: 'user-id' },
      });
    });

    it('should return null when no duplicate long URL exists', async () => {
      prisma.url.findFirst.mockResolvedValue(null);

      await expect(
        service.checkUrlDuplicate('https://example.com', 'user-id'),
      ).resolves.toBeNull();
    });
  });

  describe('doesShortCodeExist', () => {
    it('should return true when the short code exists', async () => {
      prisma.url.findUnique.mockResolvedValue({ id: 'url-id' });

      await expect(service.doesShortCodeExist('abc123')).resolves.toBe(true);
      expect(prisma.url.findUnique).toHaveBeenCalledWith({
        where: { shortUrl: 'abc123' },
        select: { id: true },
      });
    });

    it('should return false when the short code does not exist', async () => {
      prisma.url.findUnique.mockResolvedValue(null);

      await expect(service.doesShortCodeExist('missing')).resolves.toBe(false);
    });
  });
});
