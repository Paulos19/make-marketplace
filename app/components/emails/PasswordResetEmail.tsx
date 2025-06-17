import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Button, Tailwind, Img } from '@react-email/components';

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail: React.FC<Readonly<PasswordResetEmailProps>> = ({ resetLink }) => (
  <Html>
    <Head />
    <Preview>Redefinição de senha para sua conta Zacaplace</Preview>
    <Tailwind>
      <Body className="bg-slate-100 p-4 font-sans">
        <Container className="bg-white border border-slate-200 p-8 rounded-lg max-w-lg mx-auto">
          <Section className="text-center mb-8">
            <Img src="https://www.zacaplace.com.br/logo.svg" width="180" alt="Zacaplace Logo" />
          </Section>
          <Heading as="h2" className="text-2xl font-bold text-purple-700 text-center">Esqueceu sua senha, cumpadi?</Heading>
          <Text className="text-slate-700 text-base leading-relaxed">
            Sem problemas! Acontece nas melhores famílias de trapalhões. Recebemos uma solicitação para redefinir a senha da sua conta no Zacaplace.
          </Text>
          <Text className="text-slate-700 text-base leading-relaxed">Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.</Text>
          <Section className="text-center my-6">
            <Button className="bg-orange-500 text-white font-bold py-3 px-6 rounded-md" href={resetLink}>
              Redefinir Minha Senha
            </Button>
          </Section>
          <Text className="text-sm text-slate-500">Se você não solicitou uma redefinição de senha, pode ignorar este e-mail.</Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);