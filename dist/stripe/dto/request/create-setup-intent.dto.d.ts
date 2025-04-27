export declare enum CallWith {
    KWAY = "Kway",
    TITI = "TiTi"
}
export declare class CreatePaymentIntentDto {
    fullName: string;
    phoneNumber: string;
    topic: string;
    product: string;
    callDescription: string;
    email: string;
    callWith: CallWith;
}
