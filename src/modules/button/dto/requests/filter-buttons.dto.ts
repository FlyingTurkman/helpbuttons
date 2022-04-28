import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class FilterButtonsDto {
  @ApiProperty({
    name: 'buttonsWithin',
    title: 'Other Buttons Within',
    description:
      'Get other buttons within the specified area in kilometer',
    type: Number,
    example: 4,
    required: false,
    isArray: false,
  })
  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 10,
  })
  buttonsWithin?: number;

  @ApiProperty({
    name: 'latitude',
    title: 'Latitude',
    description:
      'Latitude of the center. This is only required in case you pass the buttonsWithin',
    type: Number,
    isArray: false,
    required: false,
    example: 39.23864,
  })
  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 20,
  })
  latitude?: number;

  @ApiProperty({
    name: 'longitude',
    title: 'Longitude',
    description:
      'Longitude of the center. This is only required in case you pass the buttonsWithin',
    type: Number,
    isArray: false,
    required: false,
    example: -8.67096,
  })
  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 20,
  })
  longitude?: number;
  
  @ApiProperty({
    name: 'radius',
    title: 'Radius',
    description:
      'Radius in km from the center',
    type: Number,
    isArray: false,
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 20,
  })
  radius?: number;
}
