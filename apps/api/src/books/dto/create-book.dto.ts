import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export function toBoolean(value: unknown): unknown {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, { message: 'El autor debe tener al menos 2 caracteres' })
  @MaxLength(120)
  authorName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, { message: 'La editorial debe tener al menos 2 caracteres' })
  @MaxLength(120)
  publisherName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, { message: 'El género debe tener al menos 2 caracteres' })
  @MaxLength(80)
  genreName!: string;

  @ApiProperty({ example: 14990 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio no es válido' })
  @Min(0)
  @Max(99999999.99)
  price!: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un entero' })
  @Min(0)
  @Max(1000000)
  stock!: number;

  @ApiProperty({ example: true })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'La disponibilidad debe ser verdadero o falso' })
  available!: boolean;
}
