import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import {
  CountryCode,
  getCountries,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { BadRequestException } from 'src/error/bad-request-error';

export function CustomIsNotEmptyObjectValidator(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            value && typeof value === 'object' && Object.keys(value).length > 0
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should not be an empty object`;
        },
      },
    });
  };
}

export function CustomEmailValidator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'customEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(email: string, args: ValidationArguments) {
          // Regular expression to match invalid email patterns
          const invalidEmailRegex =
            /^[-_!@#$%^&*()=+{}[\]:;"'|<>?,./\\].*|.*[-_!@#$%^&*()=+{}[\]:;"'|<>?,./\\]@.*$/;
          if (invalidEmailRegex.test(email)) {
            return false;
          }

          const splitEmail = email.split('@')[0];
          const firstSymbol = splitEmail.match(/^[^a-zA-Z0-9]/)?.[0];
          const lastSymbol = splitEmail.match(/[^a-zA-Z0-9]$/)?.[0];

          if (firstSymbol || lastSymbol) {
            const invalidSymbolRegex = /[-_!@#$%^&*()=+{}[\]:;"'|<>?,./\\]/; // All symbols added
            if (firstSymbol && invalidSymbolRegex.test(firstSymbol)) {
              return false;
            }
            if (lastSymbol && invalidSymbolRegex.test(lastSymbol)) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `Invalid email format: ${args.value}`;
        },
      },
    });
  };
}

export function CustomPhoneValidator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'customPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const countryCode = (args.object as any)['phoneNumberISOCode']; // Extract countryCode from the object
          console.log('countryCode', countryCode);
          if (!countryCode) {
            return false;
          }
          let cleanedValue = value.replace(/[\s-+]/g, '');
          if (countryCode === 'US') {
            cleanedValue = value.replace(/[\s-()-+]/g, '');
          }
          console.log('cleanedValue', cleanedValue);
          const testValidation = /^\d+$/.test(cleanedValue);
          const RegionCodeArray = getCountries();
          if (
            !countryCode ||
            !RegionCodeArray.includes(countryCode) ||
            !testValidation
          ) {
            return false; // Country code is required and must be valid
          }

          try {
            return isValidPhoneNumber(cleanedValue, countryCode);
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `Invalid phone number or country code`;
        },
      },
    });
  };
}

// Functional variant of the custom phone validator to use outside DTOs
export function isValidPhoneUsingISO(
  value: string,
  countryCode: CountryCode,
): boolean {
  if (!countryCode) return false;
  let cleanedValue = value.replace(/[\s-+]/g, '');
  if (countryCode === 'US') {
    cleanedValue = value.replace(/[\s-()-+]/g, '');
  }
  const digitsOnly = /^\d+$/.test(cleanedValue);
  const RegionCodeArray = getCountries();
  if (!RegionCodeArray.includes(countryCode) || !digitsOnly) {
    return false;
  }
  try {
    return isValidPhoneNumber(cleanedValue, countryCode);
  } catch {
    return false;
  }
}

export function CustomIsPhoneNumberValidator(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const phoneNumber = parsePhoneNumberFromString(
            obj['phoneNumber'],
            obj['phoneNumberISOCode'],
          );

          if (!phoneNumber || !phoneNumber.isValid()) {
            throw new BadRequestException('Invalid PhoneNumber');
          }

          return phoneNumber.isValid();
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid phone number format';
        },
      },
    });
  };
}
