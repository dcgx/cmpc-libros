import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipTransform } from '../common/decorators/skip-transform.decorator';
import { RequestUser } from '../common/types/request-user';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksDto } from './dto/list-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { imageUploadOptions } from './upload';

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  list(@Query() query: ListBooksDto) {
    return this.books.list(query);
  }

  @Get('export')
  @SkipTransform()
  async export(@Query() query: ListBooksDto, @CurrentUser() user: RequestUser, @Req() request: Request) {
    const csv = await this.books.exportCsv(query, user, request.ip);
    return new StreamableFile(Buffer.from(`\uFEFF${csv}`, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="libros.csv"',
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.books.findOne(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'authorName', 'publisherName', 'genreName', 'price', 'stock', 'available', 'image'],
      properties: {
        title: { type: 'string' },
        authorName: { type: 'string' },
        publisherName: { type: 'string' },
        genreName: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'integer' },
        available: { type: 'boolean' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() dto: CreateBookDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    return this.books.create(dto, file, user, request.ip);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    return this.books.update(id, dto, file, user, request.ip);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser, @Req() request: Request) {
    return this.books.remove(id, user, request.ip);
  }
}
