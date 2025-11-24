export function HandlePhoneNumber(str: string): string {
  if (!str) return str;
  const checkfirstFive = str.slice(0, 5);
  //remove the fifth character if it is 0
  if (checkfirstFive[4] === '0' && str.startsWith('+961')) {
    return str.slice(0, 4) + str.slice(5);
  }
  return str.replace(/[\s-()]/g, '');
}

// export class SendFunctionService {
//   constructor(private readonly microservice: ClientProxy) {}
//   async SendMessage(cmd: string, message: unknown): Promise<any> {
//     const res = await firstValueFrom(this.microservice.send({ cmd }, message));
//     return checkPatternResponse(res);
//   }
// }
