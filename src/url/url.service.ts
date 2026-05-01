import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { generateShortCode } from './helpers/generate-short-code';

type UrlItem = {
  short_url: string;
  long_url: string;
};

@Injectable()
export class UrlService {
  private urls: UrlItem[] = [];

  create(createUrlDto: CreateUrlDto) {
    const duplicate = this.checkUrlDuplicate(createUrlDto.url);
    if (duplicate) {
      return duplicate;
    }

    let shortUrl = generateShortCode();

    while (this.doesShortCodeExist(shortUrl)) {
      shortUrl = generateShortCode();
    }

    const item = {
      short_url: shortUrl,
      long_url: createUrlDto.url,
    };
    this.urls.push(item);
    return item;
  }

  findAll() {
    return this.urls;
  }

  redirect(id: string) {
    const url = this.getLongUrl(id);
    return { url, statusCode: 302 };
  }

  getLongUrl(shortUrl: string): string {
    const url = this.urls.find((item) => item.short_url === shortUrl);

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    return url.long_url;
  }

  checkUrlDuplicate(longUrl: string): UrlItem | undefined {
    return this.urls.find((item) => item.long_url === longUrl);
  }

  doesShortCodeExist(code: string): boolean {
    return this.urls.some((item) => item.short_url === code);
  }
}
