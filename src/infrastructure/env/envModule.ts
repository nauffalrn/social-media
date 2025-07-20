import { ConsoleLogger, DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvModuleOptions } from './envOptions';
import { EnvVariable } from './envService';



@Module({})
export class EnvModule {
  private static readonly logger = new ConsoleLogger(EnvModule.name);

  static forRoot(options: EnvModuleOptions): DynamicModule {
    return {
      global: options.global ?? false,
      module: EnvModule,
      imports: [
        ConfigModule.forRoot({
          validate: (config) => {
            const { error: parsedError, data } = options.schema.safeParse(config);

            if (parsedError) {
              const errors: Array<{ message: string }> = JSON.parse(parsedError.message);

              for (const error of errors) {
                this.logger.error(error.message);
              }

              throw new Error(`${options.name} env variables validation failed.`);
            }

            this.logger.log(`${options.name} env variables OK.`);

            return data;
          },
        }),
      ],
      providers: [EnvVariable],
      exports: [EnvVariable],
    };
  }
}
