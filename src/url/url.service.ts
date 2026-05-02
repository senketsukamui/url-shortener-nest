import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { generateShortCode } from './helpers/generate-short-code';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService) {}

  async create(createUrlDto: CreateUrlDto) {
    const duplicate = await this.checkUrlDuplicate(createUrlDto.url);
    if (duplicate) {
      return duplicate;
    }

    let shortUrl = generateShortCode();

    while (await this.doesShortCodeExist(shortUrl)) {
      shortUrl = generateShortCode();
    }

    return this.prisma.url.create({
      data: {
        shortUrl,
        longUrl: createUrlDto.url,
      },
    });
  }

  findAll() {
    return this.prisma.url.findMany();
  }

  async redirect(id: string) {
    const url = await this.getLongUrl(id);
    return { url, statusCode: 302 };
  }

  async getLongUrl(shortUrl: string): Promise<string> {
    const url = await this.prisma.url.findUnique({
      where: { shortUrl },
      select: { longUrl: true },
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    return url.longUrl;
  }

  async checkUrlDuplicate(longUrl: string) {
    return this.prisma.url.findFirst({
      where: { longUrl },
    });
  }

  async doesShortCodeExist(code: string): Promise<boolean> {
    const existingUrl = await this.prisma.url.findUnique({
      where: { shortUrl: code },
      select: { id: true },
    });

    return Boolean(existingUrl);
  }
}
