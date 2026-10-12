import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export function blankToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export class FindCoverDto {
  @ApiPropertyOptional({ example: '9780140328721' })
  @Transform(({ value }) => blankToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(32)
  isbn?: string;

  @ApiPropertyOptional({ example: 'Rayuela' })
  @Transform(({ value }) => blankToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
