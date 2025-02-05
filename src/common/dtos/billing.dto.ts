import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateBillingDto {
  @ApiProperty()
  @IsIn(["PROFESSIONAL", "ENTERPRISE"])
  type: "PROFESSIONAL" | "ENTERPRISE";
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
