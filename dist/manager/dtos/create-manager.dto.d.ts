import { Role } from '../../decorators/roles/role.enum';
export declare class CreateManagerDto {
    username: string;
    password: string;
    email: string;
    roles: Role[];
}
