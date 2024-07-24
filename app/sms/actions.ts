"use server";

import { z } from "zod";
import validator from "validator";
import { redirect } from "next/navigation";

const phoneSchema = z
  .string()
  .trim()
  .refine(
    (phone) => validator.isMobilePhone(phone, "ko-KR"),
    "잘못된 번호 형식입니다."
  );
const tokenSchema = z.coerce.number().min(100000).max(999999); // string을 number로 변환 시도

interface ActionState {
  token: boolean;
}

export async function smsLogIn(prevState: ActionState, formData: FormData) {
  const phone = formData.get("phone");
  const token = formData.get("token");
  if (!prevState.token) {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      return {
        // 전화번호 검증 실패시
        token: false,
        error: result.error.flatten(),
      };
    } else {
      // 토큰 입력으로 변환
      return {
        token: true,
      };
    }
  } else {
    const result = tokenSchema.safeParse(token);
    if (!result.success) {
      // 토큰 검증 실패시
      return {
        token: true,
        error: result.error.flatten(),
      };
    } else {
      // 토큰 검증 성공시
      redirect("/");
    }
  }
}
