"use server";
// zod는 백엔드 validation 라이브러리
import { z } from "zod";

// At least one uppercase letter, one lowercase letter, one number and one special character
const passwordRegex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).+$/
);

const checkUsername = (username: string) => !username.includes("potato");

const checkPasswords = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

const formSchema = z
  .object({
    username: z
      .string({
        invalid_type_error: "Username은 문자형이여야 합니다.",
        required_error: "Username은 필수로 입력해야 합니다.",
      })
      .min(3, "Username이 너무 짧습니다.")
      // .max(10, "Username이 너무 깁니다.")
      .toLowerCase() // 소문자 변환
      .trim() // 양옆 공백제거
      .transform((username) => `🔥 ${username} 🔥`) // username 특정 조건으로 변환
      .refine(checkUsername, "potato가 포함되면 안됩니다."),
    email: z.string().email().toLowerCase().trim(),
    password: z
      .string()
      .min(4)
      .regex(
        passwordRegex,
        "패스워드는 소문자, 대문자, 숫자, 특수문자를 포함해야 합니다."
      ),
    confirm_password: z.string().min(4),
  })
  .refine(checkPasswords, {
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
  const result = formSchema.safeParse(data); // try catch 문법 사용안하도록 parse 해줌
  if (!result.success) {
    return result.error.flatten();
  } else {
    console.log(result.data);
  }
}
