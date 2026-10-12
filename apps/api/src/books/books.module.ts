import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
