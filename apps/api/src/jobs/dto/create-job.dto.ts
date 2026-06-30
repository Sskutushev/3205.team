import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';

/**
 * Single source of validation truth. The `@Transform` normalizes the input
 * (trim, drop blanks, de-duplicate) before the validators run, so the service
 * can trust `urls` as-is — there is no second validation pass downstream.
 */
export class CreateJobDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    const normalized = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '');

    return Array.from(new Set(normalized));
  })
  public urls!: string[];
}
