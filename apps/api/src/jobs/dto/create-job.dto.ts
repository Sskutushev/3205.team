import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';

export class CreateJobDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUrl(
    { require_protocol: true },
    {
      each: true,
    },
  )
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
          .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
          .filter((entry) => entry !== '')
      : value,
  )
  public urls!: string[];
}
