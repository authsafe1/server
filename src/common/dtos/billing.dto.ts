import { IsNotEmpty, IsString } from "class-validator";

export class CreateBillingDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
