"use server";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "@/lib/constants";
import db from "@/lib/db";
// zod는 백엔드 validation 라이브러리
import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";
import logIn from "@/lib/login";

// At least one uppercase letter, one lowercase letter, one number and one special character

const checkUsername = (username: string) => !username.includes("potato");

const checkPasswords = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

// const checkUniqueUsername = async (username: string) => {
//   const user = await db.user.findUnique({
//     where: {
//       username,
//     },
//     select: {
//       id: true,
//     },
//   });
//   // if (user) {
//   //   return false;
//   // } else {
//   //   return true;
//   // }
//   return Boolean(user) === false; // !Boolean(user)
// };

// const checkUniqueEmail = async (email: string) => {
//   const user = await db.user.findUnique({
//     where: {
//       email,
//     },
//     select: {
//       id: true,
//     },
//   });
//   return Boolean(user) === false;
// };

const formSchema = z
  .object({
    username: z
      .string({
        invalid_type_error: "Username은 문자형이여야 합니다.",
        required_error: "Username은 필수로 입력해야 합니다.",
      })
      // .min(3, "Username이 너무 짧습니다.")
      // .max(10, "Username이 너무 깁니다.")
      .toLowerCase() // 소문자 변환
      .trim() // 양옆 공백제거
      // .transform((username) => `🔥 ${username} 🔥`) // username 특정 조건으로 변환
      .refine(checkUsername, "potato가 포함되면 안됩니다."),
    // check if username is taken
    // .refine(checkUniqueUsername, "이미 존재하는 아이디입니다."),
    email: z.string().email().toLowerCase().trim(),
    // check if the email is already used
    // .refine(checkUniqueEmail, "해당 이메일로 가입한 계정이 이미 존재합니다."),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirm_password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .superRefine(async ({ username }, ctx) => {
    const user = await db.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
      },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "해당 사용자명이 이미 사용중입니다.",
        path: ["username"],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .superRefine(async ({ email }, ctx) => {
    const user = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "해당 이메일이 이미 사용중입니다.",
        path: ["email"],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  .refine(checkPasswords, {
    // password, confirm_password 둘 다 확인하기 위해 밖에다 refine() 선언
    message: "두 패스워드는 반드시 같아야 합니다.",
    path: ["confirm_password"],
  });

export async function createAccount(prevState: any, formData: FormData) {
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };
  const result = await formSchema.safeParseAsync(data); // try catch 문법 사용안하도록 data를 검증 후 parse 해줌
  if (!result.success) {
    console.log(result.error.flatten());
    return result.error.flatten(); // 짧은 에러 object 반환
  } else {
    // 모든 변환과 검증을 거친 데이터
    // hash password
    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    // save the user to db
    const user = await db.user.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });
    await logIn(user.id);
  }
}
