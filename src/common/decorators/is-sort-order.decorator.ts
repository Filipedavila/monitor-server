import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export const SORT_ORDERS = ['ASC', 'DESC','asc','desc'] as const;
export type SortOrder = typeof SORT_ORDERS[number];

export function IsSortOrder(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSortOrder',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === undefined || value === null) return true;
          
          return SORT_ORDERS.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `Property ${args.property} must be a valid sort order (${SORT_ORDERS.join(', ')}).`;
        },
      },
    });
  };
}