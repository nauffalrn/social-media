import { Injectable } from '@nestjs/common';
import { ConfigService, Path } from '@nestjs/config';

@Injectable()
export class EnvVariable<T> {
  constructor(private readonly configService: ConfigService<T, true>) {}

  get<K extends keyof T>(propertyPath: Path<T>): T[K] {
    return this.configService.get(propertyPath, { infer: true });
  }
}
