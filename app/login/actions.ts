"use server";

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";

const checkEmailExists = async (email: string) => {
  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });
  return Boolean(user);
};

const formSchema = z.object({
  email: z
    .string()
    .email()
    .toLowerCase()
    // find a user with the email
    .refine(checkEmailExists, "이 이메일을 사용하는 계정이 존재하지 않습니다."),
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
  const result = await formSchema.spa(data); // safeParseAsync()
  if (!result.success) {
    return result.error.flatten();
  } else {
    // if the user is found, checl password hash
    const user = await db.user.findUnique({
      where: {
        email: result.data.email,
      },
      select: {
        id: true,
        password: true,
      },
    });
    const ok = await bcrypt.compare(
      result.data.password,
      user!.password ?? "xxx"
    );
    // log the user in
    if (ok) {
      const session = await getSession();
      session.id = user!.id;
      // redirect "/profile"
      redirect("/profile");
    } else {
      return {
        fieldErrors: {
          email: [],
          password: ["잘못된 비밀번호입니다."],
        },
      };
    }
  }
}
