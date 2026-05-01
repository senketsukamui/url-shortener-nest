import { Body, Controller, Get, Param, Post, Redirect } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlService } from './url.service';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  create(@Body() createUrlDto: CreateUrlDto) {
    return this.urlService.create(createUrlDto);
  }

  @Get()
  findAll() {
    return this.urlService.findAll();
  }

  @Get(':id')
  @Redirect()
  redirect(@Param('id') id: string) {
    return this.urlService.redirect(id);
  }
}
