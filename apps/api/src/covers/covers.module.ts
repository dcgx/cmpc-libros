import { Module } from '@nestjs/common';
import { COVER_FETCH, CoversService } from './covers.service';
import { CoversController } from './covers.controller';

@Module({
  controllers: [CoversController],
  providers: [CoversService, { provide: COVER_FETCH, useValue: fetch }],
})
export class CoversModule {}
