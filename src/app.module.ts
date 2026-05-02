import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UrlModule } from './url/url.module';

@Module({
  imports: [PrismaModule, UrlModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
