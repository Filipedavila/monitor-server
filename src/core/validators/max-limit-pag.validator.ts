import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments, 
  registerDecorator, 
  ValidationOptions 
} from 'class-validator';

@ValidatorConstraint({ name: 'MaxOffsetLimit', async: true })
@Injectable()
export class MaxOffsetLimitConstraint implements ValidatorConstraintInterface {
  constructor(private readonly configService: ConfigService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (typeof value !== 'number') return false;

    const envLimit = this.configService.get<number>('MAX_PAGINATION_LIMIT');
    const maxLimit = envLimit ? Number(envLimit) : 100;

    return value <= maxLimit;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Property ${args.property} exceeds the maximum allowed pagination limit configured by the system.`;
  }
}

export function IsMaxOffsetLimit(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMaxOffsetLimit',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: MaxOffsetLimitConstraint, 
    });
  };
}