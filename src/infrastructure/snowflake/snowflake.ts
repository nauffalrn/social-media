import { Snowflake } from '@sapphire/snowflake';

const EPOCH = new Date('2020-07-18T00:00:00.000Z');

const snowflake = new Snowflake(EPOCH);

export function generateSnowflakeId(): bigint {
  return snowflake.generate();
}

export function extractDateFromSnowflake(id: string | bigint): Date {
  return new Date(snowflake.timestampFrom(BigInt(id)));
}
