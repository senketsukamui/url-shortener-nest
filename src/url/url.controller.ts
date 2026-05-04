import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlService } from './url.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createUrlDto: CreateUrlDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.urlService.create(createUrlDto, request.user.id);
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
