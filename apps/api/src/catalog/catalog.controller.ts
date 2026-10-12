import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('authors')
  authors() {
    return this.catalog.authors();
  }

  @Get('publishers')
  publishers() {
    return this.catalog.publishers();
  }

  @Get('genres')
  genres() {
    return this.catalog.genres();
  }
}
