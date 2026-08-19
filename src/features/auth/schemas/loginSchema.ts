import { z } from "zod";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const loginSchema = z.object({
  country: z
    .object({
      code: z.string(),
      dialCode: z.string(),
      flag: z.string(),
      name: z.string(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Please select a country" }),
  phone: z
    .string()
    .min(1, "Enter your phone number")
    .max(20, "Phone number is too long")
    .refine((val) => digitsOnly(val).length >= 7, {
      message: "Enter a valid phone number",
    }),
});

export type LoginFormInput = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;
