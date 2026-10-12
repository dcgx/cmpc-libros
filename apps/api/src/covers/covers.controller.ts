import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CoversService } from './covers.service';
import { FindCoverDto } from './dto/find-cover.dto';

@ApiTags('covers')
@ApiBearerAuth()
@Controller('covers')
export class CoversController {
  constructor(private readonly covers: CoversService) {}

  @Get()
  @ApiQuery({ name: 'isbn', required: false, example: '9780140328721' })
  @ApiQuery({ name: 'title', required: false, example: 'Rayuela' })
  find(@Query() query: FindCoverDto) {
    return this.covers.find(query);
  }
}
