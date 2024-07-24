"use server";

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z
    .string({
      required_error: "패스워드를 입력하세요.",
    })
    .min(PASSWORD_MIN_LENGTH)
    .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
});

export async function handleForm(prevState: any, formData: FormData) {
  // await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초동안 기다리기
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const result = formSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  } else {
    console.log(result.data);
  }
}
