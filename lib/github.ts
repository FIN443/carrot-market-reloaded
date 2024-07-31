export async function getGithubAccessToken(code: string) {
  const accessTokenParams = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
  }).toString();
  const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
  // const accessTokenResponse = await (await fetch(accessTokenURL)).json();
  const accessTokenResponse = await fetch(accessTokenURL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  const accessTokenData = await accessTokenResponse.json();
  return accessTokenData;
}

export async function getGithubData(access_token: string, option: string) {
  const githubResponse = await fetch(`https://api.github.com/${option}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-cache",
  });
  const githubData = await githubResponse.json();
  return githubData;
}
