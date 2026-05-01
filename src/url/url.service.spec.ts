import { NotFoundException } from '@nestjs/common';
import { UrlService } from './url.service';

describe('UrlService', () => {
  let service: UrlService;

  beforeEach(() => {
    service = new UrlService();
  });

  describe('create', () => {
    it('should create a shortened URL item', () => {
      const result = service.create({ url: 'https://example.com/articles/1' });

      expect(result).toEqual({
        short_url: expect.any(String),
        long_url: 'https://example.com/articles/1',
      });
      expect(result.short_url).toHaveLength(6);
    });

    it('should return the existing item when the long URL already exists', () => {
      const firstResult = service.create({ url: 'https://example.com' });
      const secondResult = service.create({ url: 'https://example.com' });

      expect(secondResult).toBe(firstResult);
      expect(service.findAll()).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return all saved URL items', () => {
      const firstUrl = service.create({ url: 'https://example.com/one' });
      const secondUrl = service.create({ url: 'https://example.com/two' });

      expect(service.findAll()).toEqual([firstUrl, secondUrl]);
    });
  });

  describe('getLongUrl', () => {
    it('should return the long URL for an existing short code', () => {
      const item = service.create({ url: 'https://example.com' });

      expect(service.getLongUrl(item.short_url)).toBe('https://example.com');
    });

    it('should throw NotFoundException when the short code does not exist', () => {
      expect(() => service.getLongUrl('missing')).toThrow(NotFoundException);
    });
  });

  describe('checkUrlDuplicate', () => {
    it('should return the existing URL item when a duplicate long URL exists', () => {
      const item = service.create({ url: 'https://example.com' });

      expect(service.checkUrlDuplicate('https://example.com')).toBe(item);
    });

    it('should return undefined when no duplicate long URL exists', () => {
      expect(service.checkUrlDuplicate('https://example.com')).toBeUndefined();
    });
  });

  describe('doesShortCodeExist', () => {
    it('should return true when the short code exists', () => {
      const item = service.create({ url: 'https://example.com' });

      expect(service.doesShortCodeExist(item.short_url)).toBe(true);
    });

    it('should return false when the short code does not exist', () => {
      expect(service.doesShortCodeExist('missing')).toBe(false);
    });
  });
});
