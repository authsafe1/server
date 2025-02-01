import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateBillingDto {
  @IsIn(["PROFESSIONAL", "ENTERPRISE"])
  type: "PROFESSIONAL" | "ENTERPRISE";
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
