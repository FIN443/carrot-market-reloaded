import db from "@/lib/db";
import { getGithubAccessToken, getGithubData } from "@/lib/github";
import { generateRandomString } from "@/lib/genString";
import logIn from "@/lib/login";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 2. GitHub가 사용자를 사이트로 다시 리디렉션
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return notFound();
  }
  const { error, access_token } = await getGithubAccessToken(code);
  if (error) {
    return new Response(null, {
      status: 400,
    });
  }
  // 3. 액세스 토큰을 사용하여 API에 액세스
  const { id, avatar_url, login } = await getGithubData(access_token, "user");
  const emailData = await getGithubData(access_token, "user/emails");
  const { email } = emailData[0];
  // 4. 가입 여부 확인
  const user = await db.user.findUnique({
    where: {
      github_id: id + "",
    },
    select: {
      id: true,
    },
  });
  if (user) {
    return await logIn(user.id);
  }
  // 5. 회원가입
  const findUser = await db.user.findUnique({
    where: {
      username: login,
    },
    select: {
      id: true,
    },
  });
  const randomStr = generateRandomString();
  const newUser = await db.user.create({
    data: {
      username: findUser ? login + "_" + randomStr : login, // 중복될 수 있음
      github_id: id + "",
      avatar: avatar_url,
      email,
    },
    select: {
      id: true,
    },
  });
  await logIn(newUser.id);
}
