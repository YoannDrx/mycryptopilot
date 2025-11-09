import BilingualMarkdownEmail from "./bilingual-markdown.email";

export default function TestBilingualEmail() {
  const markdownEN = `
# Welcome to MyCryptoPilot!

Hello **John Doe**,

Thank you for joining our platform. Your account has been successfully created.

Here's what you can do next:

- Complete your profile
- Follow your first trader
- Explore our signal feed

[Get Started](https://mycryptopilot.app/dashboard)
  `;

  const markdownFR = `
# Bienvenue sur MyCryptoPilot !

Bonjour **John Doe**,

Merci de rejoindre notre plateforme. Votre compte a été créé avec succès.

Voici ce que vous pouvez faire ensuite :

- Compléter votre profil
- Suivre votre premier trader
- Explorer notre fil de signaux

[Commencer](https://mycryptopilot.app/dashboard)
  `;

  return (
    <BilingualMarkdownEmail
      markdownEN={markdownEN}
      markdownFR={markdownFR}
      preview="Welcome to MyCryptoPilot - Bienvenue sur MyCryptoPilot"
    />
  );
}
